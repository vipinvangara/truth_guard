package app.truthguard.data.vault

import app.truthguard.data.vault.db.ScanEntity
import app.truthguard.domain.model.ImageProvenance
import app.truthguard.domain.model.MediaType
import app.truthguard.domain.model.Scan
import app.truthguard.domain.model.ScanStatus

fun ScanEntity.toDomain(): Scan {
    val provenance =
        if (ocrText == null) {
            null
        } else {
            ImageProvenance(
                cameraMake = provenanceCameraMake,
                cameraModel = provenanceCameraModel,
                captureDateUtc = provenanceCaptureDateUtc,
                hasGpsData = provenanceHasGps,
                softwareTag = provenanceSoftwareTag
            )
        }
    return Scan(
        id = id,
        mediaType = MediaType.valueOf(mediaType),
        sourceText = sourceText,
        localMediaPath = localMediaPath,
        status = ScanStatus.valueOf(status),
        createdAtEpochMillis = createdAtEpochMillis,
        ocrText = ocrText,
        detectedLanguage = detectedLanguage,
        translatedText = translatedText,
        provenance = provenance,
        perceptualHash = perceptualHash
    )
}

fun Scan.toEntity(): ScanEntity = ScanEntity(
    id = id,
    mediaType = mediaType.name,
    sourceText = sourceText,
    localMediaPath = localMediaPath,
    status = status.name,
    createdAtEpochMillis = createdAtEpochMillis,
    ocrText = ocrText,
    detectedLanguage = detectedLanguage,
    translatedText = translatedText,
    provenanceCameraMake = provenance?.cameraMake,
    provenanceCameraModel = provenance?.cameraModel,
    provenanceCaptureDateUtc = provenance?.captureDateUtc,
    provenanceHasGps = provenance?.hasGpsData ?: false,
    provenanceSoftwareTag = provenance?.softwareTag,
    perceptualHash = perceptualHash
)
