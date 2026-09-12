package com.aistudio.chargemate.service

import com.aistudio.chargemate.model.*
import kotlin.math.*

object CorridorRouteService {

    fun calculateCrossTrackDistanceKm(
        startLat: Double,
        startLng: Double,
        endLat: Double,
        endLng: Double,
        pointLat: Double,
        pointLng: Double
    ): Double {
        val d13 = GeoService.calculateHaversineDistanceKm(startLat, startLng, pointLat, pointLng)
        val totalDist = GeoService.calculateHaversineDistanceKm(startLat, startLng, endLat, endLng)
        if (totalDist < 0.1) return d13

        val toRad = PI / 180.0
        val phi1 = startLat * toRad
        val lam1 = startLng * toRad
        val phi2 = endLat * toRad
        val lam2 = endLng * toRad
        val phi3 = pointLat * toRad
        val lam3 = pointLng * toRad

        val y = sin(lam2 - lam1) * cos(phi2)
        val x = cos(phi1) * sin(phi2) - sin(phi1) * cos(phi2) * cos(lam2 - lam1)
        val theta12 = atan2(y, x)

        val y3 = sin(lam3 - lam1) * cos(phi3)
        val x3 = cos(phi1) * sin(phi3) - sin(phi1) * cos(phi3) * cos(lam3 - lam1)
        val theta13 = atan2(y3, x3)

        val delta13 = d13 / 6371.0
        val sinVal = max(-1.0, min(1.0, sin(delta13) * sin(theta13 - theta12)))
        val dxt = asin(sinVal) * 6371.0
        return abs(round(dxt * 10.0) / 10.0)
    }

    fun generateRoadPolyline(
        startLat: Double,
        startLng: Double,
        endLat: Double,
        endLng: Double,
        curveOffsetFactor: Double = 0.0
    ): List<Pair<Double, Double>> {
        val points = mutableListOf<Pair<Double, Double>>()
        points.add(Pair(startLat, startLng))

        val totalDist = GeoService.calculateHaversineDistanceKm(startLat, startLng, endLat, endLng)
        if (totalDist < 0.2) {
            points.add(Pair(endLat, endLng))
            return points
        }

        val segments = max(12, min(40, (totalDist / 8).roundToInt()))

        for (i in 1 until segments) {
            val t = i.toDouble() / segments
            val baseLat = startLat + (endLat - startLat) * t
            val baseLng = startLng + (endLng - startLng) * t

            val lateralArc = sin(t * PI)
            val offsetMag = min(0.045, max(0.008, (totalDist / 6371.0) * 0.7)) * curveOffsetFactor

            val dx = endLng - startLng
            val dy = endLat - startLat
            val len = sqrt(dx * dx + dy * dy).coerceAtLeast(1e-6)
            val perpLat = (-dx / len) * offsetMag * lateralArc
            val perpLng = (dy / len) * offsetMag * lateralArc

            val curveAmp = min(0.015, (totalDist / 6371.0) * 0.25)
            val wiggleLat = sin(t * PI * 2.8) * curveAmp * 0.4
            val wiggleLng = cos(t * PI * 2.8) * curveAmp * 0.5

            val latVal = round((baseLat + perpLat + wiggleLat) * 100000.0) / 100000.0
            val lngVal = round((baseLng + perpLng + wiggleLng) * 100000.0) / 100000.0

            if (GeoService.isValidCoordinate(latVal, lngVal)) {
                points.add(Pair(latVal, lngVal))
            }
        }

        points.add(Pair(endLat, endLng))
        return points
    }

