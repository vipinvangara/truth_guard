package app.truthguard.data.vault.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Transaction
import kotlinx.coroutines.flow.Flow

@Dao
interface ClaimDao {
    @Transaction
    @Query("SELECT * FROM claims WHERE scanId = :scanId")
    fun observeClaimsWithEvidence(scanId: String): Flow<List<ClaimWithEvidence>>

    @Insert
    suspend fun insertClaims(claims: List<ClaimEntity>)

    @Insert
    suspend fun insertEvidence(evidence: List<EvidenceEntity>)

    @Query("DELETE FROM claims WHERE scanId = :scanId")
    suspend fun deleteClaimsForScan(scanId: String)

    @Transaction
    suspend fun replaceResults(scanId: String, claims: List<ClaimEntity>, evidence: List<EvidenceEntity>) {
        deleteClaimsForScan(scanId)
        insertClaims(claims)
        insertEvidence(evidence)
    }
}
