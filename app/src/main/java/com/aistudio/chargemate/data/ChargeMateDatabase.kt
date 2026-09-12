package com.aistudio.chargemate.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [BookingEntity::class, FavoriteEntity::class],
    version = 1,
    exportSchema = false
)
abstract class ChargeMateDatabase : RoomDatabase() {
    abstract fun bookingDao(): BookingDao
    abstract fun favoriteDao(): FavoriteDao

    companion object {
        @Volatile
        private var INSTANCE: ChargeMateDatabase? = null

        fun getDatabase(context: Context): ChargeMateDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    ChargeMateDatabase::class.java,
                    "chargemate_database"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
