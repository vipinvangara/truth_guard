package app.truthguard.feature.intake

import app.cash.turbine.test
import app.truthguard.core.testing.FakeScanRepository
import app.truthguard.core.testing.MainDispatcherRule
import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.usecase.IngestSharedContentUseCase
import app.truthguard.domain.usecase.ObserveScansUseCase
import kotlin.test.assertEquals
import kotlin.test.assertIs
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
    fun `pasted text produces queued scan`() = runTest(mainDispatcherRule.testDispatcher) {
        // Both flows must be subscribed before the action fires: a WhileSubscribed
        // StateFlow's first-ever subscriber sees its cached initialValue on the
        // very first emission, one tick before the upstream's current value is
        // propagated — subscribing after acting would race that propagation.
        viewModel.scans.test {
            assertEquals(emptyList(), awaitItem())

            viewModel.events.test {
                assertEquals(null, awaitItem())

                viewModel.checkPastedText("Forwarded: miracle cure found")

                assertIs<IngestEvent.ScanQueued>(awaitItem())
            }

            val scans = awaitItem()
            assertEquals(1, scans.size)
            assertEquals(ScanStatus.QUEUED, scans.first().status)
        }
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
