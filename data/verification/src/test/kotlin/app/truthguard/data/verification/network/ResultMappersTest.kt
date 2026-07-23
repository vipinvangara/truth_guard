package app.truthguard.data.verification.network

import app.truthguard.domain.model.EvidenceKind
import app.truthguard.domain.model.Stance
import app.truthguard.domain.model.Verdict
import kotlin.test.assertEquals
import org.junit.Test

class ResultMappersTest {
    private fun dto(verdict: String = "FALSE", confidence: Float = 0.9f, evidence: List<EvidenceDto> = emptyList()) =
        ClaimDto(text = "c", verdict = verdict, confidence = confidence, reasoning = "r", evidence = evidence)

    @Test
    fun `known verdict maps directly`() {
        assertEquals(Verdict.FALSE, dto().toDomain("s1").verdict)
    }

    @Test
    fun `unknown verdict degrades to UNVERIFIED never a definitive verdict`() {
        assertEquals(Verdict.UNVERIFIED, dto(verdict = "PROBABLY_TRUE").toDomain("s1").verdict)
    }

    @Test
    fun `confidence is clamped to valid range`() {
        assertEquals(1f, dto(confidence = 3.7f).toDomain("s1").confidence)
        assertEquals(0f, dto(confidence = -1f).toDomain("s1").confidence)
    }

    @Test
    fun `unknown evidence kind and stance degrade to neutral values`() {
        val evidence =
            EvidenceDto(sourceName = "S", url = "https://x", snippet = "sn", kind = "BLOG", stance = "ANGRY")
                .toDomain()
        assertEquals(EvidenceKind.SEARCH, evidence.kind)
        assertEquals(Stance.CONTEXT, evidence.stance)
    }

    @Test
    fun `scan id is attached to mapped claim`() {
        assertEquals("scan-42", dto().toDomain("scan-42").scanId)
    }
}
