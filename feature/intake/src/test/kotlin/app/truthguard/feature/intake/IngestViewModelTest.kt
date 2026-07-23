package app.truthguard.feature.intake

import app.cash.turbine.test
import app.truthguard.core.testing.FakeAnalysisScheduler
import app.truthguard.core.testing.FakeScanRepository
import app.truthguard.core.testing.MainDispatcherRule
import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.usecase.IngestSharedContentUseCase
import app.truthguard.domain.usecase.ObserveScansUseCase
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue
import kotlinx.coroutines.test.runTest
import org.junit.Rule
import org.junit.Test

class IngestViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private val repository = FakeScanRepository()
    private val scheduler = FakeAnalysisScheduler()
    private val viewModel =
        IngestViewModel(
            observeScans = ObserveScansUseCase(repository),
            ingestSharedContent = IngestSharedContentUseCase(repository, scheduler)
        )

    @Test
    fun `pasted text produces queued and scheduled scan`() = runTest(mainDispatcherRule.testDispatcher) {
        viewModel.scans.test {
            assertEquals(emptyList(), awaitItem())

            viewModel.checkPastedText("Forwarded: miracle cure found")

            val scans = awaitItem()
            assertEquals(1, scans.size)
            assertEquals(ScanStatus.QUEUED, scans.first().status)
            assertEquals(listOf(scans.first().id), scheduler.scheduled)
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
        assertTrue(scheduler.scheduled.isEmpty())
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
