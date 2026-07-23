package app.truthguard.data.extraction.phash

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Difference hash (dHash): downscale to 9x8 grayscale, compare adjacent pixel
 * brightness, one bit per comparison -> 64-bit hash as hex. Two images with a
 * small Hamming distance between hashes are near-duplicates; this is a
 * foundation for future "you already checked a variant of this" lookups, not
 * used for matching yet in P2.
 */
@Singleton
class PerceptualHash
@Inject
constructor() {
    fun compute(localMediaPath: String): String? {
        val source = BitmapFactory.decodeFile(localMediaPath) ?: return null
        val small = Bitmap.createScaledBitmap(source, WIDTH + 1, HEIGHT, true)

        var hash = 0L
        var bitIndex = 0
        for (y in 0 until HEIGHT) {
            for (x in 0 until WIDTH) {
                val left = grayscale(small.getPixel(x, y))
                val right = grayscale(small.getPixel(x + 1, y))
                if (left > right) hash = hash or (1L shl bitIndex)
                bitIndex++
            }
        }
        return hash.toULong().toString(RADIX_HEX).padStart(HEX_LENGTH, '0')
    }

    private fun grayscale(pixel: Int): Int {
        val r = (pixel shr RED_SHIFT) and BYTE_MASK
        val g = (pixel shr GREEN_SHIFT) and BYTE_MASK
        val b = pixel and BYTE_MASK
        return (r * RED_WEIGHT + g * GREEN_WEIGHT + b * BLUE_WEIGHT) / WEIGHT_TOTAL
    }

    private companion object {
        const val WIDTH = 8
        const val HEIGHT = 8
        const val RADIX_HEX = 16
        const val HEX_LENGTH = 16
        const val RED_SHIFT = 16
        const val GREEN_SHIFT = 8
        const val BYTE_MASK = 0xFF
        const val RED_WEIGHT = 299
        const val GREEN_WEIGHT = 587
        const val BLUE_WEIGHT = 114
        const val WEIGHT_TOTAL = 1000
    }
}
