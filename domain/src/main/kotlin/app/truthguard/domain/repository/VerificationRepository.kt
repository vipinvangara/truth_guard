package app.truthguard.domain.repository

import app.truthguard.domain.model.Claim

interface VerificationRepository {
    /** Calls the verification service for the given claim text. */
    suspend fun verify(scanId: String, text: String): List<Claim>
}
