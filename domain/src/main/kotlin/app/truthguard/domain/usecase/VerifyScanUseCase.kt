package app.truthguard.domain.usecase

import app.truthguard.domain.model.MediaType
import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.repository.ImageAnalyzer
import app.truthguard.domain.repository.ScanRepository
import app.truthguard.domain.repository.SettingsRepository
import app.truthguard.domain.repository.VerificationRepository

/**
 * Runs verification for a single scan, driven directly by the screen the user is
 * looking at — not deferred background work. Updates scan status as it progresses.
 *
 * For images, on-device extraction (OCR, language ID/translation, EXIF,
 * perceptual hash) always runs first — it never leaves the device, so it needs
 * no consent. The extracted claim text, if any, then follows the same
 * consent-gated cloud verification path as a text scan.
 *
 * Honest failure modes are distinguished, not collapsed into one generic state:
 * no check-worthy text found -> NO_CLAIM_FOUND; text found but no cloud consent
 * -> LOCAL_ONLY; consent granted but the network call failed -> FAILED.
 */
class VerifyScanUseCase(
    private val scanRepository: ScanRepository,
    private val settingsRepository: SettingsRepository,
    private val verificationRepository: VerificationRepository,
    private val imageAnalyzer: ImageAnalyzer
) {
    /**
     * @param force re-run even if the scan is already DONE (used by explicit retry).
     */
    @Suppress("ReturnCount") // Each early return is a distinct, honest terminal status - not incidental control flow.
    suspend operator fun invoke(scanId: String, force: Boolean = false): Result<Unit> {
        val scan = scanRepository.getScan(scanId) ?: return Result.success(Unit)
        if (!force && scan.status == ScanStatus.DONE) return Result.success(Unit)

        val claimText =
            when (scan.mediaType) {
                MediaType.TEXT -> scan.sourceText
                MediaType.IMAGE -> extractImageClaimText(scanId, scan.localMediaPath)
                MediaType.VIDEO, MediaType.AUDIO -> null
            }

        if (claimText.isNullOrBlank()) {
            scanRepository.updateStatus(scanId, ScanStatus.NO_CLAIM_FOUND)
            return Result.success(Unit)
        }

        if (!settingsRepository.isCloudConsentGranted()) {
            scanRepository.updateStatus(scanId, ScanStatus.LOCAL_ONLY)
            return Result.success(Unit)
        }

        scanRepository.updateStatus(scanId, ScanStatus.RETRIEVING)
        return runCatching {
            val claims = verificationRepository.verify(scanId, claimText)
            scanRepository.storeClaims(scanId, claims)
            scanRepository.updateStatus(scanId, ScanStatus.DONE)
        }.onFailure {
            scanRepository.updateStatus(scanId, ScanStatus.FAILED)
        }
    }

    private suspend fun extractImageClaimText(scanId: String, localMediaPath: String?): String? {
        if (localMediaPath == null) return null
        scanRepository.updateStatus(scanId, ScanStatus.EXTRACTING)
        val analysis = imageAnalyzer.analyze(localMediaPath)
        scanRepository.storeImageAnalysis(scanId, analysis)
        return analysis.claimText.takeIf { it.isNotBlank() }
    }
}
