package app.truthguard.domain.usecase

import app.cash.turbine.test
import app.truthguard.core.testing.FakeScanRepository
import app.truthguard.domain.model.SharedContent
import kotlin.test.assertEquals
import kotlinx.coroutines.test.runTest
import org.junit.Test

class ObserveScansUseCaseTest {
    private val repository = FakeScanRepository()
    private val useCase = ObserveScansUseCase(repository)

    @Test
    fun `emits the current scan list and updates as scans are added`() = runTest {
        useCase().test {
            assertEquals(emptyList(), awaitItem())

            repository.create(SharedContent.Text("first claim"))
            assertEquals(1, awaitItem().size)

            repository.create(SharedContent.Text("second claim"))
            assertEquals(2, awaitItem().size)
        }
    }
}
