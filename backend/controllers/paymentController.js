import crypto from "crypto";
import Razorpay from "razorpay";

import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Customer from "../models/Customer.js";

import { settlePaidOrder } from "../services/orderSettlementService.js";

/*
|--------------------------------------------------------------------------
| Razorpay Client
|--------------------------------------------------------------------------
*/

const getRazorpayClient = () => {
  ensureRazorpayConfig();

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely compare two signatures.
 */
const safeCompare = (received, expected) => {
  if (!received || !expected) {
    return false;
  }

  const receivedBuffer = Buffer.from(received, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  );
};

/**
 * Generate Razorpay payment signature.
 *
 * Razorpay signs:
 *
 * razorpay_order_id|razorpay_payment_id
 */
const generatePaymentSignature = (
  razorpayOrderId,
  razorpayPaymentId
) => {
  return crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET
    )
    .update(
      `${razorpayOrderId}|${razorpayPaymentId}`
    )
    .digest("hex");
};

/**
 * Generate webhook signature.
 *
 * Razorpay webhook verification uses the raw request body.
 */
const generateWebhookSignature = (rawBody) => {
  return crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_WEBHOOK_SECRET
    )
    .update(rawBody)
    .digest("hex");
};

/**
 * Ensure Razorpay environment variables exist.
 */
const ensureRazorpayConfig = () => {
  if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET
  ) {
    throw new Error(
      "Razorpay configuration is missing"
    );
  }
};

/*
|--------------------------------------------------------------------------
| CREATE RAZORPAY ORDER
|--------------------------------------------------------------------------
|
| POST /api/payments/razorpay/create-order
|
| The frontend sends only the internal order ID.
|
| The backend calculates the amount from MongoDB.
|
|--------------------------------------------------------------------------
*/

export const createRazorpayOrder = async (
  req,
  res,
  next
) => {
  try {
    const razorpay = getRazorpayClient();

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Ownership protection for customers
    |--------------------------------------------------------------------------
    */

    if (
      req.user.role === "customer" &&
      order.customer
    ) {
      const customer = await Customer.findById(
        order.customer
      );

      if (
        !customer ||
        !customer.user ||
        customer.user.toString() !==
          req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to pay for this order",
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Payment state protection
    |--------------------------------------------------------------------------
    */

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "This order has already been paid",
      });
    }

    if (
      order.status === "cancelled" ||
      order.status === "refunded"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment cannot be created for this order",
      });
    }

    if (!order.items || order.items.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot create payment for an empty order",
      });
    }

    const amount = Number(order.totalAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Amount in paise
    |--------------------------------------------------------------------------
    */

    const amountInPaise = Math.round(
      amount * 100
    );

    /*
    |--------------------------------------------------------------------------
    | Generate unique receipt
    |--------------------------------------------------------------------------
    */

    const receipt = `rcpt_${order.orderNumber}_${Date.now()}`;

    /*
    |--------------------------------------------------------------------------
    | Create Razorpay Order
    |--------------------------------------------------------------------------
    */

    const razorpayOrder =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt,
        notes: {
          internalOrderId: order._id.toString(),
          orderNumber: order.orderNumber,
        },
      });

    /*
    |--------------------------------------------------------------------------
    | Create local Payment record
    |--------------------------------------------------------------------------
    */

    const payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      customer: order.customer || null,

      gateway: "razorpay",

      amount,
      currency: "INR",

      status: "created",

      razorpayOrderId:
        razorpayOrder.id,

      receipt,

      metadata: {
        orderNumber: order.orderNumber,
      },
    });

    /*
    |--------------------------------------------------------------------------
    | Update Order
    |--------------------------------------------------------------------------
    */

    order.paymentMethod = "razorpay";
    order.paymentStatus = "pending";
    order.paymentOrderId =
      razorpayOrder.id;

    await order.save();

    /*
    |--------------------------------------------------------------------------
    | Return ONLY public Razorpay information
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,
      message:
        "Razorpay order created successfully",

      data: {
        paymentId: payment._id,

        orderId: order._id,
        orderNumber: order.orderNumber,

        razorpayOrderId:
          razorpayOrder.id,

        keyId:
          process.env.RAZORPAY_KEY_ID,

        amount: amountInPaise,

        currency: "INR",

        customer: {
          name:
            order.customerSnapshot?.name ||
            req.user.name ||
            "",

          email:
            order.customerSnapshot?.email ||
            req.user.email ||
            "",

          phone:
            order.customerSnapshot?.phone ||
            req.user.phone ||
            "",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| VERIFY RAZORPAY PAYMENT
|--------------------------------------------------------------------------
|
| POST /api/payments/razorpay/verify
|
| This endpoint NEVER trusts the frontend's "success" message.
|
| It independently verifies the Razorpay signature.
|
|--------------------------------------------------------------------------
*/

