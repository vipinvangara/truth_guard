package app.truthguard.domain.usecase

import app.truthguard.domain.model.MediaType
import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.repository.ScanRepository
import app.truthguard.domain.repository.SettingsRepository
import app.truthguard.domain.repository.VerificationRepository

/**
 * Runs verification for a single scan, driven directly by the screen the user is
 * looking at — not deferred background work. Updates scan status as it progresses.
 *
 * Honest failure modes: without cloud consent, or for non-text media (image
 * support arrives in P2), the scan is marked LOCAL_ONLY rather than sent anywhere.
 */
class VerifyScanUseCase(
    private val scanRepository: ScanRepository,
    private val settingsRepository: SettingsRepository,
    private val verificationRepository: VerificationRepository
) {
    /**
     * @param force re-run even if the scan is already DONE (used by explicit retry).
     */
    suspend operator fun invoke(scanId: String, force: Boolean = false): Result<Unit> {
        val scan = scanRepository.getScan(scanId) ?: return Result.success(Unit)

        if (!force && scan.status == ScanStatus.DONE) return Result.success(Unit)

        if (scan.mediaType != MediaType.TEXT || scan.sourceText.isNullOrBlank()) {
            scanRepository.updateStatus(scanId, ScanStatus.LOCAL_ONLY)
            return Result.success(Unit)
        }

        if (!settingsRepository.isCloudConsentGranted()) {
            scanRepository.updateStatus(scanId, ScanStatus.LOCAL_ONLY)
            return Result.success(Unit)
        }

        scanRepository.updateStatus(scanId, ScanStatus.RETRIEVING)
        return runCatching {
            val claims = verificationRepository.verify(scanId, scan.sourceText)
            scanRepository.storeClaims(scanId, claims)
            scanRepository.updateStatus(scanId, ScanStatus.DONE)
        }.onFailure {
            scanRepository.updateStatus(scanId, ScanStatus.FAILED)
        }
    }
}
