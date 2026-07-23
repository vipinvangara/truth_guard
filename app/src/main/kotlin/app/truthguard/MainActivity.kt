package app.truthguard

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import app.truthguard.core.designsystem.TruthGuardTheme
import app.truthguard.feature.intake.IngestScreen
import app.truthguard.feature.verdict.VerdictScreen
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            TruthGuardTheme {
                val navController = rememberNavController()
                NavHost(navController = navController, startDestination = "ingest") {
                    composable("ingest") {
                        IngestScreen(
                            onOpenScan = { scanId -> navController.navigate("verdict/$scanId") }
                        )
                    }
                    composable("verdict/{scanId}") {
                        VerdictScreen(onBack = { navController.popBackStack() })
                    }
                }
            }
        }
    }
}
