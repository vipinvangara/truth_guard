package app.truthguard.data.extraction.di

import app.truthguard.data.extraction.ImageAnalyzerImpl
import app.truthguard.domain.repository.ImageAnalyzer
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
internal abstract class ExtractionModule {
    @Binds
    abstract fun bindImageAnalyzer(impl: ImageAnalyzerImpl): ImageAnalyzer
}