    fun generateRouteHazards(
        polyline: List<Pair<Double, Double>>,
        routeType: String,
        totalDistanceKm: Int
    ): List<RouteHazard> {
        if (polyline.size < 5) return emptyList()
        val hazards = mutableListOf<RouteHazard>()

        when (routeType) {
            "fastest" -> {
                val p1 = polyline[(polyline.size * 0.38).toInt()]
                hazards.add(
                    RouteHazard(
                        id = "hz-acc-expressway",
                        type = HazardType.ACCIDENT,
                        title = "Accident Reported Ahead",
                        description = "Multi-vehicle incident near toll plaza. 1 right lane blocked, emergency crews on site.",
                        latitude = p1.first,
                        longitude = p1.second,
                        severity = "medium",
                        delayMins = min(18, max(6, (totalDistanceKm * 0.08).roundToInt())),
                        distanceFromStartKm = (totalDistanceKm * 0.38).roundToInt(),
                        advisory = "Slow down & merge into left lane. Expected +8 min delay."
                    )
                )
                if (totalDistanceKm > 45) {
                    val p2 = polyline[(polyline.size * 0.72).toInt()]
                    hazards.add(
                        RouteHazard(
                            id = "hz-cong-toll",
                            type = HazardType.CONGESTION,
                            title = "Toll Plaza Congestion",
                            description = "Heavy FASTag queue buildup at Interstate Toll Barrier.",
                            latitude = p2.first,
                            longitude = p2.second,
                            severity = "low",
                            delayMins = 5,
                            distanceFromStartKm = (totalDistanceKm * 0.72).roundToInt(),
                            advisory = "FASTag lanes 4 & 5 moving faster."
                        )
                    )
                }
            }
            "eco" -> {
                val p1 = polyline[(polyline.size * 0.48).toInt()]
                hazards.add(
                    RouteHazard(
                        id = "hz-flood-arterial",
                        type = HazardType.FLOOD,
                        title = "Monsoon Waterlogging Alert",
                        description = "Water accumulation (approx 1.2 ft depth) near rail subway underpass. Crawling traffic.",
                        latitude = p1.first,
                        longitude = p1.second,
                        severity = "high",
                        delayMins = min(25, max(10, (totalDistanceKm * 0.14).roundToInt())),
                        distanceFromStartKm = (totalDistanceKm * 0.48).roundToInt(),
                        advisory = "Drive cautiously in low gear. Ground clearance caution for sedans."
                    )
                )
            }
            "bypass" -> {
                val p1 = polyline[(polyline.size * 0.55).toInt()]
                hazards.add(
                    RouteHazard(
                        id = "hz-const-bypass",
                        type = HazardType.CONSTRUCTION,
                        title = "Road Resurfacing Work",
                        description = "Shoulder paving on outer bypass. All main carriageways open and running smooth.",
                        latitude = p1.first,
                        longitude = p1.second,
                        severity = "low",
                        delayMins = 3,
                        distanceFromStartKm = (totalDistanceKm * 0.55).roundToInt(),
                        advisory = "Clear and wide bypass corridor. High flood safety."
                    )
                )
            }
        }
        return hazards
    }

    fun findEnRouteEVStops(
        startLat: Double,
        startLng: Double,
        destLat: Double,
        destLng: Double,
        stations: List<ChargingStation>,
        maxDetourKm: Double = 25.0
    ): List<EnRouteStop> {
        val totalTripKm = GeoService.calculateHaversineDistanceKm(startLat, startLng, destLat, destLng)
        val candidateStops = mutableListOf<EnRouteStop>()

        stations.forEach { station ->
            val distFromOrigin = GeoService.calculateHaversineDistanceKm(startLat, startLng, station.latitude, station.longitude)
            val distToDest = GeoService.calculateHaversineDistanceKm(station.latitude, station.longitude, destLat, destLng)
            val detour = calculateCrossTrackDistanceKm(startLat, startLng, destLat, destLng, station.latitude, station.longitude)

            if (totalTripKm <= 15.0) {
                if (detour <= maxDetourKm || distFromOrigin <= totalTripKm * 1.5) {
                    candidateStops.add(
                        EnRouteStop(
                            station = station,
                            distanceFromStartKm = distFromOrigin,
                            detourKm = detour,
                            estimatedArrivalMins = (distFromOrigin / 40.0 * 60).roundToInt()
                        )
                    )
                }
            } else {
                val isCorridor = distFromOrigin <= totalTripKm * 1.08 &&
                        distToDest <= totalTripKm * 1.08 &&
                        detour <= maxDetourKm
                if (isCorridor) {
                    candidateStops.add(
                        EnRouteStop(
                            station = station,
                            distanceFromStartKm = distFromOrigin,
                            detourKm = detour,
                            estimatedArrivalMins = (distFromOrigin / 65.0 * 60).roundToInt()
                        )
                    )
                }
            }
        }

        val sorted = candidateStops.sortedBy { it.distanceFromStartKm }
        if (sorted.isEmpty()) return emptyList()

        var bestScore = -100.0
        var bestIdx = 0

        sorted.forEachIndexed { idx, stop ->
            val avail = stop.station.availableConnectorsCount
            val maxKw = stop.station.maxPowerKw
            val midRatio = 1.0 - abs((stop.distanceFromStartKm / max(1.0, totalTripKm)) - 0.5)
            val score = maxKw * 0.5 + avail * 30.0 + midRatio * 20.0 - stop.detourKm * 3.0
            if (score > bestScore) {
                bestScore = score
                bestIdx = idx
            }
        }

        return sorted.mapIndexed { idx, stop ->
            if (idx == bestIdx) stop.copy(isSuggestedStop = true) else stop
        }
    }

