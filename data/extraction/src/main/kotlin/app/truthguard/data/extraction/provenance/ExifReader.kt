package app.truthguard.data.extraction.provenance

import androidx.exifinterface.media.ExifInterface
import app.truthguard.domain.model.ImageProvenance
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Reads whatever EXIF block survives on the shared file. Most WhatsApp forwards
 * are re-compressed and strip EXIF entirely — that is reported honestly via
 * [ImageProvenance.hasNoMetadata], not treated as a red flag or backfilled.
 */
@Singleton
class ExifReader
@Inject
constructor() {
    fun read(localMediaPath: String): ImageProvenance = try {
        val exif = ExifInterface(localMediaPath)
        ImageProvenance(
            cameraMake = exif.getAttribute(ExifInterface.TAG_MAKE),
            cameraModel = exif.getAttribute(ExifInterface.TAG_MODEL),
            captureDateUtc = exif.getAttribute(ExifInterface.TAG_DATETIME_ORIGINAL),
            hasGpsData = exif.latLong != null,
            softwareTag = exif.getAttribute(ExifInterface.TAG_SOFTWARE)
        )
    } catch (
        // Malformed/truncated files (common after re-compression) throw here;
        // reporting empty provenance is the honest result, not an app error.
        @Suppress("TooGenericExceptionCaught", "SwallowedException") e: Exception
    ) {
        emptyProvenance()
    }

    private fun emptyProvenance() = ImageProvenance(
        cameraMake = null,
        cameraModel = null,
        captureDateUtc = null,
        hasGpsData = false,
        softwareTag = null
    )
}
