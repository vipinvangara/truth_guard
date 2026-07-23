package app.truthguard.share

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.lifecycle.lifecycleScope
import app.truthguard.MainActivity
import app.truthguard.R
import app.truthguard.data.vault.media.SharedMediaStore
import app.truthguard.domain.model.SharedContent
import app.truthguard.domain.usecase.IngestSharedContentUseCase
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Trampoline for content shared from other apps (the primary entry point).
 *
 * Persists the shared content quickly, then routes into the main UI. Media bytes are
 * copied into app-private storage before this activity finishes because share-sheet
 * URI grants are transient.
 */
@AndroidEntryPoint
class ShareActivity : ComponentActivity() {
    @Inject
    lateinit var ingestSharedContent: IngestSharedContentUseCase

    @Inject
    lateinit var sharedMediaStore: SharedMediaStore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val content = extractSharedContent(intent)
        if (content == null) {
            showFailure()
            finish()
            return
        }

        lifecycleScope.launch {
            val result =
                runCatching { resolveContent(content) }
                    .mapCatching { resolved -> ingestSharedContent(resolved).getOrThrow() }

            result
                .onSuccess { routeToMain() }
                .onFailure { error ->
                    Log.w(TAG, "Share ingestion failed", error)
                    showFailure()
                }
            finish()
        }
    }

    /** Raw share payload before any I/O: either text, or a still-unresolved content URI. */
    private sealed interface RawShare {
        data class Text(val value: String) : RawShare

        data class MediaUri(val uri: Uri) : RawShare
    }

    private fun extractSharedContent(intent: Intent): RawShare? =
        when (intent.action) {
            Intent.ACTION_PROCESS_TEXT ->
                intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT)
                    ?.toString()
                    ?.let(RawShare::Text)

            Intent.ACTION_SEND ->
                if (intent.type == "text/plain") {
                    intent.getStringExtra(Intent.EXTRA_TEXT)?.let(RawShare::Text)
                } else {
                    getSharedUri(intent)?.let(RawShare::MediaUri)
                }

            else -> null
        }

    private fun getSharedUri(intent: Intent): Uri? =
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent.getParcelableExtra(Intent.EXTRA_STREAM)
        }

    private suspend fun resolveContent(raw: RawShare): SharedContent =
        when (raw) {
            is RawShare.Text -> SharedContent.Text(raw.value)
            is RawShare.MediaUri -> {
                val persisted = sharedMediaStore.persist(raw.uri)
                SharedContent.Media(persisted.localPath, persisted.mimeType)
            }
        }

    private fun routeToMain() {
        startActivity(
            Intent(this, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            },
        )
    }

    private fun showFailure() {
        Toast.makeText(this, getString(R.string.share_ingest_failed), Toast.LENGTH_LONG).show()
    }

    private companion object {
        const val TAG = "ShareActivity"
    }
}
