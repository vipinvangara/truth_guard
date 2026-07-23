package app.truthguard.domain.usecase

import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.repository.AnalysisScheduler
import app.truthguard.domain.repository.ScanRepository

class RetryAnalysisUseCase(
    private val scanRepository: ScanRepository,
    private val analysisScheduler: AnalysisScheduler
) {
    suspend operator fun invoke(scanId: String) {
        scanRepository.updateStatus(scanId, ScanStatus.QUEUED)
        analysisScheduler.schedule(scanId)
    }
}
