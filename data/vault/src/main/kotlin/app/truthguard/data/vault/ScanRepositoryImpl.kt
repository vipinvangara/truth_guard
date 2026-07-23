package app.truthguard.data.vault

import app.truthguard.core.common.TimeProvider
import app.truthguard.data.vault.db.ScanDao
import app.truthguard.domain.model.MediaType
import app.truthguard.domain.model.Scan
import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.model.SharedContent
import app.truthguard.domain.repository.ScanRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ScanRepositoryImpl
    @Inject
    constructor(
        private val scanDao: ScanDao,
        private val timeProvider: TimeProvider,
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
                    createdAtEpochMillis = timeProvider.nowEpochMillis(),
                )
            scanDao.insert(scan.toEntity())
            return scan
        }

        override fun observeAll(): Flow<List<Scan>> = scanDao.observeAll().map { list -> list.map { it.toDomain() } }

        override fun observe(id: String): Flow<Scan?> = scanDao.observe(id).map { it?.toDomain() }
    }
