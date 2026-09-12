package com.aistudio.chargemate.service

import com.aistudio.chargemate.model.*
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

object MockAdapter {
    val OPERATOR_PROFILES = listOf(
        OperatorProfile("ChargeZone", "#EAB308", "CHZN", 21.0, "1800 120 2225"),
        OperatorProfile("Zeon Charging", "#8B5CF6", "ZEON", 21.5, "080 4718 3600"),
        OperatorProfile("Relux Electric", "#06B6D4", "RELX", 18.5, "1800 889 0081"),
        OperatorProfile("Tata Power EZ Charge", "#0284C7", "EZTP", 19.5, "1800 209 8282"),
        OperatorProfile("Jio-bp pulse", "#16A34A", "JBPL", 20.8, "1800 891 9023"),
        OperatorProfile("Shell Recharge", "#EF4444", "SHEL", 22.5, "1800 266 0115"),
        OperatorProfile("Statiq", "#F97316", "STIQ", 18.0, "1800 212 7828"),
        OperatorProfile("Ather Grid", "#059669", "ATHR", 15.5, "1800 102 8437")
    )

    private val HUB_NAMES = listOf(
        "ChargeZone Superhub - OMR Sholinganallur Tech Corridor",
        "ChargeZone Dual Gun 120kW - Guindy Olympia Tech Park",
        "ChargeZone Highway Oasis - GST Road Chengalpattu Toll",
        "ChargeZone Fast EV Bay - Sriperumbudur Industrial Corridor",
        "Zeon Fast Charging - Outer Ring Road (ORR) Interchange Hub",
        "Relux Electric Mega Hub - Highway Expressway Plaza",
        "Relux Electric Bay - City Bypass Toll Gate Junction",
        "Tata Power EZ Charge - Central Commercial Core Boulevard",
        "Jio-bp pulse - Inter-City Transit Terminal Mega Deck",
        "ChargeZone Hyperhub - International Airport T2 Aerocity",
        "Zeon Charging - National Highway Expressway Midway Oasis",
        "ChargeZone 240kW Ultra CCS2 - South Radial Expressway",
        "Tata Power EZ Charge - Premier City Mall & Retail Hub",
        "Statiq Hyperhub - Southern Gateway Railway Plaza",
        "ChargeZone - East Coast Scenic Highway Beach Corridor",
        "Relux Electric - North Peripheral Bypass Junction",
        "Ather Grid Rapid Hub - Central Shopping & Business District",
        "Shell Recharge - Western Flyover Junction Deck",
        "ChargeZone - Automotive & Manufacturing Hub Deck",
        "Zeon Charging - Interstate Highway Industrial Gateway",
        "ChargeZone - Industrial Estate North Technology Deck",
        "Tata Power EZ Charge - IT Expressway Cyber City Corridor",
        "Relux Electric - Grand Expressway Milepost Oasis",
        "Jio-bp pulse - Radial Ring Road Express Charging Hub",
        "ChargeZone - Expressway Gateway Oasis & Food Court",
        "Statiq - West Roundtana Urban EV Charging Hub",
        "Shell Recharge - Kathipara Cloverleaf Urban Deck",
        "ChargeZone - Poonamallee Bypass Transit Corridor"
    )

    private val LOCALITY_NAMES = listOf(
        "OMR IT Expressway Corridor",
        "GST Road Highway Corridor",
        "Guindy Tech Core Zone",
        "Velachery Bypass Avenue",
        "Central Commercial Boulevard",
        "Industrial & Tech Sector 4",
        "Inter-City Transit Terminal",
        "Expressway Highway Belt",
        "Outer Ring Road (ORR) Core",
        "International Airport Aerocity"
    )

