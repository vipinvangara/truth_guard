package app.truthguard.di

import app.truthguard.domain.repository.ImageAnalyzer
import app.truthguard.domain.repository.ScanRepository
import app.truthguard.domain.repository.SettingsRepository
import app.truthguard.domain.repository.VerificationRepository
import app.truthguard.domain.usecase.EnableCloudVerificationUseCase
import app.truthguard.domain.usecase.IngestSharedContentUseCase
import app.truthguard.domain.usecase.ObserveScanDetailUseCase
import app.truthguard.domain.usecase.ObserveScansUseCase
import app.truthguard.domain.usecase.VerifyScanUseCase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

/** The domain module is pure Kotlin and Hilt-free; use cases are wired here. */
@Module
@InstallIn(SingletonComponent::class)
object UseCaseModule {
    @Provides
    fun provideIngestSharedContentUseCase(repository: ScanRepository): IngestSharedContentUseCase =
        IngestSharedContentUseCase(repository)

    @Provides
    fun provideObserveScansUseCase(repository: ScanRepository): ObserveScansUseCase = ObserveScansUseCase(repository)

    @Provides
    fun provideObserveScanDetailUseCase(repository: ScanRepository): ObserveScanDetailUseCase =
        ObserveScanDetailUseCase(repository)

    @Provides
    fun provideVerifyScanUseCase(
        scanRepository: ScanRepository,
        settingsRepository: SettingsRepository,
        verificationRepository: VerificationRepository,
        imageAnalyzer: ImageAnalyzer
    ): VerifyScanUseCase = VerifyScanUseCase(scanRepository, settingsRepository, verificationRepository, imageAnalyzer)

    @Provides
    fun provideEnableCloudVerificationUseCase(settingsRepository: SettingsRepository): EnableCloudVerificationUseCase =
        EnableCloudVerificationUseCase(settingsRepository)
}
