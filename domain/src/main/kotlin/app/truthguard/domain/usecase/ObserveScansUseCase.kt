package app.truthguard.domain.usecase

import app.truthguard.domain.model.Scan
import app.truthguard.domain.repository.ScanRepository
import kotlinx.coroutines.flow.Flow

class ObserveScansUseCase(
    private val scanRepository: ScanRepository
) {
    operator fun invoke(): Flow<List<Scan>> = scanRepository.observeAll()
}