    fun generateSeedStationsAroundLocation(userLat: Double, userLng: Double): List<ChargingStation> {
        val safeLat = if (GeoService.isValidCoordinate(userLat, userLng)) userLat else 12.9716
        val safeLng = if (GeoService.isValidCoordinate(userLat, userLng)) userLng else 80.2464

        val stations = mutableListOf<ChargingStation>()

        HUB_NAMES.forEachIndexed { idx, hubName ->
            val operator = OPERATOR_PROFILES[idx % OPERATOR_PROFILES.size]

            val ringZone = idx % 4
            val distKmRange: Double = when (ringZone) {
                0 -> 1.8 + (idx % 8) * 0.9
                1 -> 9.0 + (idx % 12) * 1.1
                2 -> 22.0 + (idx % 12) * 1.2
                else -> 36.0 + (idx % 12) * 1.35
            }

            val distDeg = distKmRange / 111.0
            val angle = (idx.toDouble() / HUB_NAMES.size) * 2 * PI + (idx * 0.618)

            var lat = safeLat + distDeg * cos(angle)
            var lng = safeLng + (distDeg / cos(safeLat * PI / 180.0)) * sin(angle)

            if (!GeoService.isValidCoordinate(lat, lng)) {
                lat = safeLat + 0.015 * (idx + 1)
                lng = safeLng + 0.015 * (idx + 1)
            }

            val distanceKm = GeoService.calculateHaversineDistanceKm(safeLat, safeLng, lat, lng)

            val connectorCount = 2 + (idx % 4)
            val connectors = mutableListOf<Connector>()

            val configs = listOf(
                Pair(ConnectorType.Type2, 3.3),
                Pair(ConnectorType.Type2, 7.4),
                Pair(ConnectorType.Type2, 22.0),
                Pair(ConnectorType.CCS2, 30.0),
                Pair(ConnectorType.CCS2, 60.0),
                Pair(ConnectorType.CCS2, 120.0),
                Pair(ConnectorType.CCS2, 180.0),
                Pair(ConnectorType.CCS2, 240.0),
                Pair(ConnectorType.CHAdeMO, 50.0),
                Pair(ConnectorType.Type2, 11.0)
            )

            val isChargeZone = operator.name == "ChargeZone"

            for (c in 0 until connectorCount) {
                val config = if (isChargeZone) {
                    val czOptions = listOf(
                        Pair(ConnectorType.CCS2, 240.0),
                        Pair(ConnectorType.CCS2, 120.0),
                        Pair(ConnectorType.CCS2, 60.0),
                        Pair(ConnectorType.CCS2, 240.0),
                        Pair(ConnectorType.Type2, 22.0),
                        Pair(ConnectorType.Type2, 7.4)
                    )
                    czOptions[(idx + c) % czOptions.size]
                } else if (operator.name == "Ather Grid") {
                    val atherOptions = listOf(
                        Pair(ConnectorType.Type2, 3.3),
                        Pair(ConnectorType.Type2, 3.3),
                        Pair(ConnectorType.Type2, 7.4),
                        Pair(ConnectorType.Type2, 22.0)
                    )
                    atherOptions[(idx + c) % atherOptions.size]
                } else {
                    configs[(idx * 2 + c) % configs.size]
                }

                val statusRoll = (idx * 3 + c * 7 + 11) % 20
                val status = when {
                    statusRoll < 5 -> ConnectorStatus.OCCUPIED
                    statusRoll == 18 -> ConnectorStatus.RESERVED
                    statusRoll == 19 -> ConnectorStatus.OUT_OF_SERVICE
                    else -> ConnectorStatus.AVAILABLE
                }

                var price = operator.basePricePerKwh
                if (config.second >= 240.0) price += 4.5
                else if (config.second >= 120.0) price += 2.5
                else if (config.second >= 60.0) price += 1.2
                else if (config.second <= 3.3) price -= 3.0
                else if (config.second <= 7.4) price -= 2.0

                connectors.add(
                    Connector(
                        id = "${operator.prefix}-${1000 + idx}-P${c + 1}",
                        type = config.first,
                        powerKw = config.second,
                        status = status,
                        pricePerKwh = Math.round(price * 10.0) / 10.0
                    )
                )
            }

            val locality = LOCALITY_NAMES[idx % LOCALITY_NAMES.size]
            val streetNo = 100 + (idx * 17)
            val allAmenities = listOf("Cafe", "Restroom", "WiFi", "24/7", "Security", "Shopping", "Dining")
            val hubAmenities = allAmenities.filterIndexed { aIdx, _ -> (idx + aIdx) % 2 == 0 || aIdx == 1 }

            stations.add(
                ChargingStation(
                    id = "station-${idx + 1}",
                    name = "${operator.name} - $hubName",
                    operator = operator.name,
                    operatorLogoColor = operator.colorHex,
                    latitude = Math.round(lat * 1000000.0) / 1000000.0,
                    longitude = Math.round(lng * 1000000.0) / 1000000.0,
                    distanceKm = distanceKm,
                    connectors = connectors,
                    address = "$streetNo, $locality",
                    city = "Live GPS Region",
                    amenities = hubAmenities,
                    rating = Math.round((4.1 + (idx % 8) * 0.11) * 10.0) / 10.0,
                    reviewCount = 38 + idx * 14,
                    openHours = if (idx % 5 == 0) "06:00 AM - 11:30 PM" else "24 Hours Open (24/7)",
                    contactPhone = operator.tollFreeSupport,
                    lastUpdatedEpoch = System.currentTimeMillis() - (idx * 2500)
                )
            )
        }

        return stations.sortedBy { it.distanceKm }
    }

    fun simulateLiveTelemetryUpdates(
        currentStations: List<ChargingStation>,
        lockedConnectorIds: Set<String>
    ): Pair<List<ChargingStation>, Int> {
        if (currentStations.isEmpty()) return Pair(currentStations, 0)
        var changeCount = 0

        val updated = currentStations.mapIndexed { index, station ->
            if (index % 4 == 0) {
                var modified = false
                val newConnectors = station.connectors.map { conn ->
                    if (lockedConnectorIds.contains(conn.id) || conn.status == ConnectorStatus.OUT_OF_SERVICE) {
                        conn
                    } else {
                        val rand = Math.random()
                        if (conn.status == ConnectorStatus.AVAILABLE && rand > 0.65) {
                            modified = true
                            conn.copy(status = ConnectorStatus.OCCUPIED)
                        } else if (conn.status == ConnectorStatus.OCCUPIED && rand > 0.55) {
                            modified = true
                            conn.copy(status = ConnectorStatus.AVAILABLE)
                        } else {
                            conn
                        }
                    }
                }
                if (modified) {
                    changeCount++
                    station.copy(connectors = newConnectors, lastUpdatedEpoch = System.currentTimeMillis())
                } else {
                    station
                }
            } else {
                station
            }
        }
        return Pair(updated, changeCount)
    }
}
