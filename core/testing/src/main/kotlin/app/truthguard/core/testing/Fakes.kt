package app.truthguard.core.testing

import app.truthguard.domain.model.Claim
import app.truthguard.domain.model.ImageAnalysis
import app.truthguard.domain.model.MediaType
import app.truthguard.domain.model.Scan
import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.model.SharedContent
import app.truthguard.domain.repository.ScanRepository
import app.truthguard.domain.repository.SettingsRepository
import app.truthguard.domain.repository.VerificationRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map

class FakeScanRepository : ScanRepository {
    val scans = MutableStateFlow<List<Scan>>(emptyList())
    val claims = MutableStateFlow<Map<String, List<Claim>>>(emptyMap())
    var failNextCreate = false

    override suspend fun create(content: SharedContent): Scan {
        if (failNextCreate) {
            failNextCreate = false
            error("storage unavailable")
        }
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

    override fun observeClaims(scanId: String): Flow<List<Claim>> = claims.map { it[scanId].orEmpty() }

    override suspend fun getScan(id: String): Scan? = scans.value.find { it.id == id }

    override suspend fun updateStatus(id: String, status: ScanStatus) {
        scans.value = scans.value.map { if (it.id == id) it.copy(status = status) else it }
    }

    override suspend fun storeImageAnalysis(id: String, analysis: ImageAnalysis) {
        scans.value =
            scans.value.map {
                if (it.id == id) {
                    it.copy(
                        ocrText = analysis.ocrText,
                        detectedLanguage = analysis.detectedLanguage,
                        translatedText = analysis.translatedText,
                        provenance = analysis.provenance,
                        perceptualHash = analysis.perceptualHash
                    )
                } else {
                    it
                }
            }
    }

    override suspend fun storeClaims(scanId: String, claims: List<Claim>) {
        this.claims.value += (scanId to claims)
    }
}

class FakeSettingsRepository(initialConsent: Boolean = false) : SettingsRepository {
    private val consent = MutableStateFlow(initialConsent)
    override val cloudConsentGranted: Flow<Boolean> = consent

    override suspend fun isCloudConsentGranted(): Boolean = consent.value

    override suspend fun setCloudConsent(granted: Boolean) {
        consent.value = granted
    }
}

class FakeVerificationRepository(
    private val claimsFor: (scanId: String, text: String) -> List<Claim> = { _, _ -> emptyList() }
) : VerificationRepository {
    var failNext = false
    val verifiedTexts = mutableListOf<String>()

    override suspend fun verify(scanId: String, text: String): List<Claim> {
        if (failNext) {
            failNext = false
            throw java.io.IOException("network down")
        }
        verifiedTexts += text
        return claimsFor(scanId, text)
    }
}
