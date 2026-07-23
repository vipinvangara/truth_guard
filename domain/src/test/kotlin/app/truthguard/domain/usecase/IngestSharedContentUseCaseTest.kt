package app.truthguard.domain.usecase

import app.truthguard.domain.model.IngestException
import app.truthguard.domain.model.MediaType
import app.truthguard.domain.model.Scan
import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.model.SharedContent
import app.truthguard.domain.repository.ScanRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.test.runTest
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

class IngestSharedContentUseCaseTest {
    private val repository = FakeScanRepository()
    private val useCase = IngestSharedContentUseCase(repository)

    @Test
    fun `text content is persisted as queued scan`() =
        runTest {
            val result = useCase(SharedContent.Text("Breaking: all banks closed on Monday"))

            val scan = result.getOrThrow()
            assertEquals(ScanStatus.QUEUED, scan.status)
            assertEquals(MediaType.TEXT, scan.mediaType)
            assertEquals(1, repository.scans.value.size)
        }

    @Test
    fun `blank text is rejected without touching the repository`() =
        runTest {
            val result = useCase(SharedContent.Text("   "))

            assertIs<IngestException.EmptyText>(result.exceptionOrNull())
            assertTrue(repository.scans.value.isEmpty())
        }

    @Test
    fun `image media is accepted`() =
        runTest {
            val result = useCase(SharedContent.Media("/data/media/fwd.jpg", "image/jpeg"))

            assertEquals(MediaType.IMAGE, result.getOrThrow().mediaType)
        }

    @Test
    fun `unsupported media type is rejected`() =
        runTest {
            val result = useCase(SharedContent.Media("/data/media/fwd.pdf", "application/pdf"))

            assertIs<IngestException.UnsupportedMediaType>(result.exceptionOrNull())
            assertTrue(repository.scans.value.isEmpty())
        }

    @Test
    fun `repository failure surfaces as failed result`() =
        runTest {
            repository.failNextCreate = true

            val result = useCase(SharedContent.Text("some claim"))

            assertTrue(result.isFailure)
        }
}

private class FakeScanRepository : ScanRepository {
    val scans = MutableStateFlow<List<Scan>>(emptyList())
    var failNextCreate = false

    override suspend fun create(content: SharedContent): Scan {
        if (failNextCreate) {
            failNextCreate = false
            error("storage unavailable")
        }
        val scan =
            Scan(
                id = "scan-${scans.value.size}",
                mediaType =
                    when (content) {
                        is SharedContent.Text -> MediaType.TEXT
                        is SharedContent.Media -> MediaType.IMAGE
                    },
                sourceText = (content as? SharedContent.Text)?.value,
                localMediaPath = (content as? SharedContent.Media)?.localPath,
                status = ScanStatus.QUEUED,
                createdAtEpochMillis = 0L,
            )
        scans.value += scan
        return scan
    }

    override fun observeAll(): Flow<List<Scan>> = scans

    override fun observe(id: String): Flow<Scan?> = scans.map { list -> list.find { it.id == id } }
}
