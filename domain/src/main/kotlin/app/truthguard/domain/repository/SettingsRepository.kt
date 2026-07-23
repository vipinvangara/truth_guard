package app.truthguard.domain.repository

import kotlinx.coroutines.flow.Flow

interface SettingsRepository {
    /** False until the user explicitly grants it; nothing leaves the device before then. */
    val cloudConsentGranted: Flow<Boolean>

    /** One-shot read of the current consent value. */
    suspend fun isCloudConsentGranted(): Boolean

    suspend fun setCloudConsent(granted: Boolean)
}
