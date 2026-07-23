package app.truthguard.domain.model

enum class ScanStatus {
    QUEUED,
    EXTRACTING,
    RETRIEVING,
    JUDGING,
    DONE,
    FAILED,

    /** Analysis ran without cloud access; verdict is limited to on-device signals. */
    LOCAL_ONLY,
}
