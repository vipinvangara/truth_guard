package app.truthguard.data.vault

import app.truthguard.data.vault.db.ClaimEntity
import app.truthguard.data.vault.db.ClaimWithEvidence
import app.truthguard.data.vault.db.EvidenceEntity
import app.truthguard.domain.model.Claim
import app.truthguard.domain.model.Evidence
import app.truthguard.domain.model.EvidenceKind
import app.truthguard.domain.model.Stance
import app.truthguard.domain.model.Verdict

fun ClaimWithEvidence.toDomain(): Claim = Claim(
    id = claim.id,
    scanId = claim.scanId,
    text = claim.text,
    // Stored values are written from these same enums; valueOf is safe. If a
    // future version removes a constant, a proper migration must rewrite rows.
    verdict = Verdict.valueOf(claim.verdict),
    confidence = claim.confidence,
    reasoning = claim.reasoning,
    evidence =
    evidence.map {
        Evidence(
            sourceName = it.sourceName,
            url = it.url,
            snippet = it.snippet,
            kind = EvidenceKind.valueOf(it.kind),
            stance = Stance.valueOf(it.stance)
        )
    }
)

fun Claim.toEntities(): Pair<ClaimEntity, List<EvidenceEntity>> {
    val claimEntity =
        ClaimEntity(
            id = id,
            scanId = scanId,
            text = text,
            verdict = verdict.name,
            confidence = confidence,
            reasoning = reasoning
        )
    val evidenceEntities =
        evidence.mapIndexed { index, e ->
            EvidenceEntity(
                id = "$id-ev-$index",
                claimId = id,
                sourceName = e.sourceName,
                url = e.url,
                snippet = e.snippet,
                kind = e.kind.name,
                stance = e.stance.name
            )
        }
    return claimEntity to evidenceEntities
}
