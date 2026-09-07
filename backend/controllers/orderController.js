import mongoose from "mongoose";

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const roundMoney = (value) => {
  return Math.round((Number(value) || 0) * 100) / 100;
};

const generateOrderNumber = async () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const prefix = `ORD-${year}${month}${day}`;

  const latestOrder = await Order.findOne({
    orderNumber: {
      $regex: `^${prefix}-`,
    },
  })
    .sort({
      orderNumber: -1,
    })
    .select("orderNumber")
    .lean();

  let sequence = 1;

  if (latestOrder?.orderNumber) {
    const lastPart =
      latestOrder.orderNumber.split("-").pop();

    const lastSequence =
      parseInt(lastPart, 10);

    if (!Number.isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  return `${prefix}-${String(sequence).padStart(
    5,
    "0"
  )}`;
};

const formatOrder = (order) => {
  if (!order) {
    return null;
  }

  return {
    id: order._id,
    orderNumber: order.orderNumber,

    customer: order.customer || null,
    customerSnapshot:
      order.customerSnapshot,

    items: order.items,

    subtotal: order.subtotal,
    discountAmount:
      order.discountAmount,
    taxAmount: order.taxAmount,
    totalAmount: order.totalAmount,

    paymentStatus:
      order.paymentStatus,

    paymentMethod:
      order.paymentMethod,

    paymentId:
      order.paymentId || "",

    paymentOrderId:
      order.paymentOrderId || "",

    status: order.status,
    orderType: order.orderType,

    notes: order.notes,

    createdBy:
      order.createdBy || null,

    paidAt: order.paidAt,
    completedAt:
      order.completedAt,
    cancelledAt:
      order.cancelledAt,

    createdAt:
      order.createdAt,

    updatedAt:
      order.updatedAt,
  };
};

/*
 * ============================================================
 * CREATE ORDER
 * ============================================================
 *
 * POST /api/orders
 *
 * Admin + Staff
 *
 * This creates the order only.
 *
 * Inventory will be deducted after successful payment/
 * completion in the transaction layer.
 */
export const createOrder = async (req, res) => {
  try {
    const {
      customer,
      items,
      discountAmount = 0,
      notes = "",
      paymentMethod = "unpaid",
      orderType = "pos",
    } = req.body;

    /*
     * Validate items.
     */
    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one product is required",
      });
    }

    /*
     * Validate order type.
     */
    if (
      !["pos", "online"].includes(orderType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order type",
      });
    }

    /*
     * Validate payment method.
     */
    const allowedPaymentMethods = [
      "cash",
      "upi",
      "card",
      "razorpay",
      "other",
      "unpaid",
    ];

    if (
      !allowedPaymentMethods.includes(
        paymentMethod
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    /*
     * Resolve customer.
     */
    let customerDocument = null;

    if (customer) {
      if (!isValidObjectId(customer)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID",
        });
      }

      customerDocument =
        await Customer.findById(customer);

      if (!customerDocument) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      if (!customerDocument.isActive) {
        return res.status(400).json({
          success: false,
          message:
            "This customer account is inactive",
        });
      }
    }

    /*
     * Fetch all products in one query.
     */
    const productIds = items.map(
      (item) => item.product
    );

    for (const productId of productIds) {
      if (!isValidObjectId(productId)) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid product ID: ${productId}`,
        });
      }
    }

    const uniqueProductIds = [
      ...new Set(
        productIds.map((id) => id.toString())
      ),
    ];

    const products =
      await Product.find({
        _id: {
          $in: uniqueProductIds,
        },
        isActive: true,
      }).populate(
        "category",
        "name slug"
      );

    if (
      products.length !==
      uniqueProductIds.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "One or more selected products are unavailable",
      });
    }

    const productMap = new Map();

    products.forEach((product) => {
      productMap.set(
        product._id.toString(),
        product
      );
    });

    /*
     * Build order items using product snapshots.
     *
     * The current product name/price is copied into
     * the order so historical invoices remain correct
     * even if the product changes later.
     */
    const orderItems = [];

    let subtotal = 0;
    let itemTaxAmount = 0;

    for (const item of items) {
      const product =
        productMap.get(
          item.product.toString()
        );

      if (!product) {
        return res.status(400).json({
          success: false,
          message:
            "One or more products could not be found",
        });
      }

      if (!product.isAvailable) {
        return res.status(400).json({
          success: false,
          message:
            `${product.name} is currently unavailable`,
        });
      }

      const quantity =
        Number(item.quantity);

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid quantity for ${product.name}`,
        });
      }

      const unitPrice =
        roundMoney(product.price);

      const lineSubtotal =
        roundMoney(
          unitPrice * quantity
        );

      const taxRate =
        Number(product.taxRate) || 0;

      const lineTax =
        roundMoney(
          (lineSubtotal * taxRate) / 100
        );

      const lineTotal =
        roundMoney(
          lineSubtotal + lineTax
        );

      subtotal += lineSubtotal;
      itemTaxAmount += lineTax;

      orderItems.push({
        product: product._id,

        name: product.name,

        sku: product.sku,

        quantity,

        unitPrice,

        taxRate,

        taxAmount: lineTax,

        discountAmount: 0,

        subtotal: lineSubtotal,

        total: lineTotal,
      });
    }

    subtotal = roundMoney(subtotal);
    itemTaxAmount =
      roundMoney(itemTaxAmount);

    /*
     * Validate discount.
     */
    const discount =
      roundMoney(discountAmount);

    if (discount < 0) {
      return res.status(400).json({
        success: false,
        message:
          "Discount cannot be negative",
      });
    }

    if (discount > subtotal) {
      return res.status(400).json({
        success: false,
        message:
          "Discount cannot exceed subtotal",
      });
    }

    /*
     * Tax needs to be recalculated after discount.
     *
     * For now, discount is distributed proportionally
     * across taxable item totals.
     */
    let finalTax = itemTaxAmount;

    if (
      discount > 0 &&
      subtotal > 0
    ) {
      const taxableBase =
        subtotal - discount;

      finalTax =
        roundMoney(
          itemTaxAmount *
            (taxableBase / subtotal)
        );
    }

    const totalAmount =
      roundMoney(
        subtotal -
          discount +
          finalTax
      );

    /*
     * Generate unique order number.
     */
    const orderNumber =
      await generateOrderNumber();

    /*
     * Customer snapshot.
     */
    const customerSnapshot =
      customerDocument
        ? {
            name: customerDocument.name,
            phone: customerDocument.phone,
            email: customerDocument.email,
            address: customerDocument.address,
          }
        : {
            name: "Walk-in Customer",
            phone: "",
            email: "",
            address: "",
          };

    const order =
      await Order.create({
        orderNumber,

        customer:
          customerDocument?._id ||
          null,

        customerSnapshot,

        items: orderItems,

        subtotal,

        discountAmount: discount,

        taxAmount: finalTax,

        totalAmount,

        paymentStatus:
          paymentMethod === "unpaid"
            ? "pending"
            : "pending",

        paymentMethod,

        status: "pending",

        orderType,

        notes:
          typeof notes === "string"
            ? notes.trim()
            : "",

        createdBy:
          req.user._id,
      });

    const populatedOrder =
      await Order.findById(
        order._id
      )
        .populate(
          "customer",
          "name phone email customerType isActive"
        )
        .populate(
          "createdBy",
          "name email role"
        );

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order:
        formatOrder(populatedOrder),
    });
  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

    if (error.name === "ValidationError") {
      const messages =
        Object.values(
          error.errors
        ).map(
          (item) => item.message
        );

      return res.status(400).json({
        success: false,
        message:
          messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Unable to create order",
    });
  }
};

