package app.truthguard.feature.verdict

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.truthguard.domain.usecase.EnableCloudVerificationUseCase
import app.truthguard.domain.usecase.ObserveScanDetailUseCase
import app.truthguard.domain.usecase.RetryAnalysisUseCase
import app.truthguard.domain.usecase.ScanDetail
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
    private val enableCloudVerification: EnableCloudVerificationUseCase,
    private val retryAnalysis: RetryAnalysisUseCase
) : ViewModel() {
    private val scanId: String = checkNotNull(savedStateHandle["scanId"])

    val detail: StateFlow<ScanDetail> =
        observeScanDetail(scanId)
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = ScanDetail(scan = null, claims = emptyList())
            )

    fun enableCloudAndRetry() {
        viewModelScope.launch { enableCloudVerification(scanId) }
    }

    fun retry() {
        viewModelScope.launch { retryAnalysis(scanId) }
    }

    private companion object {
        const val STOP_TIMEOUT_MILLIS = 5_000L
    }
}
