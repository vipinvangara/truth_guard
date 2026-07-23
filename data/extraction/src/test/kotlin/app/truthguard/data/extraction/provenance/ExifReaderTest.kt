package app.truthguard.data.extraction.provenance

import kotlin.test.Test
import kotlin.test.assertTrue

class ExifReaderTest {
    @Test
    fun `unreadable path returns empty provenance instead of throwing`() {
        val provenance = ExifReader().read("/nonexistent/path.jpg")

        assertTrue(provenance.hasNoMetadata)
    }
}
