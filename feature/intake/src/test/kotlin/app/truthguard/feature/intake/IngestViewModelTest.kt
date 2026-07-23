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
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.test.runTest
import org.junit.Rule
import org.junit.Test

class IngestViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private val repository = FakeScanRepository()
    private val viewModel =
        IngestViewModel(
            observeScans = ObserveScansUseCase(repository),
            ingestSharedContent = IngestSharedContentUseCase(repository)
        )

    @Test
    fun `pasted text produces queued scan and event`() = runTest(mainDispatcherRule.testDispatcher) {
        viewModel.scans.test {
            assertEquals(emptyList(), awaitItem())

            viewModel.checkPastedText("Forwarded: miracle cure found")

            val scans = awaitItem()
            assertEquals(1, scans.size)
            assertEquals(ScanStatus.QUEUED, scans.first().status)
        }
        assertIs<IngestEvent.ScanQueued>(viewModel.events.value)
    }

    @Test
    fun `blank text produces failure event and no scan`() = runTest(mainDispatcherRule.testDispatcher) {
        viewModel.events.test {
            assertEquals(null, awaitItem())

            viewModel.checkPastedText("   ")

            assertIs<IngestEvent.IngestFailed>(awaitItem())
        }
        viewModel.scans.test {
            assertEquals(emptyList(), awaitItem())
        }
    }

    @Test
    fun `consuming an event clears it`() = runTest(mainDispatcherRule.testDispatcher) {
        viewModel.events.test {
            assertEquals(null, awaitItem())

            viewModel.checkPastedText("claim")
            assertIs<IngestEvent.ScanQueued>(awaitItem())

            viewModel.consumeEvent()
            assertEquals(null, awaitItem())
        }
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
                createdAtEpochMillis = 0L
            )
        scans.value += scan
        return scan
    }

    override fun observeAll(): Flow<List<Scan>> = scans

    override fun observe(id: String): Flow<Scan?> = scans.map { list -> list.find { it.id == id } }
}
