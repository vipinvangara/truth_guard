package app.truthguard.domain.model

data class Scan(
    val id: String,
    val mediaType: MediaType,
    val sourceText: String?,
    val localMediaPath: String?,
    val status: ScanStatus,
    val createdAtEpochMillis: Long
)
