package app.truthguard.domain.repository

/** Schedules background analysis of a queued scan (WorkManager on Android). */
fun interface AnalysisScheduler {
    fun schedule(scanId: String)
}
