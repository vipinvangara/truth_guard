package app.truthguard.domain.usecase

import app.truthguard.domain.repository.SettingsRepository

/**
 * Records the user's explicit cloud-verification consent. The caller then runs
 * [VerifyScanUseCase] to actually verify the scan that prompted it.
 */
class EnableCloudVerificationUseCase(
    private val settingsRepository: SettingsRepository
) {
    suspend operator fun invoke() {
        settingsRepository.setCloudConsent(true)
    }
}
