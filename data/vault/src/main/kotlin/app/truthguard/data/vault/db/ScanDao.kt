package app.truthguard.data.vault.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface ScanDao {
    @Insert
    suspend fun insert(scan: ScanEntity)

    @Query("SELECT * FROM scans ORDER BY createdAtEpochMillis DESC")
    fun observeAll(): Flow<List<ScanEntity>>

    @Query("SELECT * FROM scans WHERE id = :id")
    fun observe(id: String): Flow<ScanEntity?>

    @Query("SELECT * FROM scans WHERE id = :id")
    suspend fun get(id: String): ScanEntity?

    @Query("UPDATE scans SET status = :status WHERE id = :id")
    suspend fun updateStatus(id: String, status: String)
}
