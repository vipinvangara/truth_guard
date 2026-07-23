package app.truthguard.data.vault.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "scans")
data class ScanEntity(
    @PrimaryKey val id: String,
    val mediaType: String,
    val sourceText: String?,
    val localMediaPath: String?,
    val status: String,
    val createdAtEpochMillis: Long,
)
