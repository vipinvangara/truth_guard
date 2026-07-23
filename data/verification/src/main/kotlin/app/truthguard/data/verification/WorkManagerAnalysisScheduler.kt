package app.truthguard.data.verification

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import app.truthguard.domain.repository.AnalysisScheduler
import dagger.hilt.android.qualifiers.ApplicationContext
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WorkManagerAnalysisScheduler
@Inject
constructor(
    @ApplicationContext private val context: Context
) : AnalysisScheduler {
    override fun schedule(scanId: String) {
        val request =
            OneTimeWorkRequestBuilder<AnalysisWorker>()
                .setInputData(workDataOf(AnalysisWorker.KEY_SCAN_ID to scanId))
                .setConstraints(
                    Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()
                )
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, BACKOFF_SECONDS, TimeUnit.SECONDS)
                .build()
        WorkManager.getInstance(context)
            .enqueueUniqueWork("analysis-$scanId", ExistingWorkPolicy.KEEP, request)
    }

    private companion object {
        const val BACKOFF_SECONDS = 15L
    }
}
