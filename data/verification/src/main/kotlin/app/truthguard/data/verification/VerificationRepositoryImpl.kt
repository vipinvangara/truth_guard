package app.truthguard.data.verification

import android.util.Log
import app.truthguard.data.verification.network.VerifyApi
import app.truthguard.data.verification.network.VerifyRequestDto
import app.truthguard.data.verification.network.toDomain
import app.truthguard.domain.model.Claim
import app.truthguard.domain.repository.VerificationRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class VerificationRepositoryImpl
@Inject
constructor(
    private val verifyApi: VerifyApi,
    private val deviceTokenProvider: DeviceTokenProvider
) : VerificationRepository {
    override suspend fun verify(scanId: String, text: String): List<Claim> = try {
        verifyApi.verify(
            deviceToken = deviceTokenProvider.get(),
            request = VerifyRequestDto(text = text)
        ).claims.map { it.toDomain(scanId) }
    } catch (
        // Logged for diagnosis, then rethrown unchanged so callers still see
        // the original exception type/message.
        @Suppress("TooGenericExceptionCaught") e: Exception
    ) {
        Log.e(TAG, "verify() failed for scan $scanId against ${BuildConfig.API_BASE_URL}", e)
        throw e
    }

    private companion object {
        const val TAG = "VerificationRepo"
    }
}
