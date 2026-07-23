package app.truthguard.core.testing

import app.truthguard.domain.model.ImageAnalysis
import app.truthguard.domain.model.ImageProvenance
import app.truthguard.domain.repository.ImageAnalyzer

class FakeImageAnalyzer(
    private val result: ImageAnalysis =
        ImageAnalysis(
            ocrText = "",
            detectedLanguage = null,
            translatedText = null,
            provenance =
            ImageProvenance(
                cameraMake = null,
                cameraModel = null,
                captureDateUtc = null,
                hasGpsData = false,
                softwareTag = null
            ),
            perceptualHash = null
        )
) : ImageAnalyzer {
    val analyzedPaths = mutableListOf<String>()

    override suspend fun analyze(localMediaPath: String): ImageAnalysis {
        analyzedPaths += localMediaPath
        return result
    }
}