/*
 * ============================================================
 * GET ORDERS
 * ============================================================
 *
 * GET /api/orders
 */
export const getOrders = async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      paymentStatus = "",
      paymentMethod = "",
      customer = "",
      orderType = "",
      page = 1,
      limit = 20,
      sortOrder = "desc",
    } = req.query;

    const currentPage =
      Math.max(
        parseInt(page, 10) || 1,
        1
      );

    const requestedLimit =
      parseInt(limit, 10) || 20;

    const perPage =
      Math.min(
        Math.max(
          requestedLimit,
          1
        ),
        100
      );

    const filter = {};

    /*
     * Search order number.
     */
    if (search.trim()) {
      filter.orderNumber = {
        $regex:
          search.trim().replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          ),
        $options: "i",
      };
    }

    /*
     * Validate and apply filters.
     */
    if (status) {
      filter.status = status;
    }

    if (paymentStatus) {
      filter.paymentStatus =
        paymentStatus;
    }

    if (paymentMethod) {
      filter.paymentMethod =
        paymentMethod;
    }

    if (orderType) {
      filter.orderType =
        orderType;
    }

    if (customer) {
      if (!isValidObjectId(customer)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid customer ID",
        });
      }

      filter.customer =
        customer;
    }

    const sortDirection =
      sortOrder === "asc"
        ? 1
        : -1;

    const skip =
      (currentPage - 1) *
      perPage;

    const [
      orders,
      totalOrders,
    ] = await Promise.all([
      Order.find(filter)
        .populate(
          "customer",
          "name phone email customerType"
        )
        .populate(
          "createdBy",
          "name email role"
        )
        .sort({
          createdAt:
            sortDirection,
        })
        .skip(skip)
        .limit(perPage)
        .lean(),

      Order.countDocuments(
        filter
      ),
    ]);

    const totalPages =
      Math.ceil(
        totalOrders /
          perPage
      );

    res.status(200).json({
      success: true,

      orders:
        orders.map(
          formatOrder
        ),

      pagination: {
        currentPage,
        perPage,
        totalOrders,
        totalPages,

        hasNextPage:
          currentPage <
          totalPages,

        hasPreviousPage:
          currentPage > 1,
      },
    });
  } catch (error) {
    console.error(
      "Get orders error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to retrieve orders",
    });
  }
};

