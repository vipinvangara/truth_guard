package app.truthguard.domain.usecase

import app.truthguard.core.testing.FakeScanRepository
import app.truthguard.core.testing.FakeSettingsRepository
import app.truthguard.core.testing.FakeVerificationRepository
import app.truthguard.domain.model.Claim
import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.model.SharedContent
import app.truthguard.domain.model.Verdict
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlinx.coroutines.test.runTest
import org.junit.Test

class VerifyScanUseCaseTest {
    private val scanRepo = FakeScanRepository()

    private fun useCase(consent: Boolean, verification: FakeVerificationRepository = FakeVerificationRepository()) =
        VerifyScanUseCase(scanRepo, FakeSettingsRepository(consent), verification)

    private fun claim(scanId: String) = Claim(
        id = "c1",
        scanId = scanId,
        text = "claim",
        verdict = Verdict.FALSE,
        confidence = 0.9f,
        reasoning = "refuted",
        evidence = emptyList()
    )

    @Test
    fun `with consent, text scan is verified and marked DONE`() = runTest {
        val scan = scanRepo.create(SharedContent.Text("the allies lost ww2"))
        val verification = FakeVerificationRepository { id, _ -> listOf(claim(id)) }

        useCase(consent = true, verification = verification)(scan.id)

        assertEquals(ScanStatus.DONE, scanRepo.getScan(scan.id)?.status)
        assertEquals(listOf("the allies lost ww2"), verification.verifiedTexts)
        assertEquals(1, scanRepo.claims.value[scan.id]?.size)
    }

    @Test
    fun `without consent, scan is marked LOCAL_ONLY and nothing is sent`() = runTest {
        val scan = scanRepo.create(SharedContent.Text("some claim"))
        val verification = FakeVerificationRepository { id, _ -> listOf(claim(id)) }

        useCase(consent = false, verification = verification)(scan.id)

        assertEquals(ScanStatus.LOCAL_ONLY, scanRepo.getScan(scan.id)?.status)
        assertTrue(verification.verifiedTexts.isEmpty())
    }

    @Test
    fun `image scan is marked LOCAL_ONLY (image support is later)`() = runTest {
        val scan = scanRepo.create(SharedContent.Media("/data/x.jpg", "image/jpeg"))

        useCase(consent = true)(scan.id)

        assertEquals(ScanStatus.LOCAL_ONLY, scanRepo.getScan(scan.id)?.status)
    }

    @Test
    fun `network failure marks scan FAILED`() = runTest {
        val scan = scanRepo.create(SharedContent.Text("claim"))
        val verification = FakeVerificationRepository().apply { failNext = true }

        val result = useCase(consent = true, verification = verification)(scan.id)

        assertTrue(result.isFailure)
        assertEquals(ScanStatus.FAILED, scanRepo.getScan(scan.id)?.status)
    }

    @Test
    fun `already-DONE scan is not re-verified unless forced`() = runTest {
        val scan = scanRepo.create(SharedContent.Text("claim"))
        scanRepo.updateStatus(scan.id, ScanStatus.DONE)
        val verification = FakeVerificationRepository { id, _ -> listOf(claim(id)) }

        useCase(consent = true, verification = verification)(scan.id, force = false)
        assertTrue(verification.verifiedTexts.isEmpty())

        useCase(consent = true, verification = verification)(scan.id, force = true)
        assertEquals(1, verification.verifiedTexts.size)
    }
}
