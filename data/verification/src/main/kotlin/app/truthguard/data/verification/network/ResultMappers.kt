package app.truthguard.data.verification.network

import app.truthguard.domain.model.Claim
import app.truthguard.domain.model.Evidence
import app.truthguard.domain.model.EvidenceKind
import app.truthguard.domain.model.Stance
import app.truthguard.domain.model.Verdict
import java.util.UUID

/**
 * Unknown enum strings from the server degrade safely: verdicts to UNVERIFIED
 * (never to a definitive verdict), stances/kinds to neutral values.
 */
fun ClaimDto.toDomain(scanId: String): Claim = Claim(
    id = UUID.randomUUID().toString(),
    scanId = scanId,
    text = text,
    verdict = runCatching { Verdict.valueOf(verdict) }.getOrDefault(Verdict.UNVERIFIED),
    confidence = confidence.coerceIn(0f, 1f),
    reasoning = reasoning,
    evidence = evidence.map { it.toDomain() }
)

fun EvidenceDto.toDomain(): Evidence = Evidence(
    sourceName = sourceName,
    url = url,
    snippet = snippet,
    kind = runCatching { EvidenceKind.valueOf(kind) }.getOrDefault(EvidenceKind.SEARCH),
    stance = runCatching { Stance.valueOf(stance) }.getOrDefault(Stance.CONTEXT)
)
