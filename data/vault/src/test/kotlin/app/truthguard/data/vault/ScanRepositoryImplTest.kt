package app.truthguard.data.vault

import app.truthguard.core.common.TimeProvider
import app.truthguard.data.vault.db.ClaimDao
import app.truthguard.data.vault.db.ClaimEntity
import app.truthguard.data.vault.db.ClaimWithEvidence
import app.truthguard.data.vault.db.EvidenceEntity
import app.truthguard.data.vault.db.ScanDao
import app.truthguard.data.vault.db.ScanEntity
import app.truthguard.domain.model.Claim
import app.truthguard.domain.model.Evidence
import app.truthguard.domain.model.EvidenceKind
import app.truthguard.domain.model.ImageAnalysis
import app.truthguard.domain.model.ImageProvenance
import app.truthguard.domain.model.MediaType
import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.model.SharedContent
import app.truthguard.domain.model.Stance
import app.truthguard.domain.model.Verdict
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.test.runTest
import org.junit.Test

class ScanRepositoryImplTest {
    private val fixedTime = TimeProvider { 1_700_000_000_000 }
    private val scanDao = FakeScanDao()
    private val claimDao = FakeClaimDao()
    private val repository = ScanRepositoryImpl(scanDao, claimDao, fixedTime)

    @Test
    fun `create text scan persists trimmed text with queued status`() = runTest {
        val scan = repository.create(SharedContent.Text("  a claim  "))

        assertEquals("a claim", scan.sourceText)
        assertEquals(ScanStatus.QUEUED, scan.status)
        assertEquals(MediaType.TEXT, scan.mediaType)
        assertEquals(1_700_000_000_000, scan.createdAtEpochMillis)
        assertEquals(scan.toEntity(), scanDao.inserted.single())
    }

    @Test
    fun `create media scan stores local path`() = runTest {
        val scan = repository.create(SharedContent.Media("/data/x", "image/png"))

        assertEquals("/data/x", scan.localMediaPath)
        assertEquals(MediaType.IMAGE, scan.mediaType)
    }

    @Test
    fun `each scan gets a unique id`() = runTest {
        val first = repository.create(SharedContent.Text("one"))
        val second = repository.create(SharedContent.Text("two"))

        assertNotEquals(first.id, second.id)
    }

    @Test
    fun `update status is persisted`() = runTest {
        val scan = repository.create(SharedContent.Text("claim"))

        repository.updateStatus(scan.id, ScanStatus.DONE)

        assertEquals(ScanStatus.DONE, repository.getScan(scan.id)?.status)
    }

    @Test
    fun `stored claims round-trip with evidence`() = runTest {
        val scan = repository.create(SharedContent.Text("claim"))
        val claim =
            Claim(
                id = "c1",
                scanId = scan.id,
                text = "claim",
                verdict = Verdict.FALSE,
                confidence = 0.9f,
                reasoning = "refuted",
                evidence =
                listOf(
                    Evidence(
                        sourceName = "Wikipedia: X",
                        url = "https://en.wikipedia.org/wiki/X",
                        snippet = "snippet",
                        kind = EvidenceKind.ENCYCLOPEDIC,
                        stance = Stance.REFUTES
                    )
                )
            )

        repository.storeClaims(scan.id, listOf(claim))

        assertEquals(listOf(claim), repository.observeClaims(scan.id).first())
    }

    @Test
    fun `image analysis is persisted and round-trips through the domain model`() = runTest {
        val scan = repository.create(SharedContent.Media("/data/img.jpg", "image/jpeg"))
        val analysis =
            ImageAnalysis(
                ocrText = "raw text",
                detectedLanguage = "hi",
                translatedText = "translated text",
                provenance =
                ImageProvenance(
                    cameraMake = "Google",
                    cameraModel = "Pixel 8",
                    captureDateUtc = "2026:01:01 00:00:00",
                    hasGpsData = true,
                    softwareTag = "HDR+"
                ),
                perceptualHash = "abc123"
            )

        repository.storeImageAnalysis(scan.id, analysis)
        val stored = repository.getScan(scan.id)

        assertEquals("raw text", stored?.ocrText)
        assertEquals("translated text", stored?.translatedText)
        assertEquals("hi", stored?.detectedLanguage)
        assertEquals(analysis.provenance, stored?.provenance)
        assertEquals("abc123", stored?.perceptualHash)
    }
}

private class FakeScanDao : ScanDao {
    val inserted = mutableListOf<ScanEntity>()
    private val state = MutableStateFlow<List<ScanEntity>>(emptyList())

    override suspend fun insert(scan: ScanEntity) {
        inserted += scan
        state.value += scan
    }

    override fun observeAll(): Flow<List<ScanEntity>> = state

    override fun observe(id: String): Flow<ScanEntity?> = state.map { list -> list.find { it.id == id } }

    override suspend fun get(id: String): ScanEntity? = state.value.find { it.id == id }

    override suspend fun updateStatus(id: String, status: String) {
        state.value = state.value.map { if (it.id == id) it.copy(status = status) else it }
    }

    override suspend fun update(scan: ScanEntity) {
        state.value = state.value.map { if (it.id == scan.id) scan else it }
    }
}

private class FakeClaimDao : ClaimDao {
    private val claims = MutableStateFlow<List<ClaimEntity>>(emptyList())
    private val evidence = MutableStateFlow<List<EvidenceEntity>>(emptyList())

    override fun observeClaimsWithEvidence(scanId: String): Flow<List<ClaimWithEvidence>> = claims.map { list ->
        list.filter { it.scanId == scanId }
            .map { claim ->
                ClaimWithEvidence(claim, evidence.value.filter { it.claimId == claim.id })
            }
    }

    override suspend fun insertClaims(claims: List<ClaimEntity>) {
        this.claims.value += claims
    }

    override suspend fun insertEvidence(evidence: List<EvidenceEntity>) {
        this.evidence.value += evidence
    }

    override suspend fun deleteClaimsForScan(scanId: String) {
        val removed = claims.value.filter { it.scanId == scanId }.map { it.id }.toSet()
        claims.value = claims.value.filterNot { it.scanId == scanId }
        evidence.value = evidence.value.filterNot { it.claimId in removed }
    }
}
