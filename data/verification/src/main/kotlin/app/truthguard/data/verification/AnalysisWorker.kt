package app.truthguard.data.verification

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import app.truthguard.data.verification.network.VerifyApi
import app.truthguard.data.verification.network.VerifyRequestDto
import app.truthguard.data.verification.network.toDomain
import app.truthguard.domain.model.MediaType
import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.repository.ScanRepository
import app.truthguard.domain.repository.SettingsRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.io.IOException
import kotlinx.coroutines.flow.first

/**
 * Runs the verification pipeline for one queued scan.
 *
 * Consent gate: if the user has not granted cloud consent, the scan is marked
 * LOCAL_ONLY (the verdict screen offers to enable and retry) — no text leaves
 * the device. Transient network failures retry with WorkManager backoff;
 * anything else marks the scan FAILED honestly.
 */
@HiltWorker
class AnalysisWorker
@AssistedInject
constructor(
    @Assisted appContext: Context,
    @Assisted params: WorkerParameters,
    private val scanRepository: ScanRepository,
    private val settingsRepository: SettingsRepository,
    private val verifyApi: VerifyApi,
    private val deviceTokenProvider: DeviceTokenProvider
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val scanId = inputData.getString(KEY_SCAN_ID) ?: return Result.failure()
        val scan = scanRepository.getScan(scanId) ?: return Result.failure()

        if (scan.mediaType != MediaType.TEXT || scan.sourceText.isNullOrBlank()) {
            // Image analysis arrives in P2; be honest rather than pretend.
            scanRepository.updateStatus(scanId, ScanStatus.LOCAL_ONLY)
            return Result.success()
        }

        if (!settingsRepository.cloudConsentGranted.first()) {
            scanRepository.updateStatus(scanId, ScanStatus.LOCAL_ONLY)
            return Result.success()
        }

        scanRepository.updateStatus(scanId, ScanStatus.RETRIEVING)

        return try {
            val response =
                verifyApi.verify(
                    deviceToken = deviceTokenProvider.get(),
                    request = VerifyRequestDto(text = scan.sourceText.orEmpty())
                )
            scanRepository.storeClaims(scanId, response.claims.map { it.toDomain(scanId) })
            scanRepository.updateStatus(scanId, ScanStatus.DONE)
            Result.success()
        } catch (e: IOException) {
            Log.w(TAG, "Network failure verifying scan $scanId; will retry", e)
            if (runAttemptCount < MAX_RETRIES) {
                scanRepository.updateStatus(scanId, ScanStatus.QUEUED)
                Result.retry()
            } else {
                scanRepository.updateStatus(scanId, ScanStatus.FAILED)
                Result.failure()
            }
        } catch (
            // Worker boundary: any unexpected failure must mark the scan FAILED
            // rather than crash the process, so the broad catch is intentional.
            @Suppress("TooGenericExceptionCaught") e: Exception
        ) {
            Log.e(TAG, "Verification failed for scan $scanId", e)
            scanRepository.updateStatus(scanId, ScanStatus.FAILED)
            Result.failure()
        }
    }

    companion object {
        const val KEY_SCAN_ID = "scan_id"
        private const val MAX_RETRIES = 3
        private const val TAG = "AnalysisWorker"
    }
}
