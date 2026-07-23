package app.truthguard.data.vault.media

import android.content.Context
import android.net.Uri
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.File
import java.io.IOException
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Copies share-sheet media into app-private storage.
 *
 * Share URIs carry transient permission grants that expire when the share flow ends,
 * so bytes must be persisted before any deferred analysis. Only content:// URIs are
 * accepted — never file paths supplied by another app (path-traversal risk).
 */
@Singleton
class SharedMediaStore
@Inject
constructor(
    @ApplicationContext private val context: Context
) {
    suspend fun persist(uri: Uri): PersistedMedia = withContext(Dispatchers.IO) {
        require(uri.scheme == "content") { "Only content:// URIs are accepted" }

        val mimeType =
            context.contentResolver.getType(uri)
                ?: throw IOException("Source did not report a MIME type")

        val mediaDir = File(context.filesDir, MEDIA_DIR).apply { mkdirs() }
        val target = File(mediaDir, UUID.randomUUID().toString())

        context.contentResolver.openInputStream(uri)?.use { input ->
            target.outputStream().use { output ->
                var copied = 0L
                val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
                while (true) {
                    val read = input.read(buffer)
                    if (read == -1) break
                    copied += read
                    if (copied > MAX_MEDIA_BYTES) {
                        target.delete()
                        throw IOException("Shared media exceeds ${MAX_MEDIA_BYTES / BYTES_PER_MB} MB limit")
                    }
                    output.write(buffer, 0, read)
                }
            }
        } ?: throw IOException("Could not open shared content stream")

        PersistedMedia(localPath = target.absolutePath, mimeType = mimeType)
    }

    companion object {
        private const val MEDIA_DIR = "shared_media"
        private const val BYTES_PER_MB = 1024L * 1024L
        const val MAX_MEDIA_BYTES = 50L * BYTES_PER_MB
    }
}

data class PersistedMedia(
    val localPath: String,
    val mimeType: String
)
