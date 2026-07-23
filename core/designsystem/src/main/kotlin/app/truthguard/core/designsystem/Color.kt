package app.truthguard.core.designsystem

import androidx.compose.ui.graphics.Color

// Brand palette: calm, credible blues — deliberately not alarmist.
val Blue10 = Color(0xFF001F29)
val Blue20 = Color(0xFF003544)
val Blue30 = Color(0xFF004D61)
val Blue40 = Color(0xFF006780)
val Blue80 = Color(0xFF5CD5F9)
val Blue90 = Color(0xFFB5EAFF)

val Slate10 = Color(0xFF161C21)
val Slate20 = Color(0xFF2B3136)
val Slate90 = Color(0xFFDDE3EA)
val Slate95 = Color(0xFFEFF4FA)
val Slate99 = Color(0xFFFCFDFF)

/**
 * Semantic verdict colors, stable across light/dark themes.
 * UNVERIFIED is intentionally neutral — it is a respectable outcome, not an error.
 */
object VerdictColors {
    val True = Color(0xFF2E7D32)
    val False = Color(0xFFC62828)
    val Misleading = Color(0xFFE65100)
    val Unverified = Color(0xFF546E7A)
    val Opinion = Color(0xFF6A1B9A)
}
