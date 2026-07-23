package app.truthguard.domain.usecase

import app.truthguard.core.testing.FakeImageAnalyzer
import app.truthguard.core.testing.FakeScanRepository
import app.truthguard.core.testing.FakeSettingsRepository
import app.truthguard.core.testing.FakeVerificationRepository
import app.truthguard.domain.model.Claim
import app.truthguard.domain.model.ImageAnalysis
import app.truthguard.domain.model.ImageProvenance
import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.model.SharedContent
import app.truthguard.domain.model.Verdict
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlinx.coroutines.test.runTest
import org.junit.Test

class VerifyScanUseCaseTest {
    private val scanRepo = FakeScanRepository()
    private val emptyProvenance =
        ImageProvenance(
            cameraMake = null,
            cameraModel = null,
            captureDateUtc = null,
            hasGpsData = false,
            softwareTag = null
        )

    private fun useCase(
        consent: Boolean,
        verification: FakeVerificationRepository = FakeVerificationRepository(),
        imageAnalyzer: FakeImageAnalyzer = FakeImageAnalyzer()
    ) = VerifyScanUseCase(scanRepo, FakeSettingsRepository(consent), verification, imageAnalyzer)

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
    fun `image with OCR text is extracted then verified like a text claim`() = runTest {
        val scan = scanRepo.create(SharedContent.Media("/data/meme.jpg", "image/jpeg"))
        val analysis =
            ImageAnalysis(
                ocrText = "Vaccines cause the thing",
                detectedLanguage = "en",
                translatedText = null,
                provenance = emptyProvenance,
                perceptualHash = "abc"
            )
        val verification = FakeVerificationRepository { id, _ -> listOf(claim(id)) }

        useCase(consent = true, verification = verification, imageAnalyzer = FakeImageAnalyzer(analysis))(scan.id)

        assertEquals(ScanStatus.DONE, scanRepo.getScan(scan.id)?.status)
        assertEquals(listOf("Vaccines cause the thing"), verification.verifiedTexts)
        assertEquals("Vaccines cause the thing", scanRepo.getScan(scan.id)?.ocrText)
    }

    @Test
    fun `image OCR translation is preferred over raw text for verification`() = runTest {
        val scan = scanRepo.create(SharedContent.Media("/data/meme.jpg", "image/jpeg"))
        val analysis =
            ImageAnalysis(
                ocrText = "मूल पाठ",
                detectedLanguage = "hi",
                translatedText = "original text",
                provenance = emptyProvenance,
                perceptualHash = null
            )
        val verification = FakeVerificationRepository { id, _ -> listOf(claim(id)) }

        useCase(consent = true, verification = verification, imageAnalyzer = FakeImageAnalyzer(analysis))(scan.id)

        assertEquals(listOf("original text"), verification.verifiedTexts)
    }

    @Test
    fun `image with no OCR text is marked NO_CLAIM_FOUND without requiring consent`() = runTest {
        val scan = scanRepo.create(SharedContent.Media("/data/photo.jpg", "image/jpeg"))
        val analysis = ImageAnalysis("", null, null, emptyProvenance, null)

        useCase(consent = false, imageAnalyzer = FakeImageAnalyzer(analysis))(scan.id)

        assertEquals(ScanStatus.NO_CLAIM_FOUND, scanRepo.getScan(scan.id)?.status)
    }

    @Test
    fun `image without consent and with OCR text is LOCAL_ONLY not NO_CLAIM_FOUND`() = runTest {
        val scan = scanRepo.create(SharedContent.Media("/data/meme.jpg", "image/jpeg"))
        val analysis = ImageAnalysis("some claim text", "en", null, emptyProvenance, null)

        useCase(consent = false, imageAnalyzer = FakeImageAnalyzer(analysis))(scan.id)

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
