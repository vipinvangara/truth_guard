package app.truthguard.feature.verdict

import androidx.lifecycle.SavedStateHandle
import app.truthguard.core.testing.FakeImageAnalyzer
import app.truthguard.core.testing.FakeScanRepository
import app.truthguard.core.testing.FakeSettingsRepository
import app.truthguard.core.testing.FakeVerificationRepository
import app.truthguard.core.testing.MainDispatcherRule
import app.truthguard.domain.model.Claim
import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.model.SharedContent
import app.truthguard.domain.model.Verdict
import app.truthguard.domain.usecase.EnableCloudVerificationUseCase
import app.truthguard.domain.usecase.ObserveScanDetailUseCase
import app.truthguard.domain.usecase.VerifyScanUseCase
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Rule
import org.junit.Test

class VerdictViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private val scanRepository = FakeScanRepository()

    private fun claim(scanId: String) = Claim(
        id = "c1",
        scanId = scanId,
        text = "claim",
        verdict = Verdict.FALSE,
        confidence = 0.9f,
        reasoning = "refuted",
        evidence = emptyList()
    )

    private fun viewModel(
        scanId: String,
        settings: FakeSettingsRepository,
        verification: FakeVerificationRepository = FakeVerificationRepository { id, _ -> listOf(claim(id)) }
    ): VerdictViewModel = VerdictViewModel(
        savedStateHandle = SavedStateHandle(mapOf("scanId" to scanId)),
        observeScanDetail = ObserveScanDetailUseCase(scanRepository),
        verifyScan = VerifyScanUseCase(scanRepository, settings, verification, FakeImageAnalyzer()),
        enableCloudVerification = EnableCloudVerificationUseCase(settings)
    )

    // Assertions read scanRepository/fake state directly rather than collecting
    // `detail` (a WhileSubscribed stateIn) — its value only updates once
    // something subscribes, which would test Flow-sharing timing rather than
    // the ViewModel's actual use-case wiring.

    @Test
    fun `opening the screen verifies automatically when consent is already granted`() =
        runTest(mainDispatcherRule.testDispatcher) {
            val scan = scanRepository.create(SharedContent.Text("claim"))

            viewModel(scan.id, FakeSettingsRepository(initialConsent = true))

            assertEquals(ScanStatus.DONE, scanRepository.getScan(scan.id)?.status)
        }

    @Test
    fun `opening the screen without consent leaves the scan LOCAL_ONLY`() = runTest(mainDispatcherRule.testDispatcher) {
        val scan = scanRepository.create(SharedContent.Text("claim"))
        val verification = FakeVerificationRepository { id, _ -> listOf(claim(id)) }

        viewModel(scan.id, FakeSettingsRepository(initialConsent = false), verification)

        assertEquals(ScanStatus.LOCAL_ONLY, scanRepository.getScan(scan.id)?.status)
        assertTrue(verification.verifiedTexts.isEmpty())
    }

    @Test
    fun `enableCloudAndVerify grants consent then verifies`() = runTest(mainDispatcherRule.testDispatcher) {
        val scan = scanRepository.create(SharedContent.Text("claim"))
        val settings = FakeSettingsRepository(initialConsent = false)
        val viewModel = viewModel(scan.id, settings)
        assertEquals(ScanStatus.LOCAL_ONLY, scanRepository.getScan(scan.id)?.status)

        viewModel.enableCloudAndVerify()

        assertTrue(settings.cloudConsentGranted.first())
        assertEquals(ScanStatus.DONE, scanRepository.getScan(scan.id)?.status)
    }

    @Test
    fun `retry re-runs verification even though the scan is already DONE`() =
        runTest(mainDispatcherRule.testDispatcher) {
            val scan = scanRepository.create(SharedContent.Text("claim"))
            val verification = FakeVerificationRepository { id, _ -> listOf(claim(id)) }
            val viewModel = viewModel(scan.id, FakeSettingsRepository(initialConsent = true), verification)
            assertEquals(1, verification.verifiedTexts.size)

            viewModel.retry()

            assertEquals(2, verification.verifiedTexts.size)
        }
}
