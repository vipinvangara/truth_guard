package app.truthguard.domain.repository

import app.truthguard.domain.model.ImageAnalysis

/** On-device extraction (OCR, language detection/translation, EXIF, perceptual hash). */
fun interface ImageAnalyzer {
    suspend fun analyze(localMediaPath: String): ImageAnalysis
}
