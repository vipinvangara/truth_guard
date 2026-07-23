package app.truthguard.domain.model

/** Content handed to the app by another application via the share sheet. */
sealed interface SharedContent {
    data class Text(val value: String) : SharedContent

    /**
     * Media already copied into app-private storage. Share-sheet URI permissions are
     * transient, so the platform layer must persist the bytes before ingestion.
     */
    data class Media(val localPath: String, val mimeType: String) : SharedContent
}