/*
 * ============================================================
 * GET ORDER BY ID
 * ============================================================
 *
 * GET /api/orders/:id
 */
export const getOrderById = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (
      !isValidObjectId(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order ID",
      });
    }

    const order =
      await Order.findById(id)
        .populate(
          "customer",
          "name phone email address customerType"
        )
        .populate(
          "createdBy",
          "name email role"
        )
        .populate(
          "items.product",
          "name sku price taxRate unit"
        );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order:
        formatOrder(order),
    });
  } catch (error) {
    console.error(
      "Get order error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to retrieve order",
    });
  }
};

/*
 * ============================================================
 * UPDATE ORDER STATUS
 * ============================================================
 *
 * PATCH /api/orders/:id/status
 *
 * Admin + Staff
 */
export const updateOrderStatus =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const { status } =
        req.body;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order ID",
        });
      }

      const allowedStatuses = [
        "draft",
        "pending",
        "confirmed",
        "processing",
        "completed",
        "cancelled",
        "refunded",
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order status",
        });
      }

      const order =
        await Order.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found",
        });
      }

      /*
       * Don't allow changing a refunded order
       * back into an active state.
       */
      if (
        order.status ===
          "refunded" &&
        status !== "refunded"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A refunded order cannot be reactivated",
        });
      }

      /*
       * Don't allow completed order to become
       * pending/processing.
       */
      if (
        order.status ===
          "completed" &&
        [
          "draft",
          "pending",
          "confirmed",
          "processing",
        ].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A completed order cannot be moved back to an earlier status",
        });
      }

      order.status =
        status;

      if (
        status ===
        "completed"
      ) {
        order.completedAt =
          new Date();
      }

      if (
        status ===
        "cancelled"
      ) {
        order.cancelledAt =
          new Date();
      }

      await order.save();

      res.status(200).json({
        success: true,
        message:
          "Order status updated successfully",
        order:
          formatOrder(order),
      });
    } catch (error) {
      console.error(
        "Update order status error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to update order status",
      });
    }
  };

/*
 * ============================================================
 * CANCEL ORDER
 * ============================================================
 *
 * PATCH /api/orders/:id/cancel
 *
 * Admin + Staff
 */
export const cancelOrder =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order ID",
        });
      }

      const order =
        await Order.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found",
        });
      }

      if (
        order.status ===
        "completed"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Completed orders cannot be cancelled",
        });
      }

      if (
        order.paymentStatus ===
        "paid"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A paid order must be refunded through the payment workflow",
        });
      }

      if (
        order.status ===
        "cancelled"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Order is already cancelled",
        });
      }

      order.status =
        "cancelled";

      order.cancelledAt =
        new Date();

      order.paymentStatus =
        "cancelled";

      await order.save();

      res.status(200).json({
        success: true,
        message:
          "Order cancelled successfully",
        order:
          formatOrder(order),
      });
    } catch (error) {
      console.error(
        "Cancel order error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to cancel order",
      });
    }
  };

/*
 * ============================================================
 * GET ORDER STATISTICS
 * ============================================================
 *
 * GET /api/orders/stats/summary
 *
 * Admin + Staff
 */
export const getOrderStats =
  async (req, res) => {
    try {
      const [
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        paidOrders,
      ] = await Promise.all([
        Order.countDocuments(),

        Order.countDocuments({
          status: {
            $in: [
              "pending",
              "confirmed",
              "processing",
            ],
          },
        }),

        Order.countDocuments({
          status:
            "completed",
        }),

        Order.countDocuments({
          status:
            "cancelled",
        }),

        Order.countDocuments({
          paymentStatus:
            "paid",
        }),
      ]);

      const revenueResult =
        await Order.aggregate([
          {
            $match: {
              paymentStatus:
                "paid",
            },
          },

          {
            $group: {
              _id: null,

              totalRevenue: {
                $sum:
                  "$totalAmount",
              },

              totalTax: {
                $sum:
                  "$taxAmount",
              },

              totalDiscount: {
                $sum:
                  "$discountAmount",
              },
            },
          },
        ]);

      const revenue =
        revenueResult[0] || {
          totalRevenue: 0,
          totalTax: 0,
          totalDiscount: 0,
        };

      res.status(200).json({
        success: true,

        stats: {
          totalOrders,

          pendingOrders,

          completedOrders,

          cancelledOrders,

          paidOrders,

          totalRevenue:
            roundMoney(
              revenue.totalRevenue
            ),

          totalTax:
            roundMoney(
              revenue.totalTax
            ),

          totalDiscount:
            roundMoney(
              revenue.totalDiscount
            ),
        },
      });
    } catch (error) {
      console.error(
        "Get order stats error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to retrieve order statistics",
      });
    }
  };