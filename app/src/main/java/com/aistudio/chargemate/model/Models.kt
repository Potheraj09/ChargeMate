package com.aistudio.chargemate.model

enum class ConnectorType(val label: String) {
    CCS2("CCS2 (DC Fast)"),
    Type2("Type 2 (AC)"),
    CHAdeMO("CHAdeMO")
}

enum class ConnectorStatus(val label: String) {
    AVAILABLE("Available"),
    OCCUPIED("Occupied"),
    RESERVED("Reserved"),
    OUT_OF_SERVICE("Maintenance")
}

data class Connector(
    val id: String,
    val type: ConnectorType,
    val powerKw: Double,
    val status: ConnectorStatus,
    val pricePerKwh: Double
)

data class OperatorProfile(
    val name: String,
    val colorHex: String,
    val prefix: String,
    val basePricePerKwh: Double,
    val tollFreeSupport: String
)

data class ChargingStation(
    val id: String,
    val name: String,
    val operator: String,
    val operatorLogoColor: String,
    val latitude: Double,
    val longitude: Double,
    val distanceKm: Double,
    val connectors: List<Connector>,
    val address: String,
    val city: String,
    val amenities: List<String>,
    val rating: Double,
    val reviewCount: Int,
    val openHours: String,
    val contactPhone: String,
    val lastUpdatedEpoch: Long = System.currentTimeMillis()
) {
    val availableConnectorsCount: Int
        get() = connectors.count { it.status == ConnectorStatus.AVAILABLE }

    val maxPowerKw: Double
        get() = connectors.maxOfOrNull { it.powerKw } ?: 0.0

    val minPricePerKwh: Double
        get() = connectors.minOfOrNull { it.pricePerKwh } ?: 0.0
}

data class EVProfile(
    val id: String,
    val brand: String,
    val model: String,
    val batteryKwh: Double,
    val maxDcKw: Double,
    val supportedConnectors: List<ConnectorType>,
    val rangeKm: Int
)

data class Booking(
    val id: String,
    val stationId: String,
    val stationName: String,
    val stationAddress: String,
    val stationOperator: String,
    val connectorId: String,
    val connectorType: ConnectorType,
    val powerKw: Double,
    val timeSlot: String,
    val date: String,
    val estCost: Double,
    val status: BookingStatus,
    val createdAt: String,
    val expiryEpoch: Long,
    val pinCode: String,
    val paymentId: String? = null,
    val paymentMethod: String? = null,
    val razorpayOrderId: String? = null,
    val amountPaid: Double = 0.0,
    val refundStatus: RefundStatus = RefundStatus.NONE,
    val refundAmount: Double = 0.0,
    val penaltyAmount: Double = 0.0,
    val refundId: String? = null,
    val refundReason: String? = null,
    val refundTimestamp: String? = null,
    val appliedOfferCode: String? = null,
    val discountAmount: Double = 0.0
)

enum class BookingStatus {
    CONFIRMED,
    ACTIVE,
    COMPLETED,
    CANCELLED,
    NO_SHOW_PENALTY
}

enum class RefundStatus {
    NONE,
    FULL_REFUNDED,
    PARTIAL_REFUNDED,
    PENALTY_DEDUCTED
}

data class LoyaltyOffer(
    val id: String,
    val code: String,
    val title: String,
    val description: String,
    val minMonthlyUses: Int,
    val discountType: DiscountType,
    val discountValue: Double,
    val badge: String,
    val partner: String? = null,
    val terms: String
)

enum class DiscountType {
    PERCENT,
    FLAT,
    WAIVE_FEE
}

data class EnRouteStop(
    val station: ChargingStation,
    val distanceFromStartKm: Double,
    val detourKm: Double,
    val estimatedArrivalMins: Int,
    val isSuggestedStop: Boolean = false
)

enum class HazardType {
    ACCIDENT,
    FLOOD,
    CONSTRUCTION,
    CONGESTION
}

data class RouteHazard(
    val id: String,
    val type: HazardType,
    val title: String,
    val description: String,
    val latitude: Double,
    val longitude: Double,
    val severity: String,
    val delayMins: Int,
    val distanceFromStartKm: Int,
    val advisory: String
)

data class RouteAlternative(
    val id: String,
    val name: String,
    val viaRoad: String,
    val badge: String,
    val badgeColor: String,
    val colorHex: String,
    val totalTripDistanceKm: Int,
    val estimatedTravelTimeMins: Int,
    val routePolyline: List<Pair<Double, Double>>,
    val stops: List<EnRouteStop>,
    val hazards: List<RouteHazard>,
    val efficiencyScore: Int,
    val tollCostInr: Int,
    val highlights: List<String>
)

data class JourneyRoute(
    val originName: String,
    val originLat: Double,
    val originLng: Double,
    val destinationName: String,
    val destLat: Double,
    val destLng: Double,
    val selectedRouteId: String,
    val routes: List<RouteAlternative>,
    val totalTripDistanceKm: Int,
    val estimatedTravelTimeMins: Int,
    val routePolyline: List<Pair<Double, Double>>,
    val stops: List<EnRouteStop>,
    val hazards: List<RouteHazard>
)

data class FilterState(
    val searchQuery: String = "",
    val minPowerKw: Double = 0.0,
    val connectorTypes: Set<ConnectorType> = emptySet(),
    val availableOnly: Boolean = false,
    val maxDistanceKm: Double = 60.0,
    val operators: Set<String> = emptySet(),
    val maxPricePerKwh: Double = 35.0
)

data class RecommendationResult(
    val station: ChargingStation,
    val score: Int,
    val reason: String,
    val recommendedConnector: Connector
)

data class PlaceSuggestion(
    val id: String,
    val name: String,
    val fullName: String,
    val region: String,
    val state: String,
    val category: String,
    val latitude: Double,
    val longitude: Double,
    val popularHighway: String? = null,
    val distanceKm: Double? = null
)
