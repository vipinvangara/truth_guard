package app.truthguard.data.verification

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.first

private val Context.deviceTokenDataStore by preferencesDataStore(name = "device_token")

/**
 * Stable anonymous per-install token for backend rate limiting. Random UUID:
 * carries no device or user identity, resets on reinstall by design.
 */
@Singleton
class DeviceTokenProvider
@Inject
constructor(
    @ApplicationContext private val context: Context
) {
    suspend fun get(): String {
        val prefs = context.deviceTokenDataStore.data.first()
        prefs[KEY]?.let { return it }
        val token = UUID.randomUUID().toString()
        context.deviceTokenDataStore.edit { it[KEY] = token }
        return token
    }

    private companion object {
        val KEY = stringPreferencesKey("token")
    }
}
