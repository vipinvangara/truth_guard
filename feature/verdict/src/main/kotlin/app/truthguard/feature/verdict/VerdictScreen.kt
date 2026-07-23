package app.truthguard.feature.verdict

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.truthguard.core.designsystem.VerdictColors
import app.truthguard.domain.model.Claim
import app.truthguard.domain.model.Evidence
import app.truthguard.domain.model.ImageProvenance
import app.truthguard.domain.model.MediaType
import app.truthguard.domain.model.Scan
import app.truthguard.domain.model.ScanStatus
import app.truthguard.domain.model.Verdict
import coil.compose.AsyncImage
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VerdictScreen(onBack: () -> Unit, viewModel: VerdictViewModel = hiltViewModel()) {
    val detail by viewModel.detail.collectAsStateWithLifecycle()
    val scan = detail.scan

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.verdict_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.verdict_back)
                        )
                    }
                }
            )
        }
    ) { padding ->
        if (scan == null) {
            Text(
                text = stringResource(R.string.verdict_not_found),
                modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)
            )
            return@Scaffold
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item { Spacer(Modifier.height(4.dp)) }

            if (scan.mediaType == MediaType.IMAGE) {
                scan.localMediaPath?.let { path -> item { ImageThumbnail(path) } }
                scan.ocrText?.let { ocrText ->
                    if (ocrText.isNotBlank()) item { ExtractedTextCard(scan) }
                    item { ProvenanceCard(scan.provenance) }
                }
            } else {
                scan.sourceText?.let { source ->
                    item {
                        Text(
                            text = source,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    item { HorizontalDivider() }
                }
            }

            when (scan.status) {
                ScanStatus.QUEUED, ScanStatus.RETRIEVING, ScanStatus.JUDGING ->
                    item { AnalyzingState(stringResource(R.string.verdict_analyzing)) }

                ScanStatus.EXTRACTING ->
                    item { AnalyzingState(stringResource(R.string.verdict_extracting)) }

                ScanStatus.NO_CLAIM_FOUND -> item { NoClaimFoundState() }

                ScanStatus.LOCAL_ONLY -> item { LocalOnlyState(onEnable = viewModel::enableCloudAndVerify) }

                ScanStatus.FAILED -> item { FailedState(onRetry = viewModel::retry) }

                ScanStatus.DONE ->
                    items(detail.claims, key = { it.id }) { claim -> ClaimCard(claim) }
            }

            item { Spacer(Modifier.height(8.dp)) }
        }
    }
}

@Composable
private fun ImageThumbnail(localMediaPath: String) {
    AsyncImage(
        model = File(localMediaPath),
        contentDescription = stringResource(R.string.verdict_shared_image),
        contentScale = ContentScale.FillWidth,
        modifier =
        Modifier
            .fillMaxWidth()
            .height(200.dp)
            .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(12.dp))
    )
}

