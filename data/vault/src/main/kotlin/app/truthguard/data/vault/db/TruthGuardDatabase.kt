package app.truthguard.data.vault.db

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [ScanEntity::class],
    version = 1,
    exportSchema = true,
)
abstract class TruthGuardDatabase : RoomDatabase() {
    abstract fun scanDao(): ScanDao
}
