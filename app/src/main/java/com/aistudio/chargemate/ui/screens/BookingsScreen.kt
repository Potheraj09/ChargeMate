package com.aistudio.chargemate.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.chargemate.model.Booking
import com.aistudio.chargemate.model.BookingStatus
import com.aistudio.chargemate.ui.theme.*
import kotlin.math.max
import kotlin.math.roundToInt

@Composable
fun BookingsScreen(
    bookings: List<Booking>,
    onCancelBooking: (Booking) -> Unit,
    onExploreStations: () -> Unit,
    modifier: Modifier = Modifier
) {
    val activeBookings = bookings.filter { it.status == BookingStatus.CONFIRMED || it.status == BookingStatus.ACTIVE }
    val pastBookings = bookings.filter { it.status != BookingStatus.CONFIRMED && it.status != BookingStatus.ACTIVE }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBackground)
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "My Reservations",
            color = Color.White,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Live reserved bays & verified booking passes",
            color = TextSecondary,
            fontSize = 12.sp
        )

        Spacer(modifier = Modifier.height(16.dp))

        if (bookings.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(bottom = 60.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.ElectricCar,
                        contentDescription = "No Bookings",
                        tint = TextMuted,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "No Active Reservations",
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Reserve a high-speed charging bay in advance to guarantee zero queue times.",
                        color = TextSecondary,
                        fontSize = 12.sp,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        modifier = Modifier.padding(horizontal = 32.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = onExploreStations,
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                    ) {
                        Text("Find Nearby Bays", color = DarkBackground, fontWeight = FontWeight.Bold)
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                contentPadding = PaddingValues(bottom = 32.dp)
            ) {
                // Active Bookings
                if (activeBookings.isNotEmpty()) {
                    item {
                        Text(
                            text = "Active Bay Reservations (${activeBookings.size})",
                            color = EmeraldGlow,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    items(activeBookings, key = { it.id }) { booking ->
                        val remainingMinutes = max(0L, (booking.expiryEpoch - System.currentTimeMillis()) / (60 * 1000)).toInt()

                        Surface(
                            color = Color(0xFF0F1E2A),
                            shape = RoundedCornerShape(14.dp),
                            border = androidx.compose.foundation.BorderStroke(1.5.dp, CyanSecondary),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("active_booking_card_${booking.id}")
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.CheckCircle,
                                            contentDescription = "Confirmed",
                                            tint = EmeraldPrimary,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "Bay Locked & Guaranteed",
                                            color = EmeraldGlow,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp
                                        )
                                    }

                                    Surface(
                                        color = Color(0xFF1E293B),
                                        shape = RoundedCornerShape(6.dp)
                                    ) {
                                        Text(
                                            text = "Hold: ${remainingMinutes}m left",
                                            color = AmberAccent,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 11.sp,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                Text(
                                    text = booking.stationName,
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp
                                )

                                Spacer(modifier = Modifier.height(4.dp))

                                Text(
                                    text = "${booking.connectorType.label} • ${booking.powerKw.toInt()} kW Fast DC",
                                    color = CyanSecondary,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold
                                )

                                Spacer(modifier = Modifier.height(2.dp))

                                Text(
                                    text = "${booking.stationAddress} • ${booking.timeSlot}",
                                    color = TextSecondary,
                                    fontSize = 11.sp
                                )

                                Spacer(modifier = Modifier.height(12.dp))

                                // PIN Verification Card
                                Surface(
                                    color = DarkBackground,
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)
                                    ) {
                                        Column {
                                            Text("Station Unlock PIN", color = TextMuted, fontSize = 10.sp)
                                            Text(
                                                text = booking.pinCode,
                                                color = Color.White,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 20.sp,
                                                letterSpacing = 4.sp
                                            )
                                        }

                                        Column(horizontalAlignment = Alignment.End) {
                                            Text("Deposit Paid", color = TextMuted, fontSize = 10.sp)
                                            Text(
                                                text = "₹${booking.amountPaid.roundToInt()}",
                                                color = EmeraldPrimary,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 15.sp
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                // Cancel Action
                                OutlinedButton(
                                    onClick = { onCancelBooking(booking) },
                                    shape = RoundedCornerShape(8.dp),
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = RedDanger),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, RedDanger.copy(alpha = 0.6f)),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(42.dp)
                                        .testTag("cancel_booking_button_${booking.id}")
                                ) {
                                    Icon(imageVector = Icons.Default.Cancel, contentDescription = "Cancel", modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Cancel & Instant Refund", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                }
                            }
                        }
                    }
                }

                // Past Bookings
                if (pastBookings.isNotEmpty()) {
                    item {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Past History & Refunds (${pastBookings.size})",
                            color = TextSecondary,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    items(pastBookings, key = { it.id }) { booking ->
                        Surface(
                            color = DarkSurface,
                            shape = RoundedCornerShape(10.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = booking.stationName,
                                        color = Color.White,
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 14.sp
                                    )
                                    Surface(
                                        color = when (booking.status) {
                                            BookingStatus.CANCELLED -> Color(0xFF1E293B)
                                            BookingStatus.NO_SHOW_PENALTY -> Color(0xFF450A0A)
                                            else -> Color(0xFF064E3B)
                                        },
                                        shape = RoundedCornerShape(4.dp)
                                    ) {
                                        Text(
                                            text = booking.status.name,
                                            color = when (booking.status) {
                                                BookingStatus.CANCELLED -> TextSecondary
                                                BookingStatus.NO_SHOW_PENALTY -> RedDanger
                                                else -> EmeraldGlow
                                            },
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "${booking.connectorType.label} • ${booking.createdAt}",
                                    color = TextMuted,
                                    fontSize = 11.sp
                                )
                                if (booking.refundAmount > 0.0) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "Refund: ₹${booking.refundAmount.roundToInt()} credited • Ref: ${booking.refundId ?: "Auto"}",
                                        color = EmeraldGlow,
                                        fontSize = 11.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
