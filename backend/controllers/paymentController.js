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
 *
 * Prevents timing attacks by using
 * crypto.timingSafeEqual().
 */
const safeCompare = (received, expected) => {
  if (!received || !expected) {
    return false;
  }

  const receivedBuffer = Buffer.from(
    received,
    "utf8"
  );

  const expectedBuffer = Buffer.from(
    expected,
    "utf8"
  );

  if (
    receivedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  );
};

/**
 * Generate Razorpay Checkout payment signature.
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
 * Generate Razorpay webhook signature.
 *
 * IMPORTANT:
 * Webhook signature must be generated from
 * the original RAW request body.
 */
const generateWebhookSignature = (
  rawBody
) => {
  return crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_WEBHOOK_SECRET
    )
    .update(rawBody)
    .digest("hex");
};

/**
 * Validate MongoDB ObjectId-like values.
 */
const isValidObjectId = (value) => {
  return /^[a-f\d]{24}$/i.test(
    String(value || "")
  );
};

/**
 * Convert an amount to paise safely.
 */
const amountToPaise = (amount) => {
  const numericAmount = Number(amount);

  if (
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0
  ) {
    return null;
  }

  return Math.round(
    numericAmount * 100
  );
};

/*
|--------------------------------------------------------------------------
| CREATE RAZORPAY ORDER
|--------------------------------------------------------------------------
|
| POST /api/payments/razorpay/create-order
|
| Frontend sends:
|
| {
|   orderId
| }
|
| The backend reads the actual order amount
| from MongoDB.
|
|--------------------------------------------------------------------------
*/

