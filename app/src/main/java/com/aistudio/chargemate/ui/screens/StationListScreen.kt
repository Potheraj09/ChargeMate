package com.aistudio.chargemate.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.chargemate.model.*
import com.aistudio.chargemate.service.LocationCoordinate
import com.aistudio.chargemate.ui.components.AmenityChip
import com.aistudio.chargemate.ui.components.OperatorBadge
import com.aistudio.chargemate.ui.components.RatingBadge
import com.aistudio.chargemate.ui.components.StatusBadge
import com.aistudio.chargemate.ui.theme.*

@Composable
fun StationListScreen(
    currentLocation: LocationCoordinate,
    stations: List<ChargingStation>,
    filterState: FilterState,
    selectedVehicle: EVProfile,
    recommendation: RecommendationResult?,
    favoriteIds: Set<String>,
    onSelectStation: (ChargingStation) -> Unit,
    onBookSlot: (ChargingStation, Connector?) -> Unit,
    onToggleFavorite: (String) -> Unit,
    onOpenFilter: () -> Unit,
    onUpdateSearch: (String) -> Unit,
    onQuickFilterFastDc: () -> Unit,
    onQuickFilterAvailable: () -> Unit,
    onOpenLocationPicker: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBackground)
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(10.dp))

        // Search Bar & Filter Button
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            OutlinedTextField(
                value = filterState.searchQuery,
                onValueChange = onUpdateSearch,
                placeholder = { Text("Search by name, operator, area...", color = TextMuted, fontSize = 13.sp) },
                leadingIcon = {
                    Icon(imageVector = Icons.Default.Search, contentDescription = "Search", tint = TextSecondary)
                },
                trailingIcon = {
                    if (filterState.searchQuery.isNotEmpty()) {
                        IconButton(onClick = { onUpdateSearch("") }) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Clear", tint = TextSecondary)
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = EmeraldPrimary,
                    unfocusedBorderColor = DarkBorder,
                    focusedContainerColor = DarkSurface,
                    unfocusedContainerColor = DarkSurface
                ),
                modifier = Modifier
                    .weight(1f)
                    .height(52.dp)
                    .testTag("station_search_input")
            )

            Spacer(modifier = Modifier.width(8.dp))

            IconButton(
                onClick = onOpenFilter,
                modifier = Modifier
                    .size(52.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(DarkSurface)
                    .testTag("open_filter_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Tune,
                    contentDescription = "Filter",
                    tint = if (filterState.minPowerKw > 0 || filterState.availableOnly || filterState.connectorTypes.isNotEmpty()) EmeraldPrimary else TextSecondary
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Location Chip & Quick Filter Pills
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Surface(
                color = DarkSurfaceVariant,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.clickable { onOpenLocationPicker() }
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Icon(imageVector = Icons.Default.LocationOn, contentDescription = "Location", tint = CyanSecondary, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = currentLocation.city, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                }
            }

            FilterChip(
                selected = filterState.minPowerKw >= 60.0,
                onClick = onQuickFilterFastDc,
                label = { Text("⚡ ≥60kW DC", fontSize = 11.sp) },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = EmeraldPrimary.copy(alpha = 0.2f),
                    selectedLabelColor = EmeraldGlow
                )
            )

            FilterChip(
                selected = filterState.availableOnly,
                onClick = onQuickFilterAvailable,
                label = { Text("🟢 Available Only", fontSize = 11.sp) },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = EmeraldPrimary.copy(alpha = 0.2f),
                    selectedLabelColor = EmeraldGlow
                )
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Station Feed
        LazyColumn(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(bottom = 24.dp)
        ) {
            // Recommendation Hero Card (if available and no deep search query active)
            if (recommendation != null && filterState.searchQuery.isEmpty()) {
                item {
                    Surface(
                        color = Color(0xFF062828),
                        shape = RoundedCornerShape(14.dp),
                        border = androidx.compose.foundation.BorderStroke(1.5.dp, EmeraldPrimary),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelectStation(recommendation.station) }
                            .testTag("recommendation_hero_card")
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.AutoAwesome,
                                        contentDescription = "Best Match",
                                        tint = EmeraldPrimary,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "Best Match for ${selectedVehicle.model}",
                                        color = EmeraldGlow,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    )
                                }
                                Surface(
                                    color = EmeraldPrimary,
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        text = "${recommendation.score}% Match",
                                        color = DarkBackground,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.sp,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = recommendation.station.name,
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )

                            Spacer(modifier = Modifier.height(4.dp))

                            Text(
                                text = recommendation.reason,
                                color = TextSecondary,
                                fontSize = 12.sp,
                                lineHeight = 16.sp
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            Row(
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = "${recommendation.recommendedConnector.powerKw.toInt()} kW ${recommendation.recommendedConnector.type.name} • ${recommendation.station.distanceKm} km away",
                                    color = CyanSecondary,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )

                                Button(
                                    onClick = { onBookSlot(recommendation.station, recommendation.recommendedConnector) },
                                    shape = RoundedCornerShape(8.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text("Book Bay", color = DarkBackground, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }
            }

            // Station List Count
            item {
                Text(
                    text = "Charging Stations (${stations.size} Found)",
                    color = TextSecondary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            // Stations items
            items(stations, key = { it.id }) { station ->
                val isFav = favoriteIds.contains(station.id)
                Surface(
                    color = DarkSurface,
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSelectStation(station) }
                        .testTag("station_card_${station.id}")
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        // Top row: Operator & Favorite
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            OperatorBadge(operator = station.operator, colorHex = station.operatorLogoColor)

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "${station.distanceKm} km",
                                    color = EmeraldGlow,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                IconButton(
                                    onClick = { onToggleFavorite(station.id) },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(
                                        imageVector = if (isFav) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                        contentDescription = "Favorite",
                                        tint = if (isFav) RedDanger else TextSecondary,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        // Station Name
                        Text(
                            text = station.name,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )

                        Spacer(modifier = Modifier.height(2.dp))

                        Text(
                            text = station.address,
                            color = TextSecondary,
                            fontSize = 12.sp,
                            maxLines = 1
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // Connectors Summary
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Surface(
                                color = if (station.availableConnectorsCount > 0) Color(0xFF064E3B) else Color(0xFF451A03),
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    text = "${station.availableConnectorsCount} of ${station.connectors.size} Available",
                                    color = if (station.availableConnectorsCount > 0) EmeraldGlow else AmberAccent,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(8.dp))

                            Text(
                                text = "Up to ${station.maxPowerKw.toInt()} kW • ₹${station.minPricePerKwh}/kWh",
                                color = TextSecondary,
                                fontSize = 11.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Amenities & Action
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            RatingBadge(rating = station.rating, reviewCount = station.reviewCount)

                            Button(
                                onClick = { onBookSlot(station, null) },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                                modifier = Modifier.testTag("station_book_button_${station.id}")
                            ) {
                                Text("Reserve", color = DarkBackground, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
