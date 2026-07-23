package app.truthguard.data.vault

import app.truthguard.data.vault.settings.SettingsDataStore
import app.truthguard.domain.repository.SettingsRepository
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first

@Singleton
class SettingsRepositoryImpl
@Inject
constructor(
    private val settingsDataStore: SettingsDataStore
) : SettingsRepository {
    override val cloudConsentGranted: Flow<Boolean> = settingsDataStore.cloudConsentGranted

    override suspend fun isCloudConsentGranted(): Boolean = settingsDataStore.cloudConsentGranted.first()

    override suspend fun setCloudConsent(granted: Boolean) {
        settingsDataStore.setCloudConsent(granted)
    }
}
