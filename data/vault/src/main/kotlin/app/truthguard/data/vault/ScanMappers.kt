package app.truthguard.data.vault

import app.truthguard.data.vault.db.ScanEntity
import app.truthguard.domain.model.MediaType
import app.truthguard.domain.model.Scan
import app.truthguard.domain.model.ScanStatus

fun ScanEntity.toDomain(): Scan =
    Scan(
        id = id,
        mediaType = MediaType.valueOf(mediaType),
        sourceText = sourceText,
        localMediaPath = localMediaPath,
        status = ScanStatus.valueOf(status),
        createdAtEpochMillis = createdAtEpochMillis,
    )

fun Scan.toEntity(): ScanEntity =
    ScanEntity(
        id = id,
        mediaType = mediaType.name,
        sourceText = sourceText,
        localMediaPath = localMediaPath,
        status = status.name,
        createdAtEpochMillis = createdAtEpochMillis,
    )
