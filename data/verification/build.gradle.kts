plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
}

android {
    namespace = "app.truthguard.data.verification"
    compileSdk = 35

    defaultConfig {
        minSdk = 26
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        debug {
            // Local dev backend reached over the LAN. Override per machine with
            // -PtruthguardApiBaseUrl=... ; adb reverse + localhost proved unreliable.
            val devApiBaseUrl =
                (project.findProperty("truthguardApiBaseUrl") as String?)
                    ?: "http://10.0.0.240:8000/"
            buildConfigField("String", "API_BASE_URL", "\"$devApiBaseUrl\"")
        }
        release {
            // Set to the Cloud Run URL at deploy time (P5).
            buildConfigField("String", "API_BASE_URL", "\"https://not-yet-deployed.invalid/\"")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation(project(":domain"))

    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)

    implementation(libs.retrofit)
    implementation(libs.retrofit.kotlinx.serialization)
    implementation(libs.okhttp)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.androidx.datastore)
    implementation(libs.kotlinx.coroutines.android)

    testImplementation(project(":core:testing"))
    testImplementation(kotlin("test"))
    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
}
