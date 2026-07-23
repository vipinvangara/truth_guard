package app.truthguard.data.extraction.ocr

import android.graphics.BitmapFactory
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.devanagari.DevanagariTextRecognizerOptions
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.tasks.await

/**
 * Runs ML Kit's on-device Latin and Devanagari text recognizers and merges the
 * results. Two passes (not a single multi-script model) because ML Kit ships
 * script-specific recognizers; running both covers the two most common script
 * families in Indian-subcontinent WhatsApp forwards without bundling every
 * script model up front.
 */
@Singleton
class OcrExtractor
@Inject
constructor() {
    private val latinRecognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    private val devanagariRecognizer =
        TextRecognition.getClient(DevanagariTextRecognizerOptions.Builder().build())

    suspend fun extract(localMediaPath: String): String {
        val bitmap =
            BitmapFactory.decodeFile(localMediaPath)
                ?: return ""
        val image = InputImage.fromBitmap(bitmap, 0)

        val latin = runCatching { latinRecognizer.process(image).await().text }.getOrDefault("")
        val devanagari = runCatching { devanagariRecognizer.process(image).await().text }.getOrDefault("")

        return when {
            latin.isBlank() -> devanagari
            devanagari.isBlank() -> latin
            // Both scripts found text (mixed-script meme): keep both, longer text first.
            latin.length >= devanagari.length -> "$latin\n$devanagari"
            else -> "$devanagari\n$latin"
        }.trim()
    }
}