export const createRazorpayOrder = async (
  req,
  res,
  next
) => {
  try {
    const razorpay =
      getRazorpayClient();

    const { orderId } =
      req.body || {};

    /*
    |--------------------------------------------------------------------------
    | Validate order ID
    |--------------------------------------------------------------------------
    */

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message:
          "Order ID is required",
      });
    }

    if (
      !isValidObjectId(orderId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order ID",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find order
    |--------------------------------------------------------------------------
    */

    const order =
      await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Customer ownership protection
    |--------------------------------------------------------------------------
    */

    if (
      req.user.role ===
        "customer" &&
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
            "You are not authorized to pay for this order",
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Payment state protection
    |--------------------------------------------------------------------------
    */

    if (
      order.paymentStatus ===
      "paid"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This order has already been paid",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent payment for cancelled/refunded orders
    |--------------------------------------------------------------------------
    */

    if (
      order.status ===
        "cancelled" ||
      order.status ===
        "refunded"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment cannot be created for this order",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate order items
    |--------------------------------------------------------------------------
    */

    if (
      !Array.isArray(
        order.items
      ) ||
      order.items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot create payment for an empty order",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Calculate amount from database
    |--------------------------------------------------------------------------
    */

    const amount =
      Number(
        order.totalAmount
      );

    const amountInPaise =
      amountToPaise(amount);

    if (
      !amountInPaise
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order amount",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Generate unique receipt
    |--------------------------------------------------------------------------
    */

    const receipt =
      `rcpt_${order.orderNumber}_${Date.now()}`;

    /*
    |--------------------------------------------------------------------------
    | Create Razorpay order
    |--------------------------------------------------------------------------
    */

    const razorpayOrder =
      await razorpay.orders.create({
        amount:
          amountInPaise,

        currency:
          "INR",

        receipt,

        notes: {
          internalOrderId:
            order._id.toString(),

          orderNumber:
            order.orderNumber,
        },
      });

    /*
    |--------------------------------------------------------------------------
    | Create local Payment record
    |--------------------------------------------------------------------------
    */

    const payment =
      await Payment.create({
        order:
          order._id,

        user:
          req.user._id,

        customer:
          order.customer ||
          null,

        gateway:
          "razorpay",

        amount,

        currency:
          "INR",

        status:
          "created",

        razorpayOrderId:
          razorpayOrder.id,

        receipt,

        metadata: {
          orderNumber:
            order.orderNumber,
        },
      });

    /*
    |--------------------------------------------------------------------------
    | Update internal order
    |--------------------------------------------------------------------------
    */

    order.paymentMethod =
      "razorpay";

    order.paymentStatus =
      "pending";

    order.paymentOrderId =
      razorpayOrder.id;

    await order.save();

    /*
    |--------------------------------------------------------------------------
    | Return ONLY public Razorpay information
    |--------------------------------------------------------------------------
    |
    | NEVER return:
    |
    | RAZORPAY_KEY_SECRET
    | RAZORPAY_WEBHOOK_SECRET
    |
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,

      message:
        "Razorpay order created successfully",

      data: {
        paymentId:
          payment._id,

        orderId:
          order._id,

        orderNumber:
          order.orderNumber,

        razorpayOrderId:
          razorpayOrder.id,

        keyId:
          process.env.RAZORPAY_KEY_ID,

        amount:
          amountInPaise,

        currency:
          "INR",

        customer: {
          name:
            order
              .customerSnapshot
              ?.name ||
            req.user.name ||
            "",

          email:
            order
              .customerSnapshot
              ?.email ||
            req.user.email ||
            "",

          phone:
            order
              .customerSnapshot
              ?.phone ||
            req.user.phone ||
            "",
        },
      },
    });
  } catch (error) {
    console.error(
      "Create Razorpay order error:",
      error
    );

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
| Frontend sends:
|
| {
|   orderId,
|   paymentId,
|   razorpay_order_id,
|   razorpay_payment_id,
|   razorpay_signature
| }
|
|--------------------------------------------------------------------------
*/

export const verifyRazorpayPayment = async (
  req,
  res,
  next
) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | IMPORTANT FIX
    |--------------------------------------------------------------------------
    |
    | The Razorpay client must be initialized here because
    | this function uses:
    |
    | razorpay.payments.fetch()
    |
    |--------------------------------------------------------------------------
    */

    const razorpay =
      getRazorpayClient();

    const {
      orderId,
      paymentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    /*
    |--------------------------------------------------------------------------
    | Validate required data
    |--------------------------------------------------------------------------
    */

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

    if (
      !isValidObjectId(
        orderId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order ID",
      });
    }

    if (
      !isValidObjectId(
        paymentId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment ID",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find local payment
    |--------------------------------------------------------------------------
    */

    const payment =
      await Payment.findById(
        paymentId
      );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Payment record not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Customer ownership protection
    |--------------------------------------------------------------------------
    */

    if (
      req.user.role ===
        "customer" &&
      payment.customer
    ) {
      const customer =
        await Customer.findById(
          payment.customer
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
            "You are not authorized to verify this payment",
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Verify payment belongs to order
    |--------------------------------------------------------------------------
    */

    if (
      !payment.order ||
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
    | Find order
    |--------------------------------------------------------------------------
    */

    const order =
      await Order.findById(
        orderId
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Customer ownership protection at order level
    |--------------------------------------------------------------------------
    */

    if (
      req.user.role ===
        "customer" &&
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
            "You are not authorized to verify this order",
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Check duplicate Razorpay payment ID
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
    | Generate expected Checkout signature
    |--------------------------------------------------------------------------
    */

    const expectedSignature =
      generatePaymentSignature(
        razorpay_order_id,
        razorpay_payment_id
      );

    /*
    |--------------------------------------------------------------------------
    | Constant-time signature comparison
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
            status:
              "failed",

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
    | Already paid
    |--------------------------------------------------------------------------
    */

    if (
      order.paymentStatus ===
      "paid"
    ) {
      return res.status(200).json({
        success: true,

        message:
          "Payment was already processed",

        data: {
          orderId:
            order._id,

          orderNumber:
            order.orderNumber,

          paymentStatus:
            "paid",
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Fetch payment directly from Razorpay
    |--------------------------------------------------------------------------
    |
    | This gives the backend another independent
    | verification layer.
    |
    |--------------------------------------------------------------------------
    */

    const razorpayPayment =
      await razorpay.payments.fetch(
        razorpay_payment_id
      );

    /*
    |--------------------------------------------------------------------------
    | Verify Razorpay order relationship
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
    | Verify currency
    |--------------------------------------------------------------------------
    */

    if (
      String(
        razorpayPayment.currency
      ).toUpperCase() !==
      "INR"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay payment currency mismatch",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Verify amount
    |--------------------------------------------------------------------------
    */

    const expectedAmount =
      amountToPaise(
        order.totalAmount
      );

    if (
      !expectedAmount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order amount",
      });
    }

    if (
      Number(
        razorpayPayment.amount
      ) !==
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
    | Payment status
    |--------------------------------------------------------------------------
    |
    | Only CAPTURED payments are considered successful.
    |
    | Do NOT settle an "authorized" payment as paid.
    |
    |--------------------------------------------------------------------------
    */

    const validStatus =
      razorpayPayment.status ===
      "captured";

    if (!validStatus) {
      await Payment.findByIdAndUpdate(
        payment._id,
        {
          $set: {
            status:
              "failed",

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
    | Settle paid order
    |--------------------------------------------------------------------------
    |
    | This service should handle:
    |
    | - Order payment status
    | - Payment status
    | - Inventory decrement
    | - Stock movement
    | - Customer statistics
    | | - Idempotency
    |
    |--------------------------------------------------------------------------
    */

    const result =
      await settlePaidOrder({
        orderId:
          order._id.toString(),

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

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      message:
        result.alreadySettled
          ? "Payment was already settled"
          : "Payment verified and order settled successfully",

      data: {
        order:
          result.order,

        payment:
          result.payment,
      },
    });
  } catch (error) {
    console.error(
      "Verify Razorpay payment error:",
      error
    );

    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| RECORD MANUAL PAYMENT
|--------------------------------------------------------------------------
|
| Used by Admin / Staff POS for:
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
    } = req.body || {};

    const allowedMethods = [
      "cash",
      "upi",
      "card",
      "other",
    ];

    /*
    |--------------------------------------------------------------------------
    | Validate order ID
    |--------------------------------------------------------------------------
    */

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message:
          "Order ID is required",
      });
    }

    if (
      !isValidObjectId(
        orderId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order ID",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate payment method
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Find order
    |--------------------------------------------------------------------------
    */

    const order =
      await Order.findById(
        orderId
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Already paid protection
    |--------------------------------------------------------------------------
    */

    if (
      order.paymentStatus ===
      "paid"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This order has already been paid",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Cancelled / refunded protection
    |--------------------------------------------------------------------------
    */

    if (
      order.status ===
        "cancelled" ||
      order.status ===
        "refunded"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment cannot be recorded for this order",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate amount
    |--------------------------------------------------------------------------
    */

    const amount =
      Number(
        order.totalAmount
      );

    if (
      !Number.isFinite(
        amount
      ) ||
      amount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order amount",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create Payment record
    |--------------------------------------------------------------------------
    */

    const payment =
      await Payment.create({
        order:
          order._id,

        user:
          req.user._id,

        customer:
          order.customer ||
          null,

        gateway:
          paymentMethod,

        amount,

        currency:
          "INR",

        status:
          "created",

        metadata: {
          reference:
            reference ||
            "",

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
          amountToPaise(
            amount
          ),

        gatewayCurrency:
          "INR",

        gatewayResponse: {
          method:
            paymentMethod,

          reference:
            reference ||
            null,
        },
      });

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,

      message:
        "Manual payment recorded successfully",

      data: {
        order:
          result.order,

        payment:
          result.payment,
      },
    });
  } catch (error) {
    console.error(
      "Record manual payment error:",
      error
    );

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
    const {
      orderId,
    } = req.params;

    /*
    |--------------------------------------------------------------------------
    | Validate ID
    |--------------------------------------------------------------------------
    */

    if (
      !isValidObjectId(
        orderId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order ID",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find order
    |--------------------------------------------------------------------------
    */

    const order =
      await Order.findById(
        orderId
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Customer ownership protection
    |--------------------------------------------------------------------------
    */

    if (
      req.user.role ===
        "customer" &&
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

    /*
    |--------------------------------------------------------------------------
    | Find payments
    |--------------------------------------------------------------------------
    */

    const payments =
      await Payment.find({
        order:
          orderId,
      })
        .populate(
          "user",
          "name email role"
        )
        .sort({
          createdAt: -1,
        });

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      count:
        payments.length,

      data:
        payments,
    });
  } catch (error) {
    console.error(
      "Get payment by order error:",
      error
    );

    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET PAYMENTS
|--------------------------------------------------------------------------
|
| Admin / Staff payment dashboard.
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

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    const currentPage =
      Math.max(
        Number(page) || 1,
        1
      );

    const perPage =
      Math.min(
        Math.max(
          Number(limit) ||
            20,
          1
        ),
        100
      );

    /*
    |--------------------------------------------------------------------------
    | Build filter
    |--------------------------------------------------------------------------
    */

    const filter = {};

    if (status) {
      filter.status =
        status;
    }

    if (gateway) {
      filter.gateway =
        gateway;
    }

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    if (
      typeof search ===
        "string" &&
      search.trim()
    ) {
      const searchValue =
        search.trim();

      filter.$or = [
        {
          razorpayOrderId: {
            $regex:
              searchValue,
            $options:
              "i",
          },
        },

        {
          razorpayPaymentId: {
            $regex:
              searchValue,
            $options:
              "i",
          },
        },

        {
          receipt: {
            $regex:
              searchValue,
            $options:
              "i",
          },
        },
      ];
    }

    /*
    |--------------------------------------------------------------------------
    | Pagination offset
    |--------------------------------------------------------------------------
    */

    const skip =
      (currentPage - 1) *
      perPage;

    /*
    |--------------------------------------------------------------------------
    | Fetch payments
    |--------------------------------------------------------------------------
    */

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

      Payment.countDocuments(
        filter
      ),
    ]);

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      data:
        payments,

      pagination: {
        page:
          currentPage,

        limit:
          perPage,

        total,

        pages:
          Math.ceil(
            total /
              perPage
          ),
      },
    });
  } catch (error) {
    console.error(
      "Get payments error:",
      error
    );

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
| Do NOT run express.json() before this route.
|
|--------------------------------------------------------------------------
*/

export const razorpayWebhook = async (
  req,
  res
) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Validate webhook secret
    |--------------------------------------------------------------------------
    */

    if (
      !process.env
        .RAZORPAY_WEBHOOK_SECRET
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

    /*
    |--------------------------------------------------------------------------
    | Get webhook signature
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Raw body validation
    |--------------------------------------------------------------------------
    */

    const rawBody =
      req.body;

    if (
      !Buffer.isBuffer(
        rawBody
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Webhook body must be received as raw data",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Generate expected webhook signature
    |--------------------------------------------------------------------------
    */

    const expectedSignature =
      generateWebhookSignature(
        rawBody
      );

    /*
    |--------------------------------------------------------------------------
    | Verify webhook signature
    |--------------------------------------------------------------------------
    */

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
    | Parse verified webhook body
    |--------------------------------------------------------------------------
    */

    let event;

    try {
      event =
        JSON.parse(
          rawBody.toString(
            "utf8"
          )
        );
    } catch (parseError) {
      console.error(
        "Razorpay webhook JSON parse error:",
        parseError
      );

      return res.status(400).json({
        success: false,
        message:
          "Invalid webhook payload",
      });
    }

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
        event.payload
          ?.payment
          ?.entity;

      if (!razorpayPayment) {
        return res.status(200).json({
          success: true,
          message:
            "Webhook received without payment entity",
        });
      }

      const razorpayOrderId =
        razorpayPayment.order_id;

      if (!razorpayOrderId) {
        return res.status(200).json({
          success: true,
          message:
            "Webhook payment has no order ID",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Find local payment
      |--------------------------------------------------------------------------
      */

      const payment =
        await Payment.findOne({
          razorpayOrderId,
        });

      if (!payment) {
        console.warn(
          `Payment record not found for Razorpay order ${razorpayOrderId}`
        );

        /*
        |----------------------------------------------------------------------
        | Acknowledge webhook.
        |----------------------------------------------------------------------
        */

        return res.status(200).json({
          success: true,
          message:
            "Payment record not found; webhook acknowledged",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Duplicate webhook protection
      |--------------------------------------------------------------------------
      */

      if (
        payment.status ===
        "paid"
      ) {
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
      | Verify amount against local order
      |--------------------------------------------------------------------------
      */

      const order =
        await Order.findById(
          payment.order
        );

      if (!order) {
        console.warn(
          `Order not found for payment ${payment._id}`
        );

        return res.status(200).json({
          success: true,
          message:
            "Order not found; webhook acknowledged",
        });
      }

      const expectedAmount =
        amountToPaise(
          order.totalAmount
        );

      if (
        !expectedAmount ||
        Number(
          razorpayPayment.amount
        ) !==
          expectedAmount
      ) {
        console.error(
          `Webhook amount mismatch for payment ${payment._id}`
        );

        await Payment.findByIdAndUpdate(
          payment._id,
          {
            $set: {
              status:
                "failed",

              failureReason:
                "Webhook payment amount mismatch",

              gatewayAmount:
                razorpayPayment.amount,

              gatewayCurrency:
                razorpayPayment.currency,

              gatewayResponse:
                razorpayPayment,

              webhookReceivedAt:
                new Date(),
            },
          }
        );

        return res.status(200).json({
          success: true,
          message:
            "Webhook acknowledged despite amount mismatch",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Verify currency
      |--------------------------------------------------------------------------
      */

      if (
        String(
          razorpayPayment.currency
        ).toUpperCase() !==
        "INR"
      ) {
        await Payment.findByIdAndUpdate(
          payment._id,
          {
            $set: {
              status:
                "failed",

              failureReason:
                "Webhook currency mismatch",

              gatewayAmount:
                razorpayPayment.amount,

              gatewayCurrency:
                razorpayPayment.currency,

              gatewayResponse:
                razorpayPayment,

              webhookReceivedAt:
                new Date(),
            },
          }
        );

        return res.status(200).json({
          success: true,
          message:
            "Webhook acknowledged despite currency mismatch",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Verify payment status
      |--------------------------------------------------------------------------
      */

      if (
        razorpayPayment.status !==
        "captured"
      ) {
        return res.status(200).json({
          success: true,
          message:
            `Webhook acknowledged with payment status ${razorpayPayment.status}`,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Settle order
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

      /*
      |--------------------------------------------------------------------------
      | Mark webhook received
      |--------------------------------------------------------------------------
      */

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
        event.payload
          ?.payment
          ?.entity;

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
        /*
        |--------------------------------------------------------------------------
        | Do not overwrite an already paid payment
        |--------------------------------------------------------------------------
        */

        if (
          payment.status !==
          "paid"
        ) {
          await Payment.findByIdAndUpdate(
            payment._id,
            {
              $set: {
                status:
                  "failed",

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
                paymentStatus:
                  "failed",
              },
            }
          );
        } else {
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
    | Used mainly for reconciliation.
    |--------------------------------------------------------------------------
    */

    if (
      eventType ===
      "order.paid"
    ) {
      const razorpayOrder =
        event.payload
          ?.order
          ?.entity;

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
    | UNKNOWN / FUTURE EVENT
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
    | Razorpay can retry failed webhooks.
    |--------------------------------------------------------------------------
    */

    return res.status(500).json({
      success: false,

      message:
        "Webhook processing failed",
    });
  }
};