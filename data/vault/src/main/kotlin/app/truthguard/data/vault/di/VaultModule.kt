package app.truthguard.data.vault.di

import android.content.Context
import androidx.room.Room
import app.truthguard.core.common.SystemTimeProvider
import app.truthguard.core.common.TimeProvider
import app.truthguard.data.vault.ScanRepositoryImpl
import app.truthguard.data.vault.SettingsRepositoryImpl
import app.truthguard.data.vault.db.ClaimDao
import app.truthguard.data.vault.db.ScanDao
import app.truthguard.data.vault.db.TruthGuardDatabase
import app.truthguard.domain.repository.ScanRepository
import app.truthguard.domain.repository.SettingsRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
internal abstract class VaultModule {
    @Binds
    abstract fun bindScanRepository(impl: ScanRepositoryImpl): ScanRepository

    @Binds
    abstract fun bindSettingsRepository(impl: SettingsRepositoryImpl): SettingsRepository

    companion object {
        @Provides
        @Singleton
        fun provideDatabase(@ApplicationContext context: Context): TruthGuardDatabase =
            Room.databaseBuilder(context, TruthGuardDatabase::class.java, "truthguard.db")
                .build()

        @Provides
        fun provideScanDao(db: TruthGuardDatabase): ScanDao = db.scanDao()

        @Provides
        fun provideClaimDao(db: TruthGuardDatabase): ClaimDao = db.claimDao()

        @Provides
        fun provideTimeProvider(): TimeProvider = SystemTimeProvider
    }
}
