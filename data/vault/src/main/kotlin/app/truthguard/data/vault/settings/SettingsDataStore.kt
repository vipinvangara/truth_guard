package app.truthguard.data.vault.settings

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.settingsDataStore by preferencesDataStore(name = "settings")

/**
 * User settings. Cloud consent is false until the user explicitly grants it —
 * no claim text leaves the device before then.
 */
@Singleton
class SettingsDataStore
@Inject
constructor(
    @ApplicationContext private val context: Context
) {
    val cloudConsentGranted: Flow<Boolean> =
        context.settingsDataStore.data.map { prefs -> prefs[CLOUD_CONSENT] ?: false }

    suspend fun setCloudConsent(granted: Boolean) {
        context.settingsDataStore.edit { prefs -> prefs[CLOUD_CONSENT] = granted }
    }

    private companion object {
        val CLOUD_CONSENT = booleanPreferencesKey("cloud_consent_granted")
    }
}
