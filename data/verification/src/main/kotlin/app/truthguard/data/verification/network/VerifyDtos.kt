package app.truthguard.data.verification.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class VerifyRequestDto(
    val text: String,
    val language: String? = null
)

@Serializable
data class VerifyResponseDto(
    val claims: List<ClaimDto>,
    val cached: Boolean = false,
    val limited: Boolean = false
)

@Serializable
data class ClaimDto(
    val text: String,
    val verdict: String,
    val confidence: Float,
    val reasoning: String,
    val evidence: List<EvidenceDto> = emptyList()
)

@Serializable
data class EvidenceDto(
    @SerialName("source_name") val sourceName: String,
    val url: String,
    val snippet: String,
    val kind: String,
    val stance: String = "CONTEXT"
)
