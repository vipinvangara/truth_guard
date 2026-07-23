package app.truthguard.data.vault

import app.truthguard.data.vault.db.ScanEntity
import app.truthguard.domain.model.MediaType
import app.truthguard.domain.model.Scan
import app.truthguard.domain.model.ScanStatus
import org.junit.Test
import kotlin.test.assertEquals

class ScanMappersTest {
    private val domain =
        Scan(
            id = "id-1",
            mediaType = MediaType.IMAGE,
            sourceText = null,
            localMediaPath = "/data/media/abc",
            status = ScanStatus.QUEUED,
            createdAtEpochMillis = 1_700_000_000_000,
        )

    @Test
    fun `domain to entity and back is lossless`() {
        assertEquals(domain, domain.toEntity().toDomain())
    }

    @Test
    fun `entity maps enum names strictly`() {
        val entity =
            ScanEntity(
                id = "id-2",
                mediaType = "TEXT",
                sourceText = "claim",
                localMediaPath = null,
                status = "DONE",
                createdAtEpochMillis = 5L,
            )

        val mapped = entity.toDomain()

        assertEquals(MediaType.TEXT, mapped.mediaType)
        assertEquals(ScanStatus.DONE, mapped.status)
    }
}
