package app.truthguard.data.extraction.language

import com.google.mlkit.nl.languageid.LanguageIdentification
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.TranslatorOptions
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.tasks.await

data class LanguageResult(
    val detectedLanguage: String?,
    val translatedText: String?
)

/**
 * Detects the language of extracted text and translates non-English text to
 * English so the verification pipeline can reason over a consistent language,
 * while [LanguageResult.detectedLanguage] preserves what was actually detected.
 */
@Singleton
class LanguageTranslator
@Inject
constructor() {
    private val identifier = LanguageIdentification.getClient()

    suspend fun process(text: String): LanguageResult {
        if (text.isBlank()) return LanguageResult(detectedLanguage = null, translatedText = null)

        val languageTag =
            runCatching { identifier.identifyLanguage(text).await() }.getOrNull()
                ?.takeIf { it != "und" }
                ?: return LanguageResult(detectedLanguage = null, translatedText = null)

        if (languageTag == TranslateLanguage.ENGLISH) {
            return LanguageResult(detectedLanguage = languageTag, translatedText = null)
        }

        val translated = translate(from = languageTag, text = text)
        return LanguageResult(detectedLanguage = languageTag, translatedText = translated)
    }

    private suspend fun translate(from: String, text: String): String? {
        val options =
            TranslatorOptions.Builder()
                .setSourceLanguage(from)
                .setTargetLanguage(TranslateLanguage.ENGLISH)
                .build()
        val translator = Translation.getClient(options)
        return try {
            translator.downloadModelIfNeeded().await()
            translator.translate(text).await()
        } catch (
            // Model download can fail offline or on an unsupported language pair;
            // the caller falls back to the untranslated OCR text, never a fabricated one.
            @Suppress("TooGenericExceptionCaught", "SwallowedException") e: Exception
        ) {
            null
        } finally {
            translator.close()
        }
    }
}
