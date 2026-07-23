package app.truthguard.data.vault

import app.truthguard.core.common.TimeProvider
import app.truthguard.data.vault.db.ClaimDao
import app.truthguard.data.vault.db.ScanDao
import app.truthguard.domain.model.Claim
import app.truthguard.domain.model.ImageAnalysis
import app.truthguard.domain.model.MediaType
import app.truthguard.domain.model.Scan
import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.model.SharedContent
import app.truthguard.domain.repository.ScanRepository
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

@Singleton
class ScanRepositoryImpl
@Inject
constructor(
    private val scanDao: ScanDao,
    private val claimDao: ClaimDao,
    private val timeProvider: TimeProvider
) : ScanRepository {
    override suspend fun create(content: SharedContent): Scan {
        val scan =
            Scan(
                id = UUID.randomUUID().toString(),
                mediaType =
                when (content) {
                    is SharedContent.Text -> MediaType.TEXT
                    is SharedContent.Media -> MediaType.IMAGE
                },
                sourceText = (content as? SharedContent.Text)?.value?.trim(),
                localMediaPath = (content as? SharedContent.Media)?.localPath,
                status = ScanStatus.QUEUED,
                createdAtEpochMillis = timeProvider.nowEpochMillis()
            )
        scanDao.insert(scan.toEntity())
        return scan
    }

    override fun observeAll(): Flow<List<Scan>> = scanDao.observeAll().map { list -> list.map { it.toDomain() } }

    override fun observe(id: String): Flow<Scan?> = scanDao.observe(id).map { it?.toDomain() }

    override fun observeClaims(scanId: String): Flow<List<Claim>> =
        claimDao.observeClaimsWithEvidence(scanId).map { list -> list.map { it.toDomain() } }

    override suspend fun getScan(id: String): Scan? = scanDao.get(id)?.toDomain()

    override suspend fun updateStatus(id: String, status: ScanStatus) {
        scanDao.updateStatus(id, status.name)
    }

    override suspend fun storeImageAnalysis(id: String, analysis: ImageAnalysis) {
        val existing = scanDao.get(id) ?: return
        scanDao.update(
            existing.copy(
                ocrText = analysis.ocrText,
                detectedLanguage = analysis.detectedLanguage,
                translatedText = analysis.translatedText,
                provenanceCameraMake = analysis.provenance.cameraMake,
                provenanceCameraModel = analysis.provenance.cameraModel,
                provenanceCaptureDateUtc = analysis.provenance.captureDateUtc,
                provenanceHasGps = analysis.provenance.hasGpsData,
                provenanceSoftwareTag = analysis.provenance.softwareTag,
                perceptualHash = analysis.perceptualHash
            )
        )
    }

    override suspend fun storeClaims(scanId: String, claims: List<Claim>) {
        val entities = claims.map { it.toEntities() }
        claimDao.replaceResults(
            scanId = scanId,
            claims = entities.map { it.first },
            evidence = entities.flatMap { it.second }
        )
    }
}
