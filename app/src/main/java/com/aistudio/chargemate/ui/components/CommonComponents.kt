package com.aistudio.chargemate.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.chargemate.model.Connector
import com.aistudio.chargemate.model.ConnectorStatus
import com.aistudio.chargemate.model.ConnectorType
import com.aistudio.chargemate.ui.theme.*

@Composable
fun OperatorBadge(operator: String, colorHex: String, modifier: Modifier = Modifier) {
    val opColor = try {
        Color(android.graphics.Color.parseColor(colorHex))
    } catch (_: Exception) {
        EmeraldPrimary
    }

    Surface(
        color = opColor.copy(alpha = 0.15f),
        shape = RoundedCornerShape(6.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, opColor.copy(alpha = 0.4f)),
        modifier = modifier
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(opColor)
            )
            Spacer(modifier = Modifier.width(5.dp))
            Text(
                text = operator,
                color = Color.White,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
fun StatusBadge(status: ConnectorStatus, modifier: Modifier = Modifier) {
    val (bg, fg, label) = when (status) {
        ConnectorStatus.AVAILABLE -> Triple(Color(0xFF064E3B), Color(0xFF34D399), "Available")
        ConnectorStatus.OCCUPIED -> Triple(Color(0xFF451A03), Color(0xFFFBBF24), "In Use")
        ConnectorStatus.RESERVED -> Triple(Color(0xFF1E1B4B), Color(0xFFA78BFA), "Reserved")
        ConnectorStatus.OUT_OF_SERVICE -> Triple(Color(0xFF4C0519), Color(0xFFF87171), "Offline")
    }

    Surface(
        color = bg,
        shape = RoundedCornerShape(6.dp),
        modifier = modifier
    ) {
        Text(
            text = label,
            color = fg,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
        )
    }
}

@Composable
fun RatingBadge(rating: Double, reviewCount: Int, modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .clip(RoundedCornerShape(6.dp))
            .background(Color(0xFF1E293B))
            .padding(horizontal = 6.dp, vertical = 3.dp)
    ) {
        Icon(
            imageVector = Icons.Default.Star,
            contentDescription = "Rating",
            tint = AmberAccent,
            modifier = Modifier.size(13.dp)
        )
        Spacer(modifier = Modifier.width(3.dp))
        Text(
            text = String.format("%.1f", rating),
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 12.sp
        )
        Text(
            text = " ($reviewCount)",
            color = TextMuted,
            fontSize = 11.sp
        )
    }
}

@Composable
fun AmenityChip(name: String, modifier: Modifier = Modifier) {
    val icon: ImageVector = when (name.lowercase()) {
        "cafe" -> Icons.Default.LocalCafe
        "restroom" -> Icons.Default.Wc
        "wifi" -> Icons.Default.Wifi
        "24/7" -> Icons.Default.AccessTime
        "security" -> Icons.Default.Security
        "shopping" -> Icons.Default.ShoppingBag
        "dining" -> Icons.Default.Restaurant
        else -> Icons.Default.CheckCircle
    }

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .clip(RoundedCornerShape(6.dp))
            .background(DarkSurfaceVariant)
            .padding(horizontal = 7.dp, vertical = 3.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = name,
            tint = TextSecondary,
            modifier = Modifier.size(12.dp)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = name,
            color = TextSecondary,
            fontSize = 11.sp
        )
    }
}

@Composable
fun ConnectorRowItem(
    connector: Connector,
    isSelected: Boolean = false,
    onClick: (() -> Unit)? = null
) {
    val borderColor = if (isSelected) EmeraldPrimary else DarkBorder
    val bgColor = if (isSelected) EmeraldPrimary.copy(alpha = 0.08f) else DarkSurface

    Surface(
        color = bgColor,
        shape = RoundedCornerShape(10.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, borderColor),
        modifier = Modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier)
            .testTag("connector_row_${connector.id}")
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (connector.type == ConnectorType.CCS2) Color(0xFF0F2E3A) else Color(0xFF2A1C3B)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.ElectricBolt,
                    contentDescription = connector.type.name,
                    tint = if (connector.type == ConnectorType.CCS2) CyanSecondary else PurpleTertiary,
                    modifier = Modifier.size(22.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = connector.type.label,
                        color = Color.White,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    StatusBadge(status = connector.status)
                }
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "${connector.powerKw.toInt()} kW High Speed • ₹${connector.pricePerKwh}/kWh",
                    color = TextSecondary,
                    fontSize = 12.sp
                )
            }

            if (isSelected) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = "Selected",
                    tint = EmeraldPrimary,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}
