package com.aistudio.chargemate

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.aistudio.chargemate.model.BookingStatus
import com.aistudio.chargemate.ui.components.*
import com.aistudio.chargemate.ui.screens.*
import com.aistudio.chargemate.ui.theme.*
import com.aistudio.chargemate.ui.viewmodel.MainViewModel

enum class NavigationTab(val label: String, val icon: ImageVector, val tag: String) {
    MAP("Map", Icons.Default.Map, "nav_tab_map"),
    STATIONS("Stations", Icons.Default.EvStation, "nav_tab_stations"),
    BOOKINGS("Bookings", Icons.Default.ReceiptLong, "nav_tab_bookings"),
    VEHICLE("Vehicle", Icons.Default.DirectionsCar, "nav_tab_vehicle"),
    FAVORITES("Saved", Icons.Default.Favorite, "nav_tab_favorites")
}

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            ChargeMateTheme {
                ChargeMateApp(viewModel = viewModel)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChargeMateApp(viewModel: MainViewModel) {
    var currentTab by remember { mutableStateOf(NavigationTab.MAP) }

    val currentLocation by viewModel.currentLocation.collectAsStateWithLifecycle()
    val allStations by viewModel.allStations.collectAsStateWithLifecycle()
    val filteredStations by viewModel.filteredStations.collectAsStateWithLifecycle()
    val filterState by viewModel.filterState.collectAsStateWithLifecycle()
    val selectedVehicle by viewModel.selectedVehicle.collectAsStateWithLifecycle()
    val recommendation by viewModel.recommendationResult.collectAsStateWithLifecycle()
    val bookings by viewModel.bookings.collectAsStateWithLifecycle()
    val favoriteIds by viewModel.favoriteIds.collectAsStateWithLifecycle()
    val journeyRoute by viewModel.journeyRoute.collectAsStateWithLifecycle()
    val monthlyChargesCount by viewModel.monthlyChargesCount.collectAsStateWithLifecycle()

    // Sheet states
    val selectedStationForDetail by viewModel.selectedStationForDetail.collectAsStateWithLifecycle()
    val bookingStation by viewModel.bookingStation.collectAsStateWithLifecycle()
    val bookingConnector by viewModel.bookingConnector.collectAsStateWithLifecycle()
    val cancellationTarget by viewModel.cancellationTarget.collectAsStateWithLifecycle()
    val isRouteNavOpen by viewModel.isRouteNavOpen.collectAsStateWithLifecycle()
    val isFilterOpen by viewModel.isFilterOpen.collectAsStateWithLifecycle()
    val isLoyaltyOpen by viewModel.isLoyaltyOpen.collectAsStateWithLifecycle()
    val isLocationPickerOpen by viewModel.isLocationPickerOpen.collectAsStateWithLifecycle()

    val activeBookingsCount = remember(bookings) {
        bookings.count { it.status == BookingStatus.CONFIRMED || it.status == BookingStatus.ACTIVE }
    }

    val favoriteStations = remember(allStations, favoriteIds) {
        allStations.filter { favoriteIds.contains(it.id) }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        contentWindowInsets = WindowInsets.safeDrawing,
        containerColor = DarkBackground,
        bottomBar = {
            NavigationBar(
                containerColor = DarkSurface,
                tonalElevation = 8.dp,
                modifier = Modifier.testTag("bottom_nav_bar")
            ) {
                NavigationTab.values().forEach { tab ->
                    val isSelected = tab == currentTab
                    NavigationBarItem(
                        selected = isSelected,
                        onClick = { currentTab = tab },
                        icon = {
                            if (tab == NavigationTab.BOOKINGS && activeBookingsCount > 0) {
                                BadgedBox(badge = { Badge { Text(activeBookingsCount.toString()) } }) {
                                    Icon(imageVector = tab.icon, contentDescription = tab.label)
                                }
                            } else {
                                Icon(imageVector = tab.icon, contentDescription = tab.label)
                            }
                        },
                        label = { Text(tab.label, fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = EmeraldPrimary,
                            selectedTextColor = EmeraldPrimary,
                            unselectedIconColor = TextSecondary,
                            unselectedTextColor = TextSecondary,
                            indicatorColor = DarkSurfaceVariant
                        ),
                        modifier = Modifier.testTag(tab.tag)
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (currentTab) {
                NavigationTab.MAP -> {
                    MapViewScreen(
                        currentLocation = currentLocation,
                        stations = filteredStations,
                        journeyRoute = journeyRoute,
                        onSelectStation = { viewModel.openStationDetail(it) },
                        onOpenRoutePlanner = { viewModel.setRouteNavOpen(true) },
                        onOpenLoyalty = { viewModel.setLoyaltyOpen(true) },
                        onOpenLocationPicker = { viewModel.setLocationPickerOpen(true) }
                    )
                }
                NavigationTab.STATIONS -> {
                    StationListScreen(
                        currentLocation = currentLocation,
                        stations = filteredStations,
                        filterState = filterState,
                        selectedVehicle = selectedVehicle,
                        recommendation = recommendation,
                        favoriteIds = favoriteIds,
                        onSelectStation = { viewModel.openStationDetail(it) },
                        onBookSlot = { station, connector -> viewModel.startBooking(station, connector) },
                        onToggleFavorite = { viewModel.toggleFavorite(it) },
                        onOpenFilter = { viewModel.setFilterOpen(true) },
                        onUpdateSearch = { q -> viewModel.updateFilter { it.copy(searchQuery = q) } },
                        onQuickFilterFastDc = {
                            viewModel.updateFilter { current ->
                                current.copy(minPowerKw = if (current.minPowerKw >= 60.0) 0.0 else 60.0)
                            }
                        },
                        onQuickFilterAvailable = {
                            viewModel.updateFilter { current ->
                                current.copy(availableOnly = !current.availableOnly)
                            }
                        },
                        onOpenLocationPicker = { viewModel.setLocationPickerOpen(true) }
                    )
                }
                NavigationTab.BOOKINGS -> {
                    BookingsScreen(
                        bookings = bookings,
                        onCancelBooking = { viewModel.openCancellation(it) },
                        onExploreStations = { currentTab = NavigationTab.STATIONS }
                    )
                }
                NavigationTab.VEHICLE -> {
                    VehicleProfileScreen(
                        activeVehicle = selectedVehicle,
                        onSelectVehicle = { viewModel.selectVehicle(it) }
                    )
                }
                NavigationTab.FAVORITES -> {
                    FavoritesScreen(
                        favoriteStations = favoriteStations,
                        onSelectStation = { viewModel.openStationDetail(it) },
                        onBookSlot = { viewModel.startBooking(it, null) },
                        onRemoveFavorite = { viewModel.toggleFavorite(it) },
                        onExploreStations = { currentTab = NavigationTab.STATIONS }
                    )
                }
            }

            // Bottom Sheets
            if (selectedStationForDetail != null) {
                val st = selectedStationForDetail!!
                StationDetailSheet(
                    station = st,
                    isFavorite = favoriteIds.contains(st.id),
                    onDismiss = { viewModel.openStationDetail(null) },
                    onToggleFavorite = { viewModel.toggleFavorite(st.id) },
                    onBookSlot = { conn ->
                        viewModel.openStationDetail(null)
                        viewModel.startBooking(st, conn)
                    },
                    onNavigate = {
                        viewModel.openStationDetail(null)
                        viewModel.setRouteNavOpen(true)
                    }
                )
            }

            if (bookingStation != null) {
                BookingSheet(
                    station = bookingStation!!,
                    initialConnector = bookingConnector,
                    monthlyChargesCount = monthlyChargesCount,
                    onDismiss = { viewModel.closeBooking() },
                    onConfirmBooking = { conn, slot, deposit, promo, disc, method ->
                        viewModel.confirmBooking(
                            station = bookingStation!!,
                            connector = conn,
                            timeSlot = slot,
                            amountPaid = deposit,
                            appliedPromoCode = promo,
                            discountAmount = disc,
                            paymentMethod = method
                        )
                    }
                )
            }

            if (cancellationTarget != null) {
                CancellationRefundSheet(
                    booking = cancellationTarget!!,
                    onDismiss = { viewModel.closeCancellation() },
                    onConfirmCancellation = { reason ->
                        viewModel.processCancellation(cancellationTarget!!, reason)
                    }
                )
            }

            if (isRouteNavOpen) {
                RouteNavigationSheet(
                    activeJourney = journeyRoute,
                    onDismiss = { viewModel.setRouteNavOpen(false) },
                    onPlanJourney = { orig, dest -> viewModel.planJourney(orig, dest) },
                    onSelectRoute = { routeId -> viewModel.selectRouteAlternative(routeId) },
                    onSelectStation = { st ->
                        viewModel.setRouteNavOpen(false)
                        viewModel.openStationDetail(st)
                    }
                )
            }

            if (isLoyaltyOpen) {
                LoyaltyClubSheet(
                    monthlyChargesCount = monthlyChargesCount,
                    onDismiss = { viewModel.setLoyaltyOpen(false) }
                )
            }

            if (isFilterOpen) {
                FilterSheet(
                    filterState = filterState,
                    onDismiss = { viewModel.setFilterOpen(false) },
                    onUpdateFilter = { mod -> viewModel.updateFilter(mod) },
                    onResetFilter = { viewModel.resetFilter() }
                )
            }

            if (isLocationPickerOpen) {
                LocationPickerSheet(
                    currentLocation = currentLocation,
                    onDismiss = { viewModel.setLocationPickerOpen(false) },
                    onSelectLocation = { loc -> viewModel.setLocation(loc) }
                )
            }
        }
    }
}
