package app.truthguard.data.vault.db

import androidx.room.ColumnInfo
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
    val ocrText: String? = null,
    val detectedLanguage: String? = null,
    val translatedText: String? = null,
    val provenanceCameraMake: String? = null,
    val provenanceCameraModel: String? = null,
    val provenanceCaptureDateUtc: String? = null,
    @ColumnInfo(defaultValue = "0") val provenanceHasGps: Boolean = false,
    val provenanceSoftwareTag: String? = null,
    val perceptualHash: String? = null
)
