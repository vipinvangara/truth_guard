package app.truthguard.feature.intake

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Notes
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.truthguard.domain.model.MediaType
import app.truthguard.domain.model.Scan
import app.truthguard.domain.model.ScanStatus
import java.text.DateFormat
import java.util.Date

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IngestScreen(
    viewModel: IngestViewModel = hiltViewModel(),
) {
    val scans by viewModel.scans.collectAsStateWithLifecycle()
    val event by viewModel.events.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    var pastedText by remember { mutableStateOf("") }

    LaunchedEffect(event) {
        when (val current = event) {
            is IngestEvent.ScanQueued -> {
                snackbarHostState.showSnackbar("Queued for verification")
                viewModel.consumeEvent()
            }

            is IngestEvent.IngestFailed -> {
                snackbarHostState.showSnackbar(current.reason)
                viewModel.consumeEvent()
            }

            null -> Unit
        }
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text(stringResource(R.string.intake_title)) }) },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { padding ->
        Column(
            modifier =
                Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
        ) {
            OutlinedTextField(
                value = pastedText,
                onValueChange = { pastedText = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text(stringResource(R.string.intake_paste_hint)) },
                trailingIcon = {
                    IconButton(
                        enabled = pastedText.isNotBlank(),
                        onClick = {
                            viewModel.checkPastedText(pastedText)
                            pastedText = ""
                        },
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.Send,
                            contentDescription = stringResource(R.string.intake_check_action),
                        )
                    }
                },
                minLines = 2,
            )

            Spacer(Modifier.height(24.dp))

            if (scans.isEmpty()) {
                EmptyState()
            } else {
                Text(
                    text = stringResource(R.string.intake_recent_header),
                    style = MaterialTheme.typography.titleMedium,
                )
                Spacer(Modifier.height(8.dp))
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(scans, key = { it.id }) { scan -> ScanRow(scan) }
                }
            }
        }
    }
}

@Composable
private fun EmptyState() {
    Column(
        modifier = Modifier.fillMaxWidth().padding(top = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = stringResource(R.string.intake_empty_title),
            style = MaterialTheme.typography.titleMedium,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = stringResource(R.string.intake_empty_body),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun ScanRow(scan: Scan) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector =
                    when (scan.mediaType) {
                        MediaType.IMAGE -> Icons.Filled.Image
                        else -> Icons.Filled.Notes
                    },
                contentDescription = null,
                modifier = Modifier.size(24.dp),
                tint = MaterialTheme.colorScheme.primary,
            )
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    text = scan.sourceText ?: stringResource(R.string.intake_shared_media_label),
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 2,
                )
                Text(
                    text =
                        DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT)
                            .format(Date(scan.createdAtEpochMillis)),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Spacer(Modifier.width(8.dp))
            StatusBadge(scan.status)
        }
    }
}

@Composable
private fun StatusBadge(status: ScanStatus) {
    val label =
        when (status) {
            ScanStatus.QUEUED -> stringResource(R.string.status_queued)
            ScanStatus.EXTRACTING,
            ScanStatus.RETRIEVING,
            ScanStatus.JUDGING,
            -> stringResource(R.string.status_analyzing)

            ScanStatus.DONE -> stringResource(R.string.status_done)
            ScanStatus.FAILED -> stringResource(R.string.status_failed)
            ScanStatus.LOCAL_ONLY -> stringResource(R.string.status_local_only)
        }
    Text(
        text = label,
        style = MaterialTheme.typography.labelMedium,
        color = MaterialTheme.colorScheme.secondary,
    )
}
