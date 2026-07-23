package app.truthguard.data.extraction

import app.truthguard.data.extraction.language.LanguageTranslator
import app.truthguard.data.extraction.ocr.OcrExtractor
import app.truthguard.data.extraction.phash.PerceptualHash
import app.truthguard.data.extraction.provenance.ExifReader
import app.truthguard.domain.model.ImageAnalysis
import app.truthguard.domain.repository.ImageAnalyzer
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Singleton
class ImageAnalyzerImpl
@Inject
constructor(
    private val ocrExtractor: OcrExtractor,
    private val languageTranslator: LanguageTranslator,
    private val exifReader: ExifReader,
    private val perceptualHash: PerceptualHash
) : ImageAnalyzer {
    override suspend fun analyze(localMediaPath: String): ImageAnalysis = withContext(Dispatchers.Default) {
        val ocrText = ocrExtractor.extract(localMediaPath)
        val language = languageTranslator.process(ocrText)
        ImageAnalysis(
            ocrText = ocrText,
            detectedLanguage = language.detectedLanguage,
            translatedText = language.translatedText,
            provenance = exifReader.read(localMediaPath),
            perceptualHash = perceptualHash.compute(localMediaPath)
        )
    }
}