export const verifyRazorpayPayment = async (
  req,
  res,
  next
) => {
  try {
    ensureRazorpayConfig();

    const {
      orderId,
      paymentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !orderId ||
      !paymentId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Incomplete Razorpay payment verification data",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find local payment
    |--------------------------------------------------------------------------
    */

    const payment =
      await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Verify payment belongs to order
    |--------------------------------------------------------------------------
    */

    if (
      payment.order.toString() !==
      orderId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment does not belong to this order",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Verify Razorpay Order ID
    |--------------------------------------------------------------------------
    */

    if (
      payment.razorpayOrderId !==
      razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay order ID mismatch",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check duplicate payment ID
    |--------------------------------------------------------------------------
    */

    const existingPayment =
      await Payment.findOne({
        razorpayPaymentId:
          razorpay_payment_id,
      });

    if (
      existingPayment &&
      existingPayment._id.toString() !==
        payment._id.toString()
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This Razorpay payment has already been processed",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Generate expected signature
    |--------------------------------------------------------------------------
    */

    const expectedSignature =
      generatePaymentSignature(
        razorpay_order_id,
        razorpay_payment_id
      );

    /*
    |--------------------------------------------------------------------------
    | Constant-time comparison
    |--------------------------------------------------------------------------
    */

    const signatureValid =
      safeCompare(
        razorpay_signature,
        expectedSignature
      );

    if (!signatureValid) {
      await Payment.findByIdAndUpdate(
        payment._id,
        {
          $set: {
            status: "failed",
            failureReason:
              "Invalid Razorpay signature",
          },
        }
      );

      return res.status(400).json({
        success: false,
        message:
          "Invalid Razorpay payment signature",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check if already settled
    |--------------------------------------------------------------------------
    */

    const order =
      await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(200).json({
        success: true,
        message:
          "Payment was already processed",

        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          paymentStatus: "paid",
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Fetch Razorpay payment
    |--------------------------------------------------------------------------
    |
    | This gives the backend an additional verification layer.
    |
    */

    const razorpayPayment =
      await razorpay.payments.fetch(
        razorpay_payment_id
      );

    /*
    |--------------------------------------------------------------------------
    | Verify payment belongs to Razorpay order
    |--------------------------------------------------------------------------
    */

    if (
      razorpayPayment.order_id !==
      razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay payment/order mismatch",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Verify amount
    |--------------------------------------------------------------------------
    */

    const expectedAmount =
      Math.round(
        Number(order.totalAmount) * 100
      );

    if (
      Number(razorpayPayment.amount) !==
      expectedAmount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay payment amount mismatch",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Payment must actually be captured/authorized
    |--------------------------------------------------------------------------
    */

    const validStatuses = [
      "captured",
      "authorized",
    ];

    if (
      !validStatuses.includes(
        razorpayPayment.status
      )
    ) {
      await Payment.findByIdAndUpdate(
        payment._id,
        {
          $set: {
            status: "failed",
            razorpayPaymentId:
              razorpay_payment_id,
            razorpaySignature:
              razorpay_signature,
            failureReason:
              `Razorpay payment status: ${razorpayPayment.status}`,
          },
        }
      );

      return res.status(400).json({
        success: false,
        message:
          `Payment is not successful. Current status: ${razorpayPayment.status}`,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Settle Order
    |--------------------------------------------------------------------------
    */

    const result =
      await settlePaidOrder({
        orderId,

        paymentId:
          payment._id.toString(),

        razorpayPaymentId:
          razorpay_payment_id,

        razorpaySignature:
          razorpay_signature,

        gatewayAmount:
          razorpayPayment.amount,

        gatewayCurrency:
          razorpayPayment.currency,

        gatewayResponse:
          razorpayPayment,
      });

    return res.status(200).json({
      success: true,

      message: result.alreadySettled
        ? "Payment was already settled"
        : "Payment verified and order settled successfully",

      data: {
        order: result.order,
        payment: result.payment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| RECORD MANUAL PAYMENT
|--------------------------------------------------------------------------
|
| Used by Admin/Staff POS for:
|
| cash
| upi
| card
| other
|
|--------------------------------------------------------------------------
*/

export const recordManualPayment = async (
  req,
  res,
  next
) => {
  try {
    const {
      orderId,
      paymentMethod,
      reference,
    } = req.body;

    const allowedMethods = [
      "cash",
      "upi",
      "card",
      "other",
    ];

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    if (
      !allowedMethods.includes(
        paymentMethod
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid manual payment method",
      });
    }

    const order =
      await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message:
          "This order has already been paid",
      });
    }

    if (
      order.status === "cancelled" ||
      order.status === "refunded"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment cannot be recorded for this order",
      });
    }

    const payment =
      await Payment.create({
        order: order._id,

        user: req.user._id,

        customer:
          order.customer || null,

        gateway: paymentMethod,

        amount:
          Number(order.totalAmount),

        currency: "INR",

        status: "created",

        metadata: {
          reference:
            reference || "",
          recordedBy:
            req.user._id.toString(),
        },
      });

    /*
    |--------------------------------------------------------------------------
    | Settle order
    |--------------------------------------------------------------------------
    */

    const result =
      await settlePaidOrder({
        orderId:
          order._id.toString(),

        paymentId:
          payment._id.toString(),

        gatewayAmount:
          Math.round(
            Number(order.totalAmount) *
              100
          ),

        gatewayCurrency: "INR",

        gatewayResponse: {
          method: paymentMethod,
          reference:
            reference || null,
        },
      });

    return res.status(201).json({
      success: true,

      message:
        "Manual payment recorded successfully",

      data: {
        order: result.order,
        payment: result.payment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET PAYMENT BY ORDER
|--------------------------------------------------------------------------
|
| GET /api/payments/order/:orderId
|
|--------------------------------------------------------------------------
*/

export const getPaymentByOrder = async (
  req,
  res,
  next
) => {
  try {
    const { orderId } = req.params;

    const order =
      await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Customer ownership protection
    |--------------------------------------------------------------------------
    */

    if (
      req.user.role === "customer" &&
      order.customer
    ) {
      const customer =
        await Customer.findById(
          order.customer
        );

      if (
        !customer ||
        !customer.user ||
        customer.user.toString() !==
          req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to view these payments",
        });
      }
    }

    const payments =
      await Payment.find({
        order: orderId,
      })
        .populate(
          "user",
          "name email role"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,

      count: payments.length,

      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET PAYMENTS
|--------------------------------------------------------------------------
|
| Admin/Staff payment dashboard.
|
| GET /api/payments
|
|--------------------------------------------------------------------------
*/

export const getPayments = async (
  req,
  res,
  next
) => {
  try {
    const {
      status,
      gateway,
      page = 1,
      limit = 20,
      search = "",
    } = req.query;

    const currentPage =
      Math.max(
        Number(page) || 1,
        1
      );

    const perPage = Math.min(
      Math.max(
        Number(limit) || 20,
        1
      ),
      100
    );

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (gateway) {
      filter.gateway = gateway;
    }

    if (search.trim()) {
      filter.$or = [
        {
          razorpayOrderId: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          razorpayPaymentId: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          receipt: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    const skip =
      (currentPage - 1) * perPage;

    const [
      payments,
      total,
    ] = await Promise.all([
      Payment.find(filter)
        .populate(
          "order",
          "orderNumber totalAmount paymentStatus status"
        )
        .populate(
          "customer",
          "name phone email"
        )
        .populate(
          "user",
          "name email role"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(perPage),

      Payment.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,

      data: payments,

      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        pages:
          Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| RAZORPAY WEBHOOK
|--------------------------------------------------------------------------
|
| POST /api/payments/webhook
|
| IMPORTANT:
|
| This route MUST receive the RAW request body.
|
| Do not use JSON.parse() before signature verification.
|
|--------------------------------------------------------------------------
*/

export const razorpayWebhook = async (
  req,
  res
) => {
  try {
    if (
      !process.env.RAZORPAY_WEBHOOK_SECRET
    ) {
      console.error(
        "RAZORPAY_WEBHOOK_SECRET is not configured"
      );

      return res.status(500).json({
        success: false,
        message:
          "Webhook configuration is missing",
      });
    }

    const signature =
      req.headers[
        "x-razorpay-signature"
      ];

    if (!signature) {
      return res.status(400).json({
        success: false,
        message:
          "Missing Razorpay webhook signature",
      });
    }

    const rawBody = req.body;

    if (!Buffer.isBuffer(rawBody)) {
      return res.status(400).json({
        success: false,
        message:
          "Webhook body must be received as raw data",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Verify webhook signature
    |--------------------------------------------------------------------------
    */

    const expectedSignature =
      generateWebhookSignature(
        rawBody
      );

    if (
      !safeCompare(
        signature,
        expectedSignature
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Razorpay webhook signature",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Parse verified body
    |--------------------------------------------------------------------------
    */

    const event =
      JSON.parse(
        rawBody.toString("utf8")
      );

    const eventType =
      event.event;

    console.log(
      `Razorpay webhook received: ${eventType}`
    );

    /*
    |--------------------------------------------------------------------------
    | PAYMENT CAPTURED
    |--------------------------------------------------------------------------
    */

    if (
      eventType ===
      "payment.captured"
    ) {
      const razorpayPayment =
        event.payload?.payment?.entity;

      if (!razorpayPayment) {
        return res.status(200).json({
          success: true,
          message:
            "Webhook received without payment entity",
        });
      }

      const razorpayOrderId =
        razorpayPayment.order_id;

      const payment =
        await Payment.findOne({
          razorpayOrderId,
        });

      if (!payment) {
        console.warn(
          `Payment record not found for Razorpay order ${razorpayOrderId}`
        );

        return res.status(200).json({
          success: true,
          message:
            "Payment record not found; webhook acknowledged",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Duplicate webhook
      |--------------------------------------------------------------------------
      */

      if (payment.status === "paid") {
        await Payment.findByIdAndUpdate(
          payment._id,
          {
            $set: {
              webhookReceivedAt:
                new Date(),
            },
          }
        );

        return res.status(200).json({
          success: true,
          message:
            "Webhook already processed",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Signature from Checkout is not available here.
      |
      | Webhook itself is authenticated through webhook signature.
      |--------------------------------------------------------------------------
      */

      const result =
        await settlePaidOrder({
          orderId:
            payment.order.toString(),

          paymentId:
            payment._id.toString(),

          razorpayPaymentId:
            razorpayPayment.id,

          gatewayAmount:
            razorpayPayment.amount,

          gatewayCurrency:
            razorpayPayment.currency,

          gatewayResponse:
            razorpayPayment,
        });

      await Payment.findByIdAndUpdate(
        payment._id,
        {
          $set: {
            webhookReceivedAt:
              new Date(),
          },
        }
      );

      console.log(
        `Payment settled through webhook: ${payment._id}`
      );

      return res.status(200).json({
        success: true,

        message:
          result.alreadySettled
            ? "Payment already settled"
            : "Payment settled successfully",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | PAYMENT FAILED
    |--------------------------------------------------------------------------
    */

    if (
      eventType ===
      "payment.failed"
    ) {
      const razorpayPayment =
        event.payload?.payment?.entity;

      if (!razorpayPayment) {
        return res.status(200).json({
          success: true,
        });
      }

      const payment =
        await Payment.findOne({
          razorpayOrderId:
            razorpayPayment.order_id,
        });

      if (payment) {
        await Payment.findByIdAndUpdate(
          payment._id,
          {
            $set: {
              status: "failed",

              razorpayPaymentId:
                razorpayPayment.id ||
                null,

              gatewayAmount:
                razorpayPayment.amount ||
                null,

              gatewayCurrency:
                razorpayPayment.currency ||
                "INR",

              failureReason:
                razorpayPayment.error_description ||
                "Razorpay payment failed",

              failureCode:
                razorpayPayment.error_code ||
                "",

              gatewayResponse:
                razorpayPayment,

              webhookReceivedAt:
                new Date(),
            },
          }
        );

        await Order.findByIdAndUpdate(
          payment.order,
          {
            $set: {
              paymentStatus: "failed",
            },
          }
        );
      }

      return res.status(200).json({
        success: true,
        message:
          "Payment failure webhook processed",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | ORDER PAID
    |--------------------------------------------------------------------------
    |
    | Useful as a reconciliation event.
    |--------------------------------------------------------------------------
    */

    if (
      eventType ===
      "order.paid"
    ) {
      const razorpayOrder =
        event.payload?.order?.entity;

      if (!razorpayOrder) {
        return res.status(200).json({
          success: true,
        });
      }

      const payment =
        await Payment.findOne({
          razorpayOrderId:
            razorpayOrder.id,
        });

      if (payment) {
        await Payment.findByIdAndUpdate(
          payment._id,
          {
            $set: {
              webhookReceivedAt:
                new Date(),
            },
          }
        );
      }

      return res.status(200).json({
        success: true,
        message:
          "Order paid webhook acknowledged",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | REFUND EVENTS
    |--------------------------------------------------------------------------
    |
    | Full refund implementation will be connected when we build
    | the refund/invoice module.
    |--------------------------------------------------------------------------
    */

    if (
      eventType ===
        "refund.created" ||
      eventType ===
        "refund.processed"
    ) {
      console.log(
        `Razorpay refund event received: ${eventType}`
      );

      return res.status(200).json({
        success: true,
        message:
          "Refund webhook acknowledged",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Unknown / future event
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,
      message:
        "Webhook received and acknowledged",
    });
  } catch (error) {
    console.error(
      "Razorpay webhook processing error:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | Return non-2xx for processing errors.
    |
    | Razorpay can retry the webhook.
    |--------------------------------------------------------------------------
    */

    return res.status(500).json({
      success: false,
      message:
        "Webhook processing failed",
    });
  }
};