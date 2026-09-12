package com.aistudio.chargemate.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.RestartAlt
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.chargemate.model.ConnectorType
import com.aistudio.chargemate.model.FilterState
import com.aistudio.chargemate.service.MockAdapter
import com.aistudio.chargemate.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FilterSheet(
    filterState: FilterState,
    onDismiss: () -> Unit,
    onUpdateFilter: ((FilterState) -> FilterState) -> Unit,
    onResetFilter: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = DarkSurface,
        dragHandle = { BottomSheetDefaults.DragHandle(color = TextMuted) },
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
        modifier = Modifier.testTag("filter_sheet")
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
                Text(
                    text = "Filter Stations",
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    TextButton(onClick = onResetFilter) {
                        Icon(imageVector = Icons.Default.RestartAlt, contentDescription = "Reset", tint = CyanSecondary, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Reset", color = CyanSecondary, fontSize = 12.sp)
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = TextSecondary)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Only Available Toggle
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column {
                    Text("Show Available Sockets Only", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    Text("Hide stations with zero free connectors", color = TextSecondary, fontSize = 11.sp)
                }
                Switch(
                    checked = filterState.availableOnly,
                    onCheckedChange = { chk -> onUpdateFilter { it.copy(availableOnly = chk) } },
                    colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = EmeraldPrimary)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
            HorizontalDivider(color = DarkBorder)
            Spacer(modifier = Modifier.height(16.dp))

            // Min Power (kW)
            Text(
                text = "Minimum Power: ${filterState.minPowerKw.toInt()} kW",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
            Slider(
                value = filterState.minPowerKw.toFloat(),
                onValueChange = { p -> onUpdateFilter { it.copy(minPowerKw = p.toDouble()) } },
                valueRange = 0f..240f,
                steps = 7,
                colors = SliderDefaults.colors(thumbColor = EmeraldPrimary, activeTrackColor = EmeraldPrimary)
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Max Distance (km)
            Text(
                text = "Maximum Distance: ${filterState.maxDistanceKm.toInt()} km",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
            Slider(
                value = filterState.maxDistanceKm.toFloat(),
                onValueChange = { d -> onUpdateFilter { it.copy(maxDistanceKm = d.toDouble()) } },
                valueRange = 5f..60f,
                steps = 10,
                colors = SliderDefaults.colors(thumbColor = CyanSecondary, activeTrackColor = CyanSecondary)
            )

            Spacer(modifier = Modifier.height(16.dp))
            HorizontalDivider(color = DarkBorder)
            Spacer(modifier = Modifier.height(16.dp))

            // Connector Types
            Text(
                text = "Connector Standards",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(8.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ConnectorType.values().forEach { type ->
                    val isSelected = filterState.connectorTypes.contains(type)
                    FilterChip(
                        selected = isSelected,
                        onClick = {
                            val newSet = filterState.connectorTypes.toMutableSet()
                            if (isSelected) newSet.remove(type) else newSet.add(type)
                            onUpdateFilter { it.copy(connectorTypes = newSet) }
                        },
                        label = { Text(type.name, fontSize = 12.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = EmeraldPrimary.copy(alpha = 0.2f),
                            selectedLabelColor = EmeraldGlow
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Charge Point Operators
            Text(
                text = "Charge Point Operators (CPOs)",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(8.dp))

            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                MockAdapter.OPERATOR_PROFILES.forEach { op ->
                    val isSelected = filterState.operators.contains(op.name)
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                val newSet = filterState.operators.toMutableSet()
                                if (isSelected) newSet.remove(op.name) else newSet.add(op.name)
                                onUpdateFilter { it.copy(operators = newSet) }
                            }
                            .padding(vertical = 4.dp)
                    ) {
                        Checkbox(
                            checked = isSelected,
                            onCheckedChange = {
                                val newSet = filterState.operators.toMutableSet()
                                if (isSelected) newSet.remove(op.name) else newSet.add(op.name)
                                onUpdateFilter { it.copy(operators = newSet) }
                            },
                            colors = CheckboxDefaults.colors(checkedColor = EmeraldPrimary)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = op.name, color = Color.White, fontSize = 13.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            Button(
                onClick = onDismiss,
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Text("Apply Filters", color = DarkBackground, fontWeight = FontWeight.Bold)
            }
        }
    }
}
