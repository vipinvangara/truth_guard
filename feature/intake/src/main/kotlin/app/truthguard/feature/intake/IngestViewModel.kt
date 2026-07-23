package app.truthguard.feature.intake

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.truthguard.domain.model.Scan
import app.truthguard.domain.model.SharedContent
import app.truthguard.domain.usecase.IngestSharedContentUseCase
import app.truthguard.domain.usecase.ObserveScansUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class IngestViewModel
    @Inject
    constructor(
        observeScans: ObserveScansUseCase,
        private val ingestSharedContent: IngestSharedContentUseCase,
    ) : ViewModel() {
        val scans: StateFlow<List<Scan>> =
            observeScans()
                .stateIn(
                    scope = viewModelScope,
                    started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                    initialValue = emptyList(),
                )

        private val _events = MutableStateFlow<IngestEvent?>(null)
        val events: StateFlow<IngestEvent?> = _events.asStateFlow()

        fun checkPastedText(text: String) {
            viewModelScope.launch {
                ingestSharedContent(SharedContent.Text(text))
                    .onSuccess { scan -> _events.value = IngestEvent.ScanQueued(scan.id) }
                    .onFailure { error ->
                        _events.value = IngestEvent.IngestFailed(error.message ?: "Could not queue scan")
                    }
            }
        }

        fun consumeEvent() {
            _events.value = null
        }

        private companion object {
            const val STOP_TIMEOUT_MILLIS = 5_000L
        }
    }

sealed interface IngestEvent {
    data class ScanQueued(val scanId: String) : IngestEvent

    data class IngestFailed(val reason: String) : IngestEvent
}
