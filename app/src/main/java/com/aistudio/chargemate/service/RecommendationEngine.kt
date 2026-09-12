package com.aistudio.chargemate.service

import com.aistudio.chargemate.model.*
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

object RecommendationEngine {
    val EV_PRESETS = listOf(
        EVProfile("nexon-ev", "Tata Motors", "Nexon EV Long Range", 40.5, 50.0, listOf(ConnectorType.CCS2, ConnectorType.Type2), 325),
        EVProfile("curvv-ev", "Tata Motors", "Curvv.ev 55", 55.0, 70.0, listOf(ConnectorType.CCS2, ConnectorType.Type2), 502),
        EVProfile("punch-ev", "Tata Motors", "Punch.ev Empowered+", 35.0, 50.0, listOf(ConnectorType.CCS2, ConnectorType.Type2), 365),
        EVProfile("tiago-ev", "Tata Motors", "Tiago.ev XZ+", 24.0, 25.0, listOf(ConnectorType.CCS2, ConnectorType.Type2), 250),
        EVProfile("xuv400", "Mahindra", "XUV400 EL Pro", 39.4, 50.0, listOf(ConnectorType.CCS2, ConnectorType.Type2), 375),
        EVProfile("be-6e", "Mahindra", "BE 6e INGLO", 59.0, 175.0, listOf(ConnectorType.CCS2, ConnectorType.Type2), 550),
        EVProfile("xev-9e", "Mahindra", "XEV 9e Flagship", 79.0, 175.0, listOf(ConnectorType.CCS2, ConnectorType.Type2), 656),
        EVProfile("mg-windsor", "MG Motor", "Windsor EV Essence", 38.0, 45.0, listOf(ConnectorType.CCS2, ConnectorType.Type2), 331),
        EVProfile("mg-zs-ev", "MG Motor", "ZS EV Exclusive Plus", 50.3, 75.0, listOf(ConnectorType.CCS2, ConnectorType.Type2), 461),
        EVProfile("mg-comet", "MG Motor", "Comet EV Pace", 17.3, 3.3, listOf(ConnectorType.Type2), 230),
        EVProfile("ioniq-5", "Hyundai", "Ioniq 5 AWD (800V)", 72.6, 350.0, listOf(ConnectorType.CCS2, ConnectorType.Type2), 631),
        EVProfile("creta-ev", "Hyundai", "Creta Electric", 45.0, 60.0, listOf(ConnectorType.CCS2, ConnectorType.Type2), 410),
        EVProfile("kia-ev6", "Kia", "EV6 GT-Line AWD", 77.4, 350.0, listOf(ConnectorType.CCS2, ConnectorType.Type2), 708),
        EVProfile("byd-atto3", "BYD", "Atto 3 Blade Dynamic", 60.5, 80.0, listOf(ConnectorType.CCS2, ConnectorType.Type2), 521),
        EVProfile("byd-seal", "BYD", "Seal Performance AWD", 82.5, 150.0, listOf(ConnectorType.CCS2, ConnectorType.Type2), 580),
        EVProfile("volvo-ex40", "Volvo", "EX40 Recharge Twin", 78.0, 150.0, listOf(ConnectorType.CCS2, ConnectorType.Type2), 534),
        EVProfile("bmw-i4", "BMW", "i4 eDrive40 Gran Coupé", 83.9, 205.0, listOf(ConnectorType.CCS2, ConnectorType.Type2), 590),
        EVProfile("mercedes-eqb", "Mercedes-Benz", "EQB 350 4MATIC", 70.5, 100.0, listOf(ConnectorType.CCS2, ConnectorType.Type2), 423),
        EVProfile("ather-450x", "Ather Energy", "450X Gen 3 Pro", 3.7, 3.3, listOf(ConnectorType.Type2), 110),
        EVProfile("ola-s1-pro", "Ola Electric", "S1 Pro Gen 2", 4.0, 3.3, listOf(ConnectorType.Type2), 195)
    )

    fun calculateBestMatch(
        stations: List<ChargingStation>,
        profile: EVProfile
    ): RecommendationResult? {
        if (stations.isEmpty()) return null

        var bestStation: ChargingStation? = null
        var topScore = -1000
        var bestConnector: Connector? = null
        var matchReason = ""

        for (station in stations) {
            val compatible = station.connectors.filter { profile.supportedConnectors.contains(it.type) }
            if (compatible.isEmpty()) continue

            val available = compatible.filter { it.status == ConnectorStatus.AVAILABLE }
            val pool = if (available.isNotEmpty()) available else compatible

            val selectedConn = pool.maxByOrNull { it.powerKw } ?: pool.first()

            val powerScore: Int = if (selectedConn.powerKw >= profile.maxDcKw) {
                val overkill = selectedConn.powerKw - profile.maxDcKw
                if (overkill > 100) 20 else 32
            } else {
                val ratio = selectedConn.powerKw / profile.maxDcKw
                max(5, (ratio * 25).roundToInt())
            }

            val distanceScore = max(0.0, 40.0 - (station.distanceKm * 1.8)).roundToInt()
            val availBonus = if (available.isNotEmpty()) 45 + min(10, available.size * 4) else -25
            val priceScore = max(0.0, 30.0 - selectedConn.pricePerKwh).roundToInt()
            val ratingScore = (station.rating * 3.0).roundToInt()

            val totalScore = availBonus + distanceScore + powerScore + priceScore + ratingScore

            if (totalScore > topScore) {
                topScore = totalScore
                bestStation = station
                bestConnector = selectedConn

                matchReason = if (available.isNotEmpty() && selectedConn.powerKw >= profile.maxDcKw) {
                    "Peak ${profile.maxDcKw.roundToInt()} kW speed match for your ${profile.model} with ${available.size} open socket(s)."
                } else if (available.isNotEmpty()) {
                    "Fastest available socket (${selectedConn.powerKw.roundToInt()} kW) just ${station.distanceKm} km away."
                } else {
                    "High-power hub with low queue times; slots opening shortly."
                }
            }
        }

        return if (bestStation != null && bestConnector != null) {
            RecommendationResult(
                station = bestStation,
                score = max(1, min(100, topScore)),
                reason = matchReason,
                recommendedConnector = bestConnector
            )
        } else null
    }
}
