package app.truthguard.domain.usecase

import app.cash.turbine.test
import app.truthguard.core.testing.FakeScanRepository
import app.truthguard.domain.model.Claim
import app.truthguard.domain.model.SharedContent
import app.truthguard.domain.model.Verdict
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlinx.coroutines.test.runTest
import org.junit.Test

class ObserveScanDetailUseCaseTest {
    private val repository = FakeScanRepository()
    private val useCase = ObserveScanDetailUseCase(repository)

    @Test
    fun `unknown scan id emits null scan and no claims`() = runTest {
        useCase("nonexistent-id").test {
            val detail = awaitItem()
            assertNull(detail.scan)
            assertEquals(emptyList(), detail.claims)
        }
    }

    @Test
    fun `combines the scan and its claims as each is populated`() = runTest {
        val scan = repository.create(SharedContent.Text("claim"))
        val claim =
            Claim(
                id = "c1",
                scanId = scan.id,
                text = "claim",
                verdict = Verdict.FALSE,
                confidence = 0.9f,
                reasoning = "refuted",
                evidence = emptyList()
            )

        useCase(scan.id).test {
            assertEquals(scan, awaitItem().scan)

            repository.storeClaims(scan.id, listOf(claim))
            assertEquals(listOf(claim), awaitItem().claims)
        }
    }
}
