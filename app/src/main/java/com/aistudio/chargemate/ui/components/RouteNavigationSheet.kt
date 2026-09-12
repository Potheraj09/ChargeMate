package com.aistudio.chargemate.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.chargemate.model.*
import com.aistudio.chargemate.service.PlacesService
import com.aistudio.chargemate.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RouteNavigationSheet(
    activeJourney: JourneyRoute?,
    onDismiss: () -> Unit,
    onPlanJourney: (origin: PlaceSuggestion, destination: PlaceSuggestion) -> Unit,
    onSelectRoute: (routeId: String) -> Unit,
    onSelectStation: (ChargingStation) -> Unit
) {
    var originQuery by remember { mutableStateOf("") }
    var destQuery by remember { mutableStateOf("") }

    var selectedOrigin by remember {
        mutableStateOf(PlacesService.INDIAN_PLACES_DATABASE.first())
    }
    var selectedDest by remember {
        mutableStateOf(PlacesService.INDIAN_PLACES_DATABASE[1])
    }

    val originSuggestions = remember(originQuery) {
        PlacesService.searchIndianPlaces(originQuery).take(4)
    }
    val destSuggestions = remember(destQuery) {
        PlacesService.searchIndianPlaces(destQuery).take(4)
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = DarkSurface,
        dragHandle = { BottomSheetDefaults.DragHandle(color = TextMuted) },
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
        modifier = Modifier.testTag("route_navigation_sheet")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState())
                .padding(bottom = 32.dp)
        ) {
            // Title
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column {
                    Text(
                        text = "Highway EV Trip Planner",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Real-time corridor charging & hazard alerts",
                        color = TextSecondary,
                        fontSize = 12.sp
                    )
                }
                IconButton(onClick = onDismiss) {
                    Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = TextSecondary)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Origin Input
            OutlinedTextField(
                value = originQuery.ifEmpty { selectedOrigin.name },
                onValueChange = { originQuery = it },
                label = { Text("Starting Location", fontSize = 12.sp) },
                leadingIcon = {
                    Icon(imageVector = Icons.Default.MyLocation, contentDescription = "Origin", tint = EmeraldPrimary)
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = EmeraldPrimary,
                    unfocusedBorderColor = DarkBorder
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("route_origin_input")
            )

            if (originQuery.isNotEmpty()) {
                originSuggestions.forEach { place ->
                    Text(
                        text = "${place.name} (${place.state})",
                        color = CyanSecondary,
                        fontSize = 12.sp,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                selectedOrigin = place
                                originQuery = ""
                            }
                            .padding(vertical = 4.dp, horizontal = 8.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Destination Input
            OutlinedTextField(
                value = destQuery.ifEmpty { selectedDest.name },
                onValueChange = { destQuery = it },
                label = { Text("Destination", fontSize = 12.sp) },
                leadingIcon = {
                    Icon(imageVector = Icons.Default.LocationOn, contentDescription = "Destination", tint = RedDanger)
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = RedDanger,
                    unfocusedBorderColor = DarkBorder
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("route_destination_input")
            )

            if (destQuery.isNotEmpty()) {
                destSuggestions.forEach { place ->
                    Text(
                        text = "${place.name} (${place.state})",
                        color = CyanSecondary,
                        fontSize = 12.sp,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                selectedDest = place
                                destQuery = ""
                            }
                            .padding(vertical = 4.dp, horizontal = 8.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Plan Trip Action Button
            Button(
                onClick = { onPlanJourney(selectedOrigin, selectedDest) },
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(46.dp)
                    .testTag("plan_trip_button")
            ) {
                Icon(
                    imageVector = Icons.Default.AltRoute,
                    contentDescription = "Calculate",
                    tint = DarkBackground,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text("Calculate EV Route Alternatives", color = DarkBackground, fontWeight = FontWeight.Bold)
            }

            // Display Active Journey Results
            if (activeJourney != null) {
                Spacer(modifier = Modifier.height(20.dp))
                Text(
                    text = "Select Corridor Route",
                    color = Color.White,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(8.dp))

                activeJourney.routes.forEach { alt ->
                    val isSelected = alt.id == activeJourney.selectedRouteId
                    Surface(
                        color = if (isSelected) Color(0xFF1E293B) else DarkBackground,
                        shape = RoundedCornerShape(10.dp),
                        border = androidx.compose.foundation.BorderStroke(
                            if (isSelected) 2.dp else 1.dp,
                            if (isSelected) EmeraldPrimary else DarkBorder
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelectRoute(alt.id) }
                            .padding(vertical = 4.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = alt.name,
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                Surface(
                                    color = Color(0xFF064E3B),
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        text = alt.badge,
                                        color = EmeraldGlow,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${alt.totalTripDistanceKm} km • ${alt.estimatedTravelTimeMins} mins • ${alt.viaRoad}",
                                color = TextSecondary,
                                fontSize = 12.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Tolls: ₹${alt.tollCostInr} • ${alt.stops.size} En-Route Charging Hubs",
                                color = CyanSecondary,
                                fontSize = 11.sp
                            )
                        }
                    }
                }

                // Show Hazards
                if (activeJourney.hazards.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Corridor Live Hazard Alerts (${activeJourney.hazards.size})",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(6.dp))

                    activeJourney.hazards.forEach { hazard ->
                        Surface(
                            color = when (hazard.type) {
                                HazardType.FLOOD -> Color(0xFF172554)
                                HazardType.ACCIDENT -> Color(0xFF450A0A)
                                else -> Color(0xFF451A03)
                            },
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 3.dp)
                        ) {
                            Row(modifier = Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = when (hazard.type) {
                                        HazardType.FLOOD -> Icons.Default.WaterDamage
                                        HazardType.ACCIDENT -> Icons.Default.Warning
                                        else -> Icons.Default.Traffic
                                    },
                                    contentDescription = hazard.title,
                                    tint = when (hazard.type) {
                                        HazardType.FLOOD -> CyanSecondary
                                        HazardType.ACCIDENT -> RedDanger
                                        else -> AmberAccent
                                    },
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text(
                                        text = "${hazard.title} (+${hazard.delayMins}m delay)",
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp
                                    )
                                    Text(
                                        text = hazard.advisory,
                                        color = TextSecondary,
                                        fontSize = 11.sp
                                    )
                                }
                            }
                        }
                    }
                }

                // Show En-Route Stops
                if (activeJourney.stops.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Suggested Charging Pitstops",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(6.dp))

                    activeJourney.stops.take(3).forEach { stop ->
                        Surface(
                            color = DarkBackground,
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (stop.isSuggestedStop) EmeraldPrimary else DarkBorder
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelectStation(stop.station) }
                                .padding(vertical = 3.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = stop.station.name,
                                            color = Color.White,
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = 13.sp
                                        )
                                        if (stop.isSuggestedStop) {
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text(
                                                text = "★ Best Pitstop",
                                                color = EmeraldGlow,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                    Text(
                                        text = "${stop.distanceFromStartKm.toInt()} km from start • ${stop.detourKm} km detour • ${stop.station.maxPowerKw.toInt()} kW",
                                        color = TextSecondary,
                                        fontSize = 11.sp
                                    )
                                }
                                Icon(
                                    imageVector = Icons.Default.ChevronRight,
                                    contentDescription = "Details",
                                    tint = TextSecondary
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
