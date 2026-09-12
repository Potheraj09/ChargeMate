package com.aistudio.chargemate.service

import kotlin.math.*

data class LocationCoordinate(
    val latitude: Double,
    val longitude: Double,
    val name: String = "Location",
    val city: String = "City"
)

object GeoService {
    val FALLBACK_LOCATIONS = listOf(
        LocationCoordinate(12.9716, 80.2464, "Chennai OMR IT Corridor", "Chennai"),
        LocationCoordinate(13.0067, 80.2030, "Guindy / Anna Salai", "Chennai"),
        LocationCoordinate(11.0264, 77.0124, "Coimbatore Avinashi Road", "Coimbatore"),
        LocationCoordinate(9.9252, 78.1198, "Madurai Ring Road Express", "Madurai"),
        LocationCoordinate(12.8452, 77.6602, "Bengaluru Electronic City", "Bengaluru"),
        LocationCoordinate(10.0242, 76.3082, "Kochi Edappally Hub", "Kochi"),
        LocationCoordinate(17.4474, 78.3762, "Hyderabad HITEC City", "Hyderabad"),
        LocationCoordinate(19.0660, 72.8688, "Mumbai BKC Financial Hub", "Mumbai"),
        LocationCoordinate(28.6315, 77.2167, "Delhi Connaught Place", "New Delhi"),
        LocationCoordinate(18.5913, 73.7389, "Pune Hinjawadi Tech Zone", "Pune"),
        LocationCoordinate(10.7905, 78.7047, "Trichy Central Junction", "Tiruchirappalli")
    )

    fun isValidCoordinate(lat: Double?, lng: Double?): Boolean {
        if (lat == null || lng == null) return false
        if (lat.isNaN() || lng.isNaN() || lat.isInfinite() || lng.isInfinite()) return false
        return lat in -90.0..90.0 && lng in -180.0..180.0
    }

    /**
     * Calculates real great-circle distance between two coordinates in kilometers using Haversine formula.
     */
    fun calculateHaversineDistanceKm(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
            return 0.0
        }
        val r = 6371.0 // Radius of the Earth in km
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2).pow(2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLon / 2).pow(2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        val distance = r * c
        return (round(distance * 10) / 10.0)
    }
}
