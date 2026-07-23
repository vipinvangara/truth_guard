package app.truthguard.domain.usecase

import app.truthguard.core.testing.FakeScanRepository
import app.truthguard.domain.model.IngestException
import app.truthguard.domain.model.MediaType
import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.model.SharedContent
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue
import kotlinx.coroutines.test.runTest
import org.junit.Test

class IngestSharedContentUseCaseTest {
    private val repository = FakeScanRepository()
    private val useCase = IngestSharedContentUseCase(repository)

    @Test
    fun `text content is persisted as queued scan`() = runTest {
        val result = useCase(SharedContent.Text("Breaking: all banks closed on Monday"))

        val scan = result.getOrThrow()
        assertEquals(ScanStatus.QUEUED, scan.status)
        assertEquals(MediaType.TEXT, scan.mediaType)
        assertEquals(1, repository.scans.value.size)
    }

    @Test
    fun `blank text is rejected without touching repository`() = runTest {
        val result = useCase(SharedContent.Text("   "))

        assertIs<IngestException.EmptyText>(result.exceptionOrNull())
        assertTrue(repository.scans.value.isEmpty())
    }

    @Test
    fun `image media is accepted`() = runTest {
        val result = useCase(SharedContent.Media("/data/media/fwd.jpg", "image/jpeg"))

        assertEquals(MediaType.IMAGE, result.getOrThrow().mediaType)
    }

    @Test
    fun `unsupported media type is rejected`() = runTest {
        val result = useCase(SharedContent.Media("/data/media/fwd.pdf", "application/pdf"))

        assertIs<IngestException.UnsupportedMediaType>(result.exceptionOrNull())
        assertTrue(repository.scans.value.isEmpty())
    }

    @Test
    fun `repository failure surfaces as failed result`() = runTest {
        repository.failNextCreate = true

        val result = useCase(SharedContent.Text("some claim"))

        assertTrue(result.isFailure)
    }
}
