package com.aistudio.chargemate.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.aistudio.chargemate.model.Booking
import com.aistudio.chargemate.model.BookingStatus
import com.aistudio.chargemate.model.ConnectorType
import com.aistudio.chargemate.model.RefundStatus

@Entity(tableName = "bookings")
data class BookingEntity(
    @PrimaryKey val id: String,
    val stationId: String,
    val stationName: String,
    val stationAddress: String,
    val stationOperator: String,
    val connectorId: String,
    val connectorType: String,
    val powerKw: Double,
    val timeSlot: String,
    val date: String,
    val estCost: Double,
    val status: String,
    val createdAt: String,
    val expiryEpoch: Long,
    val pinCode: String,
    val paymentId: String?,
    val paymentMethod: String?,
    val razorpayOrderId: String?,
    val amountPaid: Double,
    val refundStatus: String,
    val refundAmount: Double,
    val penaltyAmount: Double,
    val refundId: String?,
    val refundReason: String?,
    val refundTimestamp: String?,
    val appliedOfferCode: String?,
    val discountAmount: Double
) {
    fun toDomain(): Booking {
        return Booking(
            id = id,
            stationId = stationId,
            stationName = stationName,
            stationAddress = stationAddress,
            stationOperator = stationOperator,
            connectorId = connectorId,
            connectorType = try { ConnectorType.valueOf(connectorType) } catch (_: Exception) { ConnectorType.CCS2 },
            powerKw = powerKw,
            timeSlot = timeSlot,
            date = date,
            estCost = estCost,
            status = try { BookingStatus.valueOf(status) } catch (_: Exception) { BookingStatus.CONFIRMED },
            createdAt = createdAt,
            expiryEpoch = expiryEpoch,
            pinCode = pinCode,
            paymentId = paymentId,
            paymentMethod = paymentMethod,
            razorpayOrderId = razorpayOrderId,
            amountPaid = amountPaid,
            refundStatus = try { RefundStatus.valueOf(refundStatus) } catch (_: Exception) { RefundStatus.NONE },
            refundAmount = refundAmount,
            penaltyAmount = penaltyAmount,
            refundId = refundId,
            refundReason = refundReason,
            refundTimestamp = refundTimestamp,
            appliedOfferCode = appliedOfferCode,
            discountAmount = discountAmount
        )
    }

    companion object {
        fun fromDomain(booking: Booking): BookingEntity {
            return BookingEntity(
                id = booking.id,
                stationId = booking.stationId,
                stationName = booking.stationName,
                stationAddress = booking.stationAddress,
                stationOperator = booking.stationOperator,
                connectorId = booking.connectorId,
                connectorType = booking.connectorType.name,
                powerKw = booking.powerKw,
                timeSlot = booking.timeSlot,
                date = booking.date,
                estCost = booking.estCost,
                status = booking.status.name,
                createdAt = booking.createdAt,
                expiryEpoch = booking.expiryEpoch,
                pinCode = booking.pinCode,
                paymentId = booking.paymentId,
                paymentMethod = booking.paymentMethod,
                razorpayOrderId = booking.razorpayOrderId,
                amountPaid = booking.amountPaid,
                refundStatus = booking.refundStatus.name,
                refundAmount = booking.refundAmount,
                penaltyAmount = booking.penaltyAmount,
                refundId = booking.refundId,
                refundReason = booking.refundReason,
                refundTimestamp = booking.refundTimestamp,
                appliedOfferCode = booking.appliedOfferCode,
                discountAmount = booking.discountAmount
            )
        }
    }
}

@Entity(tableName = "favorites")
data class FavoriteEntity(
    @PrimaryKey val stationId: String,
    val savedAtEpoch: Long = System.currentTimeMillis()
)
