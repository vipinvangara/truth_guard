package app.truthguard.data.vault.db

import androidx.room.AutoMigration
import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [ScanEntity::class, ClaimEntity::class, EvidenceEntity::class],
    version = 2,
    exportSchema = true,
    autoMigrations = [AutoMigration(from = 1, to = 2)]
)
abstract class TruthGuardDatabase : RoomDatabase() {
    abstract fun scanDao(): ScanDao

    abstract fun claimDao(): ClaimDao
}
