package app.truthguard.domain.model

/**
 * On-device extraction results for a shared image. Every field is either real
 * extracted data or null/empty — nothing here is fabricated when extraction
 * finds nothing (e.g. no EXIF block, blank image).
 */
data class ImageAnalysis(
    /** Raw OCR output, original script/language. Empty if no text was found. */
    val ocrText: String,
    /** BCP-47-ish language code ML Kit identified for [ocrText], or null if undetermined. */
    val detectedLanguage: String?,
    /** English translation of [ocrText], or null if it was already English / translation failed. */
    val translatedText: String?,
    val provenance: ImageProvenance,
    /** Perceptual hash (64-bit, hex) for future near-duplicate lookup. Null if hashing failed. */
    val perceptualHash: String?
) {
    /** The text the verification pipeline should actually check. */
    val claimText: String
        get() = translatedText ?: ocrText
}

data class ImageProvenance(
    val cameraMake: String?,
    val cameraModel: String?,
    val captureDateUtc: String?,
    val hasGpsData: Boolean,
    val softwareTag: String?
) {
    /** True when the image carries no EXIF block at all (common after messaging-app re-compression). */
    val hasNoMetadata: Boolean
        get() =
            cameraMake == null &&
                cameraModel == null &&
                captureDateUtc == null &&
                softwareTag == null &&
                !hasGpsData
}