    fun calculateJourneyPlan(
        originName: String,
        originLat: Double,
        originLng: Double,
        destName: String,
        destLat: Double,
        destLng: Double,
        baseStations: List<ChargingStation>
    ): JourneyRoute {
        val totalDist = GeoService.calculateHaversineDistanceKm(originLat, originLng, destLat, destLng)

        // Route 1: Fastest
        val polyline1 = generateRoadPolyline(originLat, originLng, destLat, destLng, 0.0)
        val dist1 = max(1, totalDist.roundToInt())
        val time1 = max(8, ((dist1 / 68.0) * 60).roundToInt())
        val hazards1 = generateRouteHazards(polyline1, "fastest", dist1)
        val stops1 = findEnRouteEVStops(originLat, originLng, destLat, destLng, baseStations, 25.0)

        val route1 = RouteAlternative(
            id = "route-fastest",
            name = "Expressway Route (Fastest)",
            viaRoad = "via National Highway Express Corridor",
            badge = "⚡ Fastest Route",
            badgeColor = "emerald",
            colorHex = "#10B981",
            totalTripDistanceKm = dist1,
            estimatedTravelTimeMins = time1,
            routePolyline = polyline1,
            stops = stops1,
            hazards = hazards1,
            efficiencyScore = 94,
            tollCostInr = if (dist1 > 50) 165 else 75,
            highlights = listOf("Shortest ETA", "120kW+ Ultra-Fast DC Chargers", "Direct multi-lane highway")
        )

        // Route 2: Eco
        val polyline2 = generateRoadPolyline(originLat, originLng, destLat, destLng, 0.85)
        val dist2 = (dist1 * 1.06).roundToInt()
        val time2 = max(10, ((dist2 / 56.0) * 60).roundToInt())
        val hazards2 = generateRouteHazards(polyline2, "eco", dist2)
        val stops2 = findEnRouteEVStops(originLat, originLng, destLat, destLng, baseStations, 32.0)

        val route2 = RouteAlternative(
            id = "route-eco",
            name = "EV Hub Corridor (Max Chargers)",
            viaRoad = "via Arterial GT Highway Corridor",
            badge = "🌱 Most EV Chargers",
            badgeColor = "cyan",
            colorHex = "#06B6D4",
            totalTripDistanceKm = dist2,
            estimatedTravelTimeMins = time2,
            routePolyline = polyline2,
            stops = stops2,
            hazards = hazards2,
            efficiencyScore = 98,
            tollCostInr = if (dist2 > 50) 80 else 0,
            highlights = listOf("5+ Fast Charging Bays", "Optimal cruising consumption", "Food plazas & restrooms")
        )

        // Route 3: Flood-Safe Bypass
        val polyline3 = generateRoadPolyline(originLat, originLng, destLat, destLng, -0.95)
        val dist3 = (dist1 * 1.11).roundToInt()
        val time3 = max(11, ((dist3 / 62.0) * 60).roundToInt())
        val hazards3 = generateRouteHazards(polyline3, "bypass", dist3)
        val stops3 = findEnRouteEVStops(originLat, originLng, destLat, destLng, baseStations, 35.0)

        val route3 = RouteAlternative(
            id = "route-bypass",
            name = "Safe Bypass (Flood-Safe)",
            viaRoad = "via Outer Ring Bypass Corridor",
            badge = "🛡️ Flood-Safe • Zero Tolls",
            badgeColor = "purple",
            colorHex = "#8B5CF6",
            totalTripDistanceKm = dist3,
            estimatedTravelTimeMins = time3,
            routePolyline = polyline3,
            stops = stops3,
            hazards = hazards3,
            efficiencyScore = 88,
            tollCostInr = 0,
            highlights = listOf("Completely avoids flooded underpasses", "Zero toll booths", "Uncongested outer bypass")
        )

        val routes = listOf(route1, route2, route3)
        return JourneyRoute(
            originName = originName,
            originLat = originLat,
            originLng = originLng,
            destinationName = destName,
            destLat = destLat,
            destLng = destLng,
            selectedRouteId = route1.id,
            routes = routes,
            totalTripDistanceKm = route1.totalTripDistanceKm,
            estimatedTravelTimeMins = route1.estimatedTravelTimeMins,
            routePolyline = route1.routePolyline,
            stops = route1.stops,
            hazards = route1.hazards
        )
    }
}
