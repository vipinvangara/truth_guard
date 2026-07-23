package app.truthguard.domain.usecase

import app.truthguard.domain.model.IngestException
import app.truthguard.domain.model.Scan
import app.truthguard.domain.model.SharedContent
import app.truthguard.domain.repository.ScanRepository

/**
 * Validates shared content and persists it as a queued scan.
 * Analysis itself is triggered separately so ingestion stays fast and never blocks the share flow.
 */
class IngestSharedContentUseCase(
    private val scanRepository: ScanRepository
) {
    suspend operator fun invoke(content: SharedContent): Result<Scan> {
        validate(content)?.let { return Result.failure(it) }
        return runCatching { scanRepository.create(content) }
    }

    private fun validate(content: SharedContent): IngestException? = when (content) {
        is SharedContent.Text ->
            IngestException.EmptyText().takeIf { content.value.isBlank() }

        is SharedContent.Media ->
            IngestException.UnsupportedMediaType(content.mimeType)
                .takeIf { SUPPORTED_MEDIA_PREFIXES.none(content.mimeType::startsWith) }
    }

    private companion object {
        val SUPPORTED_MEDIA_PREFIXES = listOf("image/")
    }
}
