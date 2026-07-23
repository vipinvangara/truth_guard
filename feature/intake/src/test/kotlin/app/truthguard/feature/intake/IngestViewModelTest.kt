package app.truthguard.feature.intake

import app.cash.turbine.test
import app.truthguard.core.testing.MainDispatcherRule
import app.truthguard.domain.model.MediaType
import app.truthguard.domain.model.Scan
import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.model.SharedContent
import app.truthguard.domain.repository.ScanRepository
import app.truthguard.domain.usecase.IngestSharedContentUseCase
import app.truthguard.domain.usecase.ObserveScansUseCase
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.test.runTest
import org.junit.Rule
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs

class IngestViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private val repository = FakeScanRepository()
    private val viewModel =
        IngestViewModel(
            observeScans = ObserveScansUseCase(repository),
            ingestSharedContent = IngestSharedContentUseCase(repository),
        )

    @Test
    fun `pasted text produces queued scan and event`() =
        runTest {
            viewModel.checkPastedText("Forwarded: miracle cure found")

            viewModel.scans.test {
                val scans = awaitItem()
                assertEquals(1, scans.size)
                assertEquals(ScanStatus.QUEUED, scans.first().status)
            }
            assertIs<IngestEvent.ScanQueued>(viewModel.events.value)
        }

    @Test
    fun `blank text produces failure event and no scan`() =
        runTest {
            viewModel.checkPastedText("   ")

            assertIs<IngestEvent.IngestFailed>(viewModel.events.value)
            viewModel.scans.test {
                assertEquals(emptyList(), awaitItem())
            }
        }

    @Test
    fun `consuming an event clears it`() =
        runTest {
            viewModel.checkPastedText("claim")
            viewModel.consumeEvent()

            assertEquals(null, viewModel.events.value)
        }
}

private class FakeScanRepository : ScanRepository {
    private val scans = MutableStateFlow<List<Scan>>(emptyList())

    override suspend fun create(content: SharedContent): Scan {
        val scan =
            Scan(
                id = "scan-${scans.value.size}",
                mediaType = if (content is SharedContent.Text) MediaType.TEXT else MediaType.IMAGE,
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
