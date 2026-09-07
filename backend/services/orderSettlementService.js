import mongoose from "mongoose";

import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Inventory from "../models/Inventory.js";
import StockMovement from "../models/StockMovement.js";
import Customer from "../models/Customer.js";

/*
|--------------------------------------------------------------------------
| Settle Paid Order
|--------------------------------------------------------------------------
|
| This function is called only after a payment has been verified.
|
| It performs these operations atomically:
|
| 1. Confirm the payment
| 2. Deduct inventory
| 3. Create stock movement records
| 4. Mark the order as paid
| 5. Update customer statistics
|
| MongoDB transaction guarantees that either ALL operations succeed
| or NONE of them are committed.
|
| This is especially important because both:
|
| Razorpay Checkout callback
|          +
| Razorpay Webhook
|
| can reach the backend for the same payment.
|
|--------------------------------------------------------------------------
*/

export const settlePaidOrder = async ({
  orderId,
  paymentId,
  razorpayPaymentId = null,
  razorpaySignature = null,
  gatewayAmount = null,
  gatewayCurrency = "INR",
  gatewayResponse = null,
}) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID");
  }

  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new Error("Invalid payment ID");
  }

  const session = await mongoose.startSession();

  try {
    let settlementResult = null;

    await session.withTransaction(async () => {
      /*
      |--------------------------------------------------------------------------
      | 1. Load payment
      |--------------------------------------------------------------------------
      */

      const payment = await Payment.findById(paymentId).session(
        session
      );

      if (!payment) {
        throw new Error("Payment record not found");
      }

      /*
      |--------------------------------------------------------------------------
      | 2. Load order
      |--------------------------------------------------------------------------
      */

      const order = await Order.findById(orderId).session(
        session
      );

      if (!order) {
        throw new Error("Order not found");
      }

      /*
      |--------------------------------------------------------------------------
      | 3. Ensure payment belongs to this order
      |--------------------------------------------------------------------------
      */

      if (payment.order.toString() !== order._id.toString()) {
        throw new Error(
          "Payment does not belong to this order"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | 4. Idempotency protection
      |--------------------------------------------------------------------------
      |
      | If the order has already been settled, do not deduct stock again
      | or increment customer statistics again.
      |
      */

      if (order.paymentStatus === "paid") {
        settlementResult = {
          alreadySettled: true,
          order,
          payment,
        };

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | 5. Validate payment amount
      |--------------------------------------------------------------------------
      |
      | Amount is calculated from the database order, never from the
      | frontend request.
      |
      */

      const expectedAmount = Number(order.totalAmount);
      const receivedAmount =
        gatewayAmount !== null
          ? Number(gatewayAmount) / 100
          : Number(payment.amount);

      const amountDifference = Math.abs(
        expectedAmount - receivedAmount
      );

      if (amountDifference > 0.01) {
        throw new Error(
          `Payment amount mismatch. Expected ₹${expectedAmount.toFixed(
            2
          )}, received ₹${receivedAmount.toFixed(2)}`
        );
      }

      /*
      |--------------------------------------------------------------------------
      | 6. Prevent already-refunded/cancelled orders
      |--------------------------------------------------------------------------
      */

      if (
        order.status === "cancelled" ||
        order.status === "refunded"
      ) {
        throw new Error(
          `Cannot settle an order with status "${order.status}"`
        );
      }

      /*
      |--------------------------------------------------------------------------
      | 7. Deduct inventory
      |--------------------------------------------------------------------------
      |
      | Every item is checked atomically:
      |
      | currentStock >= requested quantity
      |
      | If even one product does not have enough stock, the complete
      | transaction is rolled back.
      |
      */

      for (const item of order.items) {
        const quantity = Number(item.quantity);

        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error(
            `Invalid quantity for product ${item.name}`
          );
        }

        const inventory =
          await Inventory.findOneAndUpdate(
            {
              product: item.product,
              currentStock: {
                $gte: quantity,
              },
            },
            {
              $inc: {
                currentStock: -quantity,
              },
              $set: {
                lastStockUpdateAt: new Date(),
              },
            },
            {
              new: true,
              session,
            }
          );

        if (!inventory) {
          throw new Error(
            `Insufficient stock for "${item.name}"`
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Stock Movement
        |--------------------------------------------------------------------------
        */

        const previousStock =
          inventory.currentStock + quantity;

        const newStock = inventory.currentStock;

        await StockMovement.create(
          [
            {
              product: item.product,
              inventory: inventory._id,
              type: "sale",
              quantity,
              previousStock,
              newStock,
              referenceType: "order",
              referenceId: order._id,
              reason: `Sale against order ${order.orderNumber}`,
              createdBy: order.createdBy || null,
            },
          ],
          {
            session,
          }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | 8. Update order atomically
      |--------------------------------------------------------------------------
      |
      | paymentStatus must still be unpaid/pending.
      |
      | This condition is an additional idempotency barrier.
      |
      */

      const updatedOrder =
        await Order.findOneAndUpdate(
          {
            _id: order._id,
            paymentStatus: {
              $ne: "paid",
            },
          },
          {
            $set: {
              paymentStatus: "paid",
              paymentMethod: payment.gateway,
              paymentId:
                razorpayPaymentId ||
                payment.razorpayPaymentId ||
                payment._id.toString(),
              paymentOrderId:
                payment.razorpayOrderId ||
                order.paymentOrderId ||
                null,
              paymentSignature:
                razorpaySignature ||
                payment.razorpaySignature ||
                null,
              status: "confirmed",
              paidAt: new Date(),
            },
          },
          {
            new: true,
            session,
          }
        );

      /*
      |--------------------------------------------------------------------------
      | 9. Handle concurrent settlement
      |--------------------------------------------------------------------------
      */

      if (!updatedOrder) {
        throw new Error(
          "Order was already settled by another payment process"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | 10. Update payment
      |--------------------------------------------------------------------------
      */

      const updatedPayment =
        await Payment.findOneAndUpdate(
          {
            _id: payment._id,
            status: {
              $ne: "paid",
            },
          },
          {
            $set: {
              status: "paid",

              razorpayPaymentId:
                razorpayPaymentId ||
                payment.razorpayPaymentId ||
                null,

              razorpaySignature:
                razorpaySignature ||
                payment.razorpaySignature ||
                null,

              gatewayAmount:
                gatewayAmount !== null
                  ? Number(gatewayAmount)
                  : payment.gatewayAmount,

              gatewayCurrency:
                gatewayCurrency ||
                payment.gatewayCurrency ||
                "INR",

              gatewayResponse:
                gatewayResponse ||
                payment.gatewayResponse ||
                null,

              paidAt: new Date(),
              verifiedAt: new Date(),
            },
          },
          {
            new: true,
            session,
          }
        );

      if (!updatedPayment) {
        throw new Error(
          "Payment was already processed by another request"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | 11. Update customer statistics
      |--------------------------------------------------------------------------
      */

      if (order.customer) {
        const updatedCustomer =
          await Customer.findOneAndUpdate(
            {
              _id: order.customer,
              isActive: true,
            },
            {
              $inc: {
                totalOrders: 1,
                totalSpent: Number(order.totalAmount),
              },
              $set: {
                lastOrderAt: new Date(),
              },
            },
            {
              new: true,
              session,
            }
          );

        if (!updatedCustomer) {
          throw new Error(
            "Customer associated with this order was not found"
          );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | 12. Return final settlement data
      |--------------------------------------------------------------------------
      */

      settlementResult = {
        alreadySettled: false,
        order: updatedOrder,
        payment: updatedPayment,
      };
    });

    return settlementResult;
  } finally {
    await session.endSession();
  }
};