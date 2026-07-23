package app.truthguard.domain.repository

import kotlinx.coroutines.flow.Flow

interface SettingsRepository {
    /** False until the user explicitly grants it; nothing leaves the device before then. */
    val cloudConsentGranted: Flow<Boolean>

    suspend fun setCloudConsent(granted: Boolean)
}
