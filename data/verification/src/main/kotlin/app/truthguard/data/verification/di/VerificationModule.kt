package app.truthguard.data.verification.di

import app.truthguard.data.verification.BuildConfig
import app.truthguard.data.verification.VerificationRepositoryImpl
import app.truthguard.data.verification.network.VerifyApi
import app.truthguard.domain.repository.VerificationRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import java.util.concurrent.TimeUnit
import javax.inject.Singleton
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

@Module
@InstallIn(SingletonComponent::class)
internal abstract class VerificationModule {
    @Binds
    abstract fun bindVerificationRepository(impl: VerificationRepositoryImpl): VerificationRepository

    companion object {
        // Reads are long because verification calls include LLM latency server-side.
        private const val CONNECT_TIMEOUT_SECONDS = 10L
        private const val READ_TIMEOUT_SECONDS = 60L

        @Provides
        @Singleton
        fun provideOkHttp(): OkHttpClient = OkHttpClient.Builder()
            .connectTimeout(CONNECT_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .readTimeout(READ_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .build()

        @Provides
        @Singleton
        fun provideVerifyApi(okHttpClient: OkHttpClient): VerifyApi {
            val json = Json { ignoreUnknownKeys = true }
            return Retrofit.Builder()
                .baseUrl(BuildConfig.API_BASE_URL)
                .client(okHttpClient)
                .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
                .build()
                .create(VerifyApi::class.java)
        }
    }
}
