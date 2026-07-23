package app.truthguard.domain.model

enum class Verdict {
    TRUE,
    FALSE,
    MISLEADING,

    /** Insufficient evidence — a first-class, honest outcome, not an error. */
    UNVERIFIED,
    OPINION
}

enum class Stance {
    SUPPORTS,
    REFUTES,
    MIXED,
    CONTEXT
}

enum class EvidenceKind {
    FACTCHECK,
    ENCYCLOPEDIC,
    SEARCH
}

data class Evidence(
    val sourceName: String,
    val url: String,
    val snippet: String,
    val kind: EvidenceKind,
    val stance: Stance
)

data class Claim(
    val id: String,
    val scanId: String,
    val text: String,
    val verdict: Verdict,
    val confidence: Float,
    val reasoning: String,
    val evidence: List<Evidence>
)
