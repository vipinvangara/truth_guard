package app.truthguard.domain.usecase

import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.repository.AnalysisScheduler
import app.truthguard.domain.repository.ScanRepository
import app.truthguard.domain.repository.SettingsRepository

/**
 * Records the user's explicit cloud-verification consent, then re-queues the
 * scan that prompted it so analysis can actually run.
 */
class EnableCloudVerificationUseCase(
    private val settingsRepository: SettingsRepository,
    private val scanRepository: ScanRepository,
    private val analysisScheduler: AnalysisScheduler
) {
    suspend operator fun invoke(scanId: String) {
        settingsRepository.setCloudConsent(true)
        scanRepository.updateStatus(scanId, ScanStatus.QUEUED)
        analysisScheduler.schedule(scanId)
    }
}
