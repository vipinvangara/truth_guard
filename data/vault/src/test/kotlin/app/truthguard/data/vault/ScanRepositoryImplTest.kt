package app.truthguard.data.vault

import app.truthguard.core.common.TimeProvider
import app.truthguard.data.vault.db.ScanDao
import app.truthguard.data.vault.db.ScanEntity
import app.truthguard.domain.model.MediaType
import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.model.SharedContent
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.test.runTest
import org.junit.Test

class ScanRepositoryImplTest {
    private val fixedTime = TimeProvider { 1_700_000_000_000 }
    private val dao = FakeScanDao()
    private val repository = ScanRepositoryImpl(dao, fixedTime)

    @Test
    fun `create text scan persists trimmed text with queued status`() = runTest {
        val scan = repository.create(SharedContent.Text("  a claim  "))

        assertEquals("a claim", scan.sourceText)
        assertEquals(ScanStatus.QUEUED, scan.status)
        assertEquals(MediaType.TEXT, scan.mediaType)
        assertEquals(1_700_000_000_000, scan.createdAtEpochMillis)
        assertEquals(scan.toEntity(), dao.inserted.single())
    }

    @Test
    fun `create media scan stores local path`() = runTest {
        val scan = repository.create(SharedContent.Media("/data/x", "image/png"))

        assertEquals("/data/x", scan.localMediaPath)
        assertEquals(MediaType.IMAGE, scan.mediaType)
    }

    @Test
    fun `each scan gets a unique id`() = runTest {
        val first = repository.create(SharedContent.Text("one"))
        val second = repository.create(SharedContent.Text("two"))

        assertNotEquals(first.id, second.id)
    }
}

private class FakeScanDao : ScanDao {
    val inserted = mutableListOf<ScanEntity>()
    private val state = MutableStateFlow<List<ScanEntity>>(emptyList())

    override suspend fun insert(scan: ScanEntity) {
        inserted += scan
        state.value += scan
    }

    override fun observeAll(): Flow<List<ScanEntity>> = state

    override fun observe(id: String): Flow<ScanEntity?> = state.map { list -> list.find { it.id == id } }

    override suspend fun updateStatus(id: String, status: String) {
        state.value = state.value.map { if (it.id == id) it.copy(status = status) else it }
    }
}