@Composable
private fun ExtractedTextCard(scan: Scan) {
    val showsTranslation = scan.translatedText != null && scan.detectedLanguage != "en"
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Text(
                text = stringResource(R.string.verdict_text_found_title),
                style = MaterialTheme.typography.labelLarge
            )
            Spacer(Modifier.height(8.dp))
            if (showsTranslation) {
                Text(
                    text =
                    stringResource(
                        R.string.verdict_original_text,
                        scan.detectedLanguage.orEmpty()
                    ),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(text = scan.ocrText.orEmpty(), style = MaterialTheme.typography.bodyMedium)
                Spacer(Modifier.height(8.dp))
                Text(
                    text = stringResource(R.string.verdict_translated_text),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(text = scan.translatedText.orEmpty(), style = MaterialTheme.typography.bodyMedium)
            } else {
                Text(text = scan.ocrText.orEmpty(), style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

@Composable
private fun ProvenanceCard(provenance: ImageProvenance?) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Text(
                text = stringResource(R.string.verdict_provenance_title),
                style = MaterialTheme.typography.labelLarge
            )
            Spacer(Modifier.height(8.dp))
            if (provenance == null || provenance.hasNoMetadata) {
                Text(
                    text = stringResource(R.string.verdict_provenance_none),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                val camera = listOfNotNull(provenance.cameraMake, provenance.cameraModel).joinToString(" ")
                if (camera.isNotBlank()) ProvenanceRow(stringResource(R.string.verdict_provenance_camera), camera)
                provenance.captureDateUtc?.let {
                    ProvenanceRow(stringResource(R.string.verdict_provenance_captured), it)
                }
                if (provenance.hasGpsData) {
                    ProvenanceRow(
                        stringResource(R.string.verdict_provenance_location_label),
                        stringResource(R.string.verdict_provenance_location_present)
                    )
                }
                provenance.softwareTag?.let {
                    ProvenanceRow(stringResource(R.string.verdict_provenance_software), it)
                }
            }
        }
    }
}

@Composable
private fun ProvenanceRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.width(96.dp)
        )
        Text(text = value, style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun AnalyzingState(label: String) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(top = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        CircularProgressIndicator()
        Spacer(Modifier.height(16.dp))
        Text(text = label, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
private fun NoClaimFoundState() {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Text(
                text = stringResource(R.string.verdict_no_claim_title),
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = stringResource(R.string.verdict_no_claim_body),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun LocalOnlyState(onEnable: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Text(
                text = stringResource(R.string.verdict_local_only_title),
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = stringResource(R.string.verdict_local_only_body),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.height(16.dp))
            Button(onClick = onEnable) {
                Text(stringResource(R.string.verdict_enable_cloud))
            }
        }
    }
}

@Composable
private fun FailedState(onRetry: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Text(
                text = stringResource(R.string.verdict_failed_title),
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = stringResource(R.string.verdict_failed_body),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.height(16.dp))
            Button(onClick = onRetry) {
                Text(stringResource(R.string.verdict_retry))
            }
        }
    }
}

@Composable
private fun ClaimCard(claim: Claim) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                VerdictChip(claim.verdict)
                Spacer(Modifier.width(8.dp))
                if (claim.confidence > 0f) {
                    Text(
                        text =
                        stringResource(
                            R.string.verdict_confidence,
                            (claim.confidence * 100).toInt()
                        ),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Spacer(Modifier.height(12.dp))
            Text(text = claim.text, style = MaterialTheme.typography.titleSmall)
            Spacer(Modifier.height(8.dp))
            Text(
                text = claim.reasoning,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (claim.evidence.isNotEmpty()) {
                Spacer(Modifier.height(12.dp))
                Text(
                    text = stringResource(R.string.verdict_sources),
                    style = MaterialTheme.typography.labelLarge
                )
                Spacer(Modifier.height(4.dp))
                claim.evidence.forEach { evidence -> EvidenceRow(evidence) }
            }
        }
    }
}

@Composable
private fun VerdictChip(verdict: Verdict) {
    val (color, label) =
        when (verdict) {
            Verdict.TRUE -> VerdictColors.True to stringResource(R.string.verdict_true)
            Verdict.FALSE -> VerdictColors.False to stringResource(R.string.verdict_false)
            Verdict.MISLEADING -> VerdictColors.Misleading to stringResource(R.string.verdict_misleading)
            Verdict.UNVERIFIED -> VerdictColors.Unverified to stringResource(R.string.verdict_unverified)
            Verdict.OPINION -> VerdictColors.Opinion to stringResource(R.string.verdict_opinion)
        }
    Text(
        text = label,
        style = MaterialTheme.typography.labelLarge,
        fontWeight = FontWeight.Bold,
        color = Color.White,
        modifier =
        Modifier
            .background(color, RoundedCornerShape(6.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp)
    )
}

@Composable
private fun EvidenceRow(evidence: Evidence) {
    val uriHandler = LocalUriHandler.current
    Row(
        modifier =
        Modifier
            .fillMaxWidth()
            .clickable { uriHandler.openUri(evidence.url) }
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(Modifier.weight(1f)) {
            Text(text = evidence.sourceName, style = MaterialTheme.typography.bodyMedium)
            Text(
                text = evidence.snippet,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2
            )
        }
        Icon(
            Icons.AutoMirrored.Filled.OpenInNew,
            contentDescription = stringResource(R.string.verdict_open_source),
            tint = MaterialTheme.colorScheme.primary
        )
    }
}
