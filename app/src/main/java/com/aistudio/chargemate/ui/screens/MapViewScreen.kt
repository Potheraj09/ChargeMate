package com.aistudio.chargemate.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.chargemate.model.ChargingStation
import com.aistudio.chargemate.model.JourneyRoute
import com.aistudio.chargemate.service.LocationCoordinate
import com.aistudio.chargemate.ui.components.OperatorBadge
import com.aistudio.chargemate.ui.theme.*
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun MapViewScreen(
    currentLocation: LocationCoordinate,
    stations: List<ChargingStation>,
    journeyRoute: JourneyRoute?,
    onSelectStation: (ChargingStation) -> Unit,
    onOpenRoutePlanner: () -> Unit,
    onOpenLoyalty: () -> Unit,
    onOpenLocationPicker: () -> Unit,
    modifier: Modifier = Modifier
) {
    // Pulse animation for user GPS marker
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseRadius by infiniteTransition.animateFloat(
        initialValue = 12f,
        targetValue = 32f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "pulse_radius"
    )
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.6f,
        targetValue = 0.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "pulse_alpha"
    )

    Box(modifier = modifier.fillMaxSize().background(DarkBackground)) {
        // Custom Map Rendering Canvas
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(stations) {
                    detectTapGestures { tapOffset ->
                        val centerX = size.width / 2f
                        val centerY = size.height / 2f
                        // Find closest station to tap
                        val closest = stations.minByOrNull { st ->
                            val dx = (st.longitude - currentLocation.longitude) * 4500f
                            val dy = -(st.latitude - currentLocation.latitude) * 4500f
                            val sx = centerX + dx
                            val sy = centerY + dy
                            val dist = (tapOffset.x - sx) * (tapOffset.x - sx) + (tapOffset.y - sy) * (tapOffset.y - sy)
                            dist
                        }
                        if (closest != null) {
                            val dx = (closest.longitude - currentLocation.longitude) * 4500f
                            val dy = -(closest.latitude - currentLocation.latitude) * 4500f
                            val sx = centerX + dx
                            val sy = centerY + dy
                            val touchDist = kotlin.math.sqrt(((tapOffset.x - sx) * (tapOffset.x - sx) + (tapOffset.y - sy) * (tapOffset.y - sy)).toDouble())
                            if (touchDist < 80.0) {
                                onSelectStation(closest)
                            }
                        }
                    }
                }
        ) {
            val width = size.width
            val height = size.height
            val centerX = width / 2f
            val centerY = height / 2f

            // Map grid lines (representing road grid)
            val gridColor = Color(0xFF1E293B).copy(alpha = 0.4f)
            for (x in 0..width.toInt() step 80) {
                drawLine(gridColor, Offset(x.toFloat(), 0f), Offset(x.toFloat(), height), 1f)
            }
            for (y in 0..height.toInt() step 80) {
                drawLine(gridColor, Offset(0f, y.toFloat()), Offset(width, y.toFloat()), 1f)
            }

            // Arterial road representations
            val roadColor = Color(0xFF334155).copy(alpha = 0.5f)
            drawLine(roadColor, Offset(0f, centerY - 60f), Offset(width, centerY - 20f), 6f)
            drawLine(roadColor, Offset(centerX - 120f, 0f), Offset(centerX + 80f, height), 6f)
            drawLine(roadColor, Offset(0f, centerY + 160f), Offset(width, centerY + 120f), 4f)

            // Draw Journey Route Polyline if present
            if (journeyRoute != null && journeyRoute.routePolyline.isNotEmpty()) {
                val path = Path()
                val points = journeyRoute.routePolyline
                points.forEachIndexed { index, coord ->
                    val px = centerX + ((coord.second - currentLocation.longitude) * 4500f).toFloat()
                    val py = centerY - ((coord.first - currentLocation.latitude) * 4500f).toFloat()
                    if (index == 0) path.moveTo(px, py) else path.lineTo(px, py)
                }
                drawPath(path, color = CyanSecondary.copy(alpha = 0.3f), style = Stroke(width = 10f))
                drawPath(path, color = EmeraldPrimary, style = Stroke(width = 4f))
            }

            // User Pulsing GPS Location Marker
            drawCircle(color = CyanSecondary.copy(alpha = pulseAlpha), radius = pulseRadius, center = Offset(centerX, centerY))
            drawCircle(color = CyanSecondary, radius = 8f, center = Offset(centerX, centerY))
            drawCircle(color = Color.White, radius = 3.5f, center = Offset(centerX, centerY))

            // Station Pins
            stations.take(20).forEach { st ->
                val px = centerX + ((st.longitude - currentLocation.longitude) * 4500f).toFloat()
                val py = centerY - ((st.latitude - currentLocation.latitude) * 4500f).toFloat()

                if (px in 20f..(width - 20f) && py in 40f..(height - 80f)) {
                    val pinColor = when {
                        st.availableConnectorsCount > 0 -> EmeraldPrimary
                        else -> AmberAccent
                    }
                    // Outer glow
                    drawCircle(color = pinColor.copy(alpha = 0.25f), radius = 16f, center = Offset(px, py))
                    // Pin Body
                    drawCircle(color = pinColor, radius = 9f, center = Offset(px, py))
                    drawCircle(color = DarkBackground, radius = 5f, center = Offset(px, py))
                }
            }
        }

        // Top Floating Control Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Location Selector Pill
            Surface(
                color = DarkSurface.copy(alpha = 0.92f),
                shape = RoundedCornerShape(24.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                modifier = Modifier
                    .clickable { onOpenLocationPicker() }
                    .testTag("map_location_picker_chip")
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                ) {
                    Icon(imageVector = Icons.Default.MyLocation, contentDescription = "Location", tint = EmeraldPrimary, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = currentLocation.name.take(22), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    Icon(imageVector = Icons.Default.ArrowDropDown, contentDescription = "Change", tint = TextSecondary)
                }
            }

            // Quick Actions: Route Trip & Loyalty
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                IconButton(
                    onClick = onOpenLoyalty,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(DarkSurface.copy(alpha = 0.92f))
                        .testTag("map_loyalty_button")
                ) {
                    Icon(imageVector = Icons.Default.CardGiftcard, contentDescription = "Club 10+", tint = PurpleTertiary)
                }

                IconButton(
                    onClick = onOpenRoutePlanner,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(EmeraldPrimary)
                        .testTag("map_route_button")
                ) {
                    Icon(imageVector = Icons.Default.AltRoute, contentDescription = "Highway Trip", tint = DarkBackground)
                }
            }
        }

        // Bottom Quick Station Carousel
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(bottom = 12.dp)
        ) {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(stations.take(8)) { st ->
                    Surface(
                        color = DarkSurface.copy(alpha = 0.95f),
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                        modifier = Modifier
                            .width(260.dp)
                            .clickable { onSelectStation(st) }
                            .testTag("carousel_station_${st.id}")
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                OperatorBadge(operator = st.operator, colorHex = st.operatorLogoColor)
                                Text(
                                    text = "${st.distanceKm} km",
                                    color = EmeraldGlow,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = st.name,
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                maxLines = 1
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${st.availableConnectorsCount}/${st.connectors.size} Open • Up to ${st.maxPowerKw.toInt()} kW",
                                color = if (st.availableConnectorsCount > 0) EmeraldGlow else AmberAccent,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
