package app.truthguard.di

import app.truthguard.domain.repository.ScanRepository
import app.truthguard.domain.usecase.IngestSharedContentUseCase
import app.truthguard.domain.usecase.ObserveScansUseCase
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
}
