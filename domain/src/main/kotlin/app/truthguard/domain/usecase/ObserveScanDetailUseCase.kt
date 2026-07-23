package app.truthguard.domain.usecase

import app.truthguard.domain.model.Claim
import app.truthguard.domain.model.Scan
import app.truthguard.domain.repository.ScanRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine

data class ScanDetail(
    val scan: Scan?,
    val claims: List<Claim>
)

class ObserveScanDetailUseCase(
    private val scanRepository: ScanRepository
) {
    operator fun invoke(scanId: String): Flow<ScanDetail> = combine(
        scanRepository.observe(scanId),
        scanRepository.observeClaims(scanId)
    ) { scan, claims -> ScanDetail(scan, claims) }
}
