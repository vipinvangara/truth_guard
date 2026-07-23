package app.truthguard.domain.repository

import app.truthguard.domain.model.Claim
import app.truthguard.domain.model.Scan
import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.model.SharedContent
import kotlinx.coroutines.flow.Flow

interface ScanRepository {
    /** Persists a new scan for the given content and returns it in [ScanStatus.QUEUED] state. */
    suspend fun create(content: SharedContent): Scan

    fun observeAll(): Flow<List<Scan>>

    fun observe(id: String): Flow<Scan?>

    fun observeClaims(scanId: String): Flow<List<Claim>>

    suspend fun getScan(id: String): Scan?

    suspend fun updateStatus(id: String, status: ScanStatus)

    /** Replaces any previous results for the scan with the given claims. */
    suspend fun storeClaims(scanId: String, claims: List<Claim>)
}
