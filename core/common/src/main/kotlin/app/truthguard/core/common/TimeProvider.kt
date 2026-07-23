package app.truthguard.core.common

/** Injectable clock so persistence and pipeline timestamps are testable. */
fun interface TimeProvider {
    fun nowEpochMillis(): Long
}

object SystemTimeProvider : TimeProvider {
    override fun nowEpochMillis(): Long = System.currentTimeMillis()
}
