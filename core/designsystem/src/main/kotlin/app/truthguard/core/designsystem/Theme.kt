package app.truthguard.core.designsystem

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val LightColorScheme =
    lightColorScheme(
        primary = Blue40,
        onPrimary = Slate99,
        primaryContainer = Blue90,
        onPrimaryContainer = Blue10,
        secondary = Blue30,
        background = Slate99,
        onBackground = Slate10,
        surface = Slate95,
        onSurface = Slate10,
        surfaceVariant = Slate90
    )

private val DarkColorScheme =
    darkColorScheme(
        primary = Blue80,
        onPrimary = Blue20,
        primaryContainer = Blue30,
        onPrimaryContainer = Blue90,
        secondary = Blue90,
        background = Slate10,
        onBackground = Slate95,
        surface = Slate20,
        onSurface = Slate95
    )

@Composable
fun TruthGuardTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme =
        when {
            dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
                val context = LocalContext.current
                if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
            }

            darkTheme -> DarkColorScheme
            else -> LightColorScheme
        }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = TruthGuardTypography,
        content = content
    )
}
