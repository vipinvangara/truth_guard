package app.truthguard.data.vault.db

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "claims",
    foreignKeys = [
        ForeignKey(
            entity = ScanEntity::class,
            parentColumns = ["id"],
            childColumns = ["scanId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("scanId")]
)
data class ClaimEntity(
    @PrimaryKey val id: String,
    val scanId: String,
    val text: String,
    val verdict: String,
    val confidence: Float,
    val reasoning: String
)

@Entity(
    tableName = "evidence",
    foreignKeys = [
        ForeignKey(
            entity = ClaimEntity::class,
            parentColumns = ["id"],
            childColumns = ["claimId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("claimId")]
)
data class EvidenceEntity(
    @PrimaryKey val id: String,
    val claimId: String,
    val sourceName: String,
    val url: String,
    val snippet: String,
    val kind: String,
    val stance: String
)

data class ClaimWithEvidence(
    @androidx.room.Embedded val claim: ClaimEntity,
    @androidx.room.Relation(parentColumn = "id", entityColumn = "claimId")
    val evidence: List<EvidenceEntity>
)
