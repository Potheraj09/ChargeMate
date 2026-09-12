package com.aistudio.chargemate.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.aistudio.chargemate.data.BookingEntity
import com.aistudio.chargemate.data.ChargeMateDatabase
import com.aistudio.chargemate.data.FavoriteEntity
import com.aistudio.chargemate.model.*
import com.aistudio.chargemate.service.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import kotlin.random.Random

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val db = ChargeMateDatabase.getDatabase(application)
    private val bookingDao = db.bookingDao()
    private val favoriteDao = db.favoriteDao()

    // Location State
    private val _currentLocation = MutableStateFlow(GeoService.FALLBACK_LOCATIONS.first())
    val currentLocation: StateFlow<LocationCoordinate> = _currentLocation.asStateFlow()

    // All Generated Stations
    private val _allStations = MutableStateFlow<List<ChargingStation>>(emptyList())
    val allStations: StateFlow<List<ChargingStation>> = _allStations.asStateFlow()

    // Filter State
    private val _filterState = MutableStateFlow(FilterState())
    val filterState: StateFlow<FilterState> = _filterState.asStateFlow()

    // Active EV Profile
    private val _selectedVehicle = MutableStateFlow(RecommendationEngine.EV_PRESETS.first())
    val selectedVehicle: StateFlow<EVProfile> = _selectedVehicle.asStateFlow()

    // Recommendation Engine Result
    val recommendationResult: StateFlow<RecommendationResult?> = combine(_allStations, _selectedVehicle) { stations, vehicle ->
        RecommendationEngine.calculateBestMatch(stations, vehicle)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    // Bookings from Room DB
    val bookings: StateFlow<List<Booking>> = bookingDao.getAllBookingsFlow()
        .map { entities -> entities.map { it.toDomain() } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Favorites from Room DB
    val favoriteIds: StateFlow<Set<String>> = favoriteDao.getAllFavoriteIdsFlow()
        .map { it.toSet() }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptySet())

    // Filtered Stations
    val filteredStations: StateFlow<List<ChargingStation>> = combine(_allStations, _filterState) { stations, filter ->
        stations.filter { station ->
            if (filter.searchQuery.isNotBlank()) {
                val q = filter.searchQuery.lowercase()
                val match = station.name.lowercase().contains(q) ||
                        station.operator.lowercase().contains(q) ||
                        station.address.lowercase().contains(q) ||
                        station.city.lowercase().contains(q)
                if (!match) return@filter false
            }
            if (filter.availableOnly && station.availableConnectorsCount == 0) {
                return@filter false
            }
            if (filter.minPowerKw > 0.0 && station.maxPowerKw < filter.minPowerKw) {
                return@filter false
            }
            if (station.distanceKm > filter.maxDistanceKm) {
                return@filter false
            }
            if (filter.maxPricePerKwh < 35.0 && station.minPricePerKwh > filter.maxPricePerKwh) {
                return@filter false
            }
            if (filter.connectorTypes.isNotEmpty()) {
                val hasType = station.connectors.any { filter.connectorTypes.contains(it.type) }
                if (!hasType) return@filter false
            }
            if (filter.operators.isNotEmpty() && !filter.operators.contains(station.operator)) {
                return@filter false
            }
            true
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Route Navigation State
    private val _journeyRoute = MutableStateFlow<JourneyRoute?>(null)
    val journeyRoute: StateFlow<JourneyRoute?> = _journeyRoute.asStateFlow()

    // Monthly Charges count (Club 10+ status)
    private val _monthlyChargesCount = MutableStateFlow(12)
    val monthlyChargesCount: StateFlow<Int> = _monthlyChargesCount.asStateFlow()

    // UI Dialog & BottomSheet States
    private val _selectedStationForDetail = MutableStateFlow<ChargingStation?>(null)
    val selectedStationForDetail: StateFlow<ChargingStation?> = _selectedStationForDetail.asStateFlow()

    private val _bookingStation = MutableStateFlow<ChargingStation?>(null)
    val bookingStation: StateFlow<ChargingStation?> = _bookingStation.asStateFlow()

    private val _bookingConnector = MutableStateFlow<Connector?>(null)
    val bookingConnector: StateFlow<Connector?> = _bookingConnector.asStateFlow()

    private val _cancellationTarget = MutableStateFlow<Booking?>(null)
    val cancellationTarget: StateFlow<Booking?> = _cancellationTarget.asStateFlow()

    private val _isRouteNavOpen = MutableStateFlow(false)
    val isRouteNavOpen: StateFlow<Boolean> = _isRouteNavOpen.asStateFlow()

    private val _isFilterOpen = MutableStateFlow(false)
    val isFilterOpen: StateFlow<Boolean> = _isFilterOpen.asStateFlow()

    private val _isLoyaltyOpen = MutableStateFlow(false)
    val isLoyaltyOpen: StateFlow<Boolean> = _isLoyaltyOpen.asStateFlow()

    private val _isLocationPickerOpen = MutableStateFlow(false)
    val isLocationPickerOpen: StateFlow<Boolean> = _isLocationPickerOpen.asStateFlow()

    init {
        loadStationsForLocation(_currentLocation.value)
        startLiveTelemetryTicker()
    }

    fun setLocation(loc: LocationCoordinate) {
        _currentLocation.value = loc
        loadStationsForLocation(loc)
    }

    private fun loadStationsForLocation(loc: LocationCoordinate) {
        val generated = MockAdapter.generateSeedStationsAroundLocation(loc.latitude, loc.longitude)
        _allStations.value = generated
    }

    private fun startLiveTelemetryTicker() {
        viewModelScope.launch {
            while (true) {
                delay(12000)
                val lockedIds = bookings.value
                    .filter { it.status == BookingStatus.CONFIRMED || it.status == BookingStatus.ACTIVE }
                    .map { it.connectorId }
                    .toSet()
                val (updated, count) = MockAdapter.simulateLiveTelemetryUpdates(_allStations.value, lockedIds)
                if (count > 0) {
                    _allStations.value = updated
                }
            }
        }
    }

    fun updateFilter(modifier: (FilterState) -> FilterState) {
        _filterState.value = modifier(_filterState.value)
    }

    fun resetFilter() {
        _filterState.value = FilterState()
    }

    fun selectVehicle(profile: EVProfile) {
        _selectedVehicle.value = profile
    }

    fun toggleFavorite(stationId: String) {
        viewModelScope.launch {
            if (favoriteIds.value.contains(stationId)) {
                favoriteDao.removeFavorite(stationId)
            } else {
                favoriteDao.addFavorite(FavoriteEntity(stationId))
            }
        }
    }

    fun openStationDetail(station: ChargingStation?) {
        _selectedStationForDetail.value = station
    }

    fun startBooking(station: ChargingStation, connector: Connector? = null) {
        _bookingStation.value = station
        val selectedConn = connector ?: station.connectors.firstOrNull { it.status == ConnectorStatus.AVAILABLE } ?: station.connectors.first()
        _bookingConnector.value = selectedConn
    }

    fun closeBooking() {
        _bookingStation.value = null
        _bookingConnector.value = null
    }

    fun setBookingConnector(connector: Connector) {
        _bookingConnector.value = connector
    }

    fun confirmBooking(
        station: ChargingStation,
        connector: Connector,
        timeSlot: String,
        amountPaid: Double,
        appliedPromoCode: String? = null,
        discountAmount: Double = 0.0,
        paymentMethod: String = "UPI Instant"
    ) {
        viewModelScope.launch {
            val now = System.currentTimeMillis()
            val expiryEpoch = now + (45 * 60 * 1000)
            val sdf = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault())
            val pin = (1000 + Random.nextInt(9000)).toString()
            val bookingId = "BK-${System.currentTimeMillis().toString().takeLast(6)}"

            val newBooking = Booking(
                id = bookingId,
                stationId = station.id,
                stationName = station.name,
                stationAddress = station.address,
                stationOperator = station.operator,
                connectorId = connector.id,
                connectorType = connector.type,
                powerKw = connector.powerKw,
                timeSlot = timeSlot,
                date = SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(Date()),
                estCost = connector.pricePerKwh * 30.0,
                status = BookingStatus.CONFIRMED,
                createdAt = sdf.format(Date(now)),
                expiryEpoch = expiryEpoch,
                pinCode = pin,
                paymentId = "pay_${UUID.randomUUID().toString().take(8)}",
                paymentMethod = paymentMethod,
                razorpayOrderId = "order_${UUID.randomUUID().toString().take(10)}",
                amountPaid = amountPaid,
                appliedOfferCode = appliedPromoCode,
                discountAmount = discountAmount
            )

            bookingDao.insertBooking(BookingEntity.fromDomain(newBooking))

            // Lock the connector status in memory
            _allStations.value = _allStations.value.map { st ->
                if (st.id == station.id) {
                    val updatedConns = st.connectors.map { c ->
                        if (c.id == connector.id) c.copy(status = ConnectorStatus.RESERVED) else c
                    }
                    st.copy(connectors = updatedConns)
                } else st
            }

            closeBooking()
        }
    }

    fun openCancellation(booking: Booking) {
        _cancellationTarget.value = booking
    }

    fun closeCancellation() {
        _cancellationTarget.value = null
    }

    fun processCancellation(booking: Booking, reason: String) {
        viewModelScope.launch {
            val calc = LoyaltyOffersService.calculateCancellationRefund(booking)
            val now = System.currentTimeMillis()
            val sdf = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault())

            val updated = booking.copy(
                status = if (calc.eligibleForFullRefund) BookingStatus.CANCELLED else BookingStatus.NO_SHOW_PENALTY,
                refundStatus = if (calc.eligibleForFullRefund) RefundStatus.FULL_REFUNDED else RefundStatus.PARTIAL_REFUNDED,
                refundAmount = calc.refundAmount,
                penaltyAmount = calc.penaltyFee,
                refundId = "rfnd_${UUID.randomUUID().toString().take(10)}",
                refundReason = reason,
                refundTimestamp = sdf.format(Date(now))
            )

            bookingDao.updateBooking(BookingEntity.fromDomain(updated))

            // Release connector slot back to AVAILABLE
            _allStations.value = _allStations.value.map { st ->
                if (st.id == booking.stationId) {
                    val updatedConns = st.connectors.map { c ->
                        if (c.id == booking.connectorId && c.status == ConnectorStatus.RESERVED) {
                            c.copy(status = ConnectorStatus.AVAILABLE)
                        } else c
                    }
                    st.copy(connectors = updatedConns)
                } else st
            }

            closeCancellation()
        }
    }

    fun setRouteNavOpen(open: Boolean) {
        _isRouteNavOpen.value = open
    }

    fun setFilterOpen(open: Boolean) {
        _isFilterOpen.value = open
    }

    fun setLoyaltyOpen(open: Boolean) {
        _isLoyaltyOpen.value = open
    }

    fun setLocationPickerOpen(open: Boolean) {
        _isLocationPickerOpen.value = open
    }

    fun planJourney(origin: PlaceSuggestion, destination: PlaceSuggestion) {
        val journey = CorridorRouteService.calculateJourneyPlan(
            originName = origin.name,
            originLat = origin.latitude,
            originLng = origin.longitude,
            destName = destination.name,
            destLat = destination.latitude,
            destLng = destination.longitude,
            baseStations = _allStations.value
        )
        _journeyRoute.value = journey
    }

    fun selectRouteAlternative(routeId: String) {
        val current = _journeyRoute.value ?: return
        val selected = current.routes.find { it.id == routeId } ?: return
        _journeyRoute.value = current.copy(
            selectedRouteId = routeId,
            totalTripDistanceKm = selected.totalTripDistanceKm,
            estimatedTravelTimeMins = selected.estimatedTravelTimeMins,
            routePolyline = selected.routePolyline,
            stops = selected.stops,
            hazards = selected.hazards
        )
    }

    fun clearJourneyRoute() {
        _journeyRoute.value = null
    }
}
