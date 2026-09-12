package com.aistudio.chargemate.service

import com.aistudio.chargemate.model.*
import kotlin.math.max
import kotlin.math.roundToInt

data class CancellationRefundResult(
    val eligibleForFullRefund: Boolean,
    val penaltyFee: Double,
    val refundAmount: Double,
    val breakdownMessage: String,
    val policyRuleTitle: String,
    val estimatedArrivalSummary: String
)

object LoyaltyOffersService {
    val LOYALTY_OFFERS = listOf(
        LoyaltyOffer(
            id = "offer-club10",
            code = "CLUB10EV",
            title = "Club 10+ ₹150 Wallet Credit",
            description = "Unlocked for completing 10+ successful charges this month. Instant ₹150 off next reservation.",
            minMonthlyUses = 10,
            discountType = DiscountType.FLAT,
            discountValue = 150.0,
            badge = "Active Loyalty Member",
            partner = "ChargeMate Premium",
            terms = "Valid on all 60kW+ DC Fast Chargers. Applied directly at checkout."
        ),
        LoyaltyOffer(
            id = "offer-zerofees",
            code = "ZEROFEES",
            title = "100% Hold Deposit Waiver",
            description = "Trusted frequent commuter perk: waive the standard ₹100 refundable reservation hold deposit.",
            minMonthlyUses = 5,
            discountType = DiscountType.WAIVE_FEE,
            discountValue = 100.0,
            badge = "Verified Commuter",
            partner = "National EV Alliance",
            terms = "Applies 0 deposit requirement. Bay holding window remains 45 minutes."
        ),
        LoyaltyOffer(
            id = "offer-express20",
            code = "EXPRESS20",
            title = "20% Highway Cashback",
            description = "Get 20% discount up to ₹120 on intercity highway express corridors.",
            minMonthlyUses = 2,
            discountType = DiscountType.PERCENT,
            discountValue = 20.0,
            badge = "Highway Corridor",
            partner = "Expressways India",
            terms = "Applicable on toll road & highway bypass charging stations."
        ),
        LoyaltyOffer(
            id = "offer-noshowshield",
            code = "NOSHOWSHIELD",
            title = "No-Show Penalty Protection",
            description = "Shield against ₹50 idle bay blockage fee if traffic delays prevent you from reaching the bay.",
            minMonthlyUses = 8,
            discountType = DiscountType.WAIVE_FEE,
            discountValue = 50.0,
            badge = "Driver Protection",
            partner = "ChargeMate Care",
            terms = "Provides 1 free penalty cancellation per billing month."
        ),
        LoyaltyOffer(
            id = "offer-coffeepass",
            code = "COFFEEPASS",
            title = "Complimentary Highway Coffee",
            description = "Receive a complimentary barista coffee coupon at highway lounge charging hubs while your vehicle charges.",
            minMonthlyUses = 3,
            discountType = DiscountType.FLAT,
            discountValue = 75.0,
            badge = "Lifestyle Perk",
            partner = "Highway Rest Stop Cafes",
            terms = "Show active booking QR pass at participating station cafes."
        )
    )

    fun calculateCancellationRefund(booking: Booking): CancellationRefundResult {
        val now = System.currentTimeMillis()
        val isExpiredOrNoShow = now > booking.expiryEpoch
        val paidAmount = booking.amountPaid

        return if (isExpiredOrNoShow) {
            val penalty = minOf(50.0, paidAmount)
            val refund = max(0.0, paidAmount - penalty)
            CancellationRefundResult(
                eligibleForFullRefund = false,
                penaltyFee = penalty,
                refundAmount = refund,
                breakdownMessage = "₹${penalty.roundToInt()} idle bay holding penalty was deducted to compensate the charge point operator. Remaining ₹${refund.roundToInt()} is refunded instantly to your original payment method.",
                policyRuleTitle = "Late / No-Show Reservation Policy",
                estimatedArrivalSummary = "The 45-minute guaranteed slot expired before arrival."
            )
        } else {
            CancellationRefundResult(
                eligibleForFullRefund = true,
                penaltyFee = 0.0,
                refundAmount = paidAmount,
                breakdownMessage = "100% full refund of ₹${paidAmount.roundToInt()} processed instantly. Zero cancellation fees applied.",
                policyRuleTitle = "Timely Pre-Arrival Cancellation",
                estimatedArrivalSummary = "Cancelled within the active holding window."
            )
        }
    }

    fun applyOfferCode(code: String, baseDeposit: Double = 100.0, userMonthlyCharges: Int = 12): Pair<Boolean, Pair<Double, LoyaltyOffer?>> {
        val cleanCode = code.trim().uppercase()
        val offer = LOYALTY_OFFERS.find { it.code.uppercase() == cleanCode }

        if (offer == null) {
            return Pair(false, Pair(0.0, null))
        }

        if (userMonthlyCharges < offer.minMonthlyUses) {
            return Pair(false, Pair(0.0, null))
        }

        val discount = when (offer.discountType) {
            DiscountType.FLAT -> minOf(baseDeposit, offer.discountValue)
            DiscountType.PERCENT -> (baseDeposit * (offer.discountValue / 100.0))
            DiscountType.WAIVE_FEE -> baseDeposit
        }

        return Pair(true, Pair(discount, offer))
    }
}
