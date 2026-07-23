package app.truthguard.domain.model

data class Scan(
    val id: String,
    val mediaType: MediaType,
    val sourceText: String?,
    val localMediaPath: String?,
    val status: ScanStatus,
    val createdAtEpochMillis: Long,
    /** Populated once an image scan has run on-device extraction. Null for text scans. */
    val ocrText: String? = null,
    val detectedLanguage: String? = null,
    val translatedText: String? = null,
    val provenance: ImageProvenance? = null,
    val perceptualHash: String? = null
)
