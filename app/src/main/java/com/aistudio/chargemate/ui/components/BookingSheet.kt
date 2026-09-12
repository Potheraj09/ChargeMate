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
import com.aistudio.chargemate.model.ChargingStation
import com.aistudio.chargemate.model.Connector
import com.aistudio.chargemate.model.ConnectorStatus
import com.aistudio.chargemate.service.LoyaltyOffersService
import com.aistudio.chargemate.ui.theme.*
import kotlin.math.max

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BookingSheet(
    station: ChargingStation,
    initialConnector: Connector?,
    monthlyChargesCount: Int,
    onDismiss: () -> Unit,
    onConfirmBooking: (connector: Connector, timeSlot: String, finalDeposit: Double, promoCode: String?, discount: Double, paymentMethod: String) -> Unit
) {
    var selectedConnector by remember {
        mutableStateOf(initialConnector ?: station.connectors.firstOrNull { it.status == ConnectorStatus.AVAILABLE } ?: station.connectors.first())
    }

    val timeSlots = listOf("Immediate (Within 15 mins)", "Next 30 mins", "Next 45 mins", "Next 1 Hour")
    var selectedSlot by remember { mutableStateOf(timeSlots.first()) }

    var promoInput by remember { mutableStateOf("") }
    var appliedPromo by remember { mutableStateOf<String?>(null) }
    var discountAmount by remember { mutableDoubleStateOf(0.0) }
    var promoMessage by remember { mutableStateOf<String?>(null) }

    val paymentMethods = listOf("UPI Instant (GPay / PhonePe)", "Credit / Debit Card", "Net Banking")
    var selectedPaymentMethod by remember { mutableStateOf(paymentMethods.first()) }

    val baseDeposit = 100.0
    val finalDeposit = max(0.0, baseDeposit - discountAmount)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = DarkSurface,
        dragHandle = { BottomSheetDefaults.DragHandle(color = TextMuted) },
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
        modifier = Modifier.testTag("booking_sheet")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState())
                .padding(bottom = 32.dp)
        ) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column {
                    Text(
                        text = "Reserve Charging Bay",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = station.name,
                        color = TextSecondary,
                        fontSize = 13.sp
                    )
                }
                IconButton(onClick = onDismiss) {
                    Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = TextSecondary)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Step 1: Select Connector
            Text(
                text = "1. Select Connector Bay",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(8.dp))

            station.connectors.forEach { conn ->
                val isSelected = conn.id == selectedConnector.id
                ConnectorRowItem(
                    connector = conn,
                    isSelected = isSelected,
                    onClick = { selectedConnector = conn }
                )
                Spacer(modifier = Modifier.height(8.dp))
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Step 2: Select Arrival Slot
            Text(
                text = "2. Estimated Arrival Time",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(8.dp))

            timeSlots.forEach { slot ->
                val isSelected = slot == selectedSlot
                Surface(
                    color = if (isSelected) EmeraldPrimary.copy(alpha = 0.12f) else DarkBackground,
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, if (isSelected) EmeraldPrimary else DarkBorder),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { selectedSlot = slot }
                        .padding(vertical = 3.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)
                    ) {
                        RadioButton(
                            selected = isSelected,
                            onClick = { selectedSlot = slot },
                            colors = RadioButtonDefaults.colors(selectedColor = EmeraldPrimary)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = slot,
                            color = if (isSelected) Color.White else TextSecondary,
                            fontSize = 13.sp,
                            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Step 3: Promo / Club 10+ Code
            Text(
                text = "3. Apply Voucher / Club 10+ Code",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(6.dp))

            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedTextField(
                    value = promoInput,
                    onValueChange = { promoInput = it },
                    placeholder = { Text("e.g. CLUB10EV, ZEROFEES", color = TextMuted, fontSize = 12.sp) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = EmeraldPrimary,
                        unfocusedBorderColor = DarkBorder
                    ),
                    modifier = Modifier
                        .weight(1f)
                        .testTag("promo_input")
                )
                Spacer(modifier = Modifier.width(8.dp))
                Button(
                    onClick = {
                        val (success, result) = LoyaltyOffersService.applyOfferCode(
                            promoInput,
                            baseDeposit,
                            monthlyChargesCount
                        )
                        if (success && result.second != null) {
                            appliedPromo = promoInput.trim().uppercase()
                            discountAmount = result.first
                            promoMessage = "Applied ${result.second!!.title}! Saved ₹${result.first.toInt()}."
                        } else {
                            promoMessage = "Invalid code or requirement not met (e.g. Club 10+ requires 10 charges)."
                        }
                    },
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = CyanSecondary),
                    modifier = Modifier.testTag("apply_promo_button")
                ) {
                    Text("Apply", color = DarkBackground, fontWeight = FontWeight.Bold)
                }
            }

            if (promoMessage != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = promoMessage!!,
                    color = if (appliedPromo != null) EmeraldGlow else AmberAccent,
                    fontSize = 12.sp
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Step 4: Payment Method
            Text(
                text = "4. Select Payment Method",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(8.dp))

            paymentMethods.forEach { method ->
                val isSelected = method == selectedPaymentMethod
                Surface(
                    color = if (isSelected) CyanSecondary.copy(alpha = 0.12f) else DarkBackground,
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, if (isSelected) CyanSecondary else DarkBorder),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { selectedPaymentMethod = method }
                        .padding(vertical = 3.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)
                    ) {
                        RadioButton(
                            selected = isSelected,
                            onClick = { selectedPaymentMethod = method },
                            colors = RadioButtonDefaults.colors(selectedColor = CyanSecondary)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = method,
                            color = if (isSelected) Color.White else TextSecondary,
                            fontSize = 13.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Deposit Summary Card
            Surface(
                color = DarkBackground,
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Bay Reservation Hold Deposit", color = TextSecondary, fontSize = 13.sp)
                        Text("₹${baseDeposit.toInt()}", color = Color.White, fontSize = 13.sp)
                    }
                    if (discountAmount > 0.0) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Discount ($appliedPromo)", color = EmeraldGlow, fontSize = 13.sp)
                            Text("- ₹${discountAmount.toInt()}", color = EmeraldGlow, fontSize = 13.sp)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    HorizontalDivider(color = DarkBorder)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Total Amount Payable Now", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("₹${finalDeposit.toInt()}", color = EmeraldPrimary, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "100% refundable upon plug-in or timely cancellation before arrival.",
                        color = TextMuted,
                        fontSize = 11.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Confirm Button
            Button(
                onClick = {
                    onConfirmBooking(
                        selectedConnector,
                        selectedSlot,
                        finalDeposit,
                        appliedPromo,
                        discountAmount,
                        selectedPaymentMethod
                    )
                },
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .testTag("confirm_booking_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = "Lock",
                    tint = DarkBackground,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Pay ₹${finalDeposit.toInt()} & Guarantee Bay",
                    color = DarkBackground,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
            }
        }
    }
}
