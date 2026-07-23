package app.truthguard.domain.model

sealed class IngestException(message: String) : Exception(message) {
    class EmptyText : IngestException("Shared text is empty")

    class UnsupportedMediaType(mimeType: String) :
        IngestException("Unsupported media type: $mimeType")
}
