package app.truthguard.feature.verdict

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.truthguard.domain.usecase.EnableCloudVerificationUseCase
import app.truthguard.domain.usecase.ObserveScanDetailUseCase
import app.truthguard.domain.usecase.ScanDetail
import app.truthguard.domain.usecase.VerifyScanUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

@HiltViewModel
class VerdictViewModel
@Inject
constructor(
    savedStateHandle: SavedStateHandle,
    observeScanDetail: ObserveScanDetailUseCase,
    private val verifyScan: VerifyScanUseCase,
    private val enableCloudVerification: EnableCloudVerificationUseCase
) : ViewModel() {
    private val scanId: String = checkNotNull(savedStateHandle["scanId"])

    val detail: StateFlow<ScanDetail> =
        observeScanDetail(scanId)
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = ScanDetail(scan = null, claims = emptyList())
            )

    init {
        // Verify as soon as the screen opens; no-ops if already done or no consent.
        viewModelScope.launch { verifyScan(scanId) }
    }

    fun enableCloudAndVerify() {
        viewModelScope.launch {
            enableCloudVerification()
            verifyScan(scanId, force = true)
        }
    }

    fun retry() {
        viewModelScope.launch { verifyScan(scanId, force = true) }
    }

    private companion object {
        const val STOP_TIMEOUT_MILLIS = 5_000L
    }
}
