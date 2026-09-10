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

/*
 * ============================================================
 * RESOLVE CUSTOMER FOR AUTHENTICATED USER
 * ============================================================
 *
 * Customer authentication uses the authenticated User account.
 * The Customer collection may be linked either through:
 *
 * 1. user -> req.user._id
 * 2. email -> req.user.email
 *
 * This helper supports both.
 */
const resolveAuthenticatedCustomer = async (user) => {
  if (!user?._id) {
    return null;
  }

  let customer = null;

  /*
   * First try a direct User -> Customer relationship.
   */
  try {
    customer = await Customer.findOne({
      user: user._id,
    });
  } catch (error) {
    /*
     * If the Customer schema does not contain a user field,
     * simply continue to the email lookup.
     */
  }

  /*
   * Fallback to authenticated user's email.
   */
  if (!customer && user.email) {
    customer = await Customer.findOne({
      email: user.email.toLowerCase().trim(),
    });
  }

  return customer;
};

/*
 * ============================================================
 * GENERATE ORDER NUMBER
 * ============================================================
 */

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

/*
 * ============================================================
 * FORMAT ORDER
 * ============================================================
 */

const formatOrder = (order) => {
  if (!order) {
    return null;
  }

  return {
    id: order._id,

    orderNumber:
      order.orderNumber,

    customer:
      order.customer || null,

    customerSnapshot:
      order.customerSnapshot,

    items:
      order.items,

    subtotal:
      order.subtotal,

    discountAmount:
      order.discountAmount,

    taxAmount:
      order.taxAmount,

    totalAmount:
      order.totalAmount,

    paymentStatus:
      order.paymentStatus,

    paymentMethod:
      order.paymentMethod,

    paymentId:
      order.paymentId || "",

    paymentOrderId:
      order.paymentOrderId || "",

    status:
      order.status,

    orderType:
      order.orderType,

    notes:
      order.notes,

    createdBy:
      order.createdBy || null,

    paidAt:
      order.paidAt,

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
 * GET MY ORDERS
 * ============================================================
 *
 * GET /api/orders/my-orders
 *
 * Customer only
 */

export const getMyOrders = async (
  req,
  res
) => {
  try {
    const customer =
      await resolveAuthenticatedCustomer(
        req.user
      );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message:
          "Customer profile not found",
      });
    }

    const orders =
      await Order.find({
        customer:
          customer._id,
      })
        .populate(
          "items.product",
          "name image sku"
        )
        .populate(
          "customer",
          "name phone email"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,

      count:
        orders.length,

      orders:
        orders.map(
          formatOrder
        ),
    });
  } catch (error) {
    console.error(
      "Get customer orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve your orders",
    });
  }
};

/*
 * ============================================================
 * CREATE ORDER
 * ============================================================
 *
 * POST /api/orders
 *
 * Admin / Staff:
 *   POS orders
 *
 * Customer:
 *   Online orders
 */

export const createOrder = async (
  req,
  res
) => {
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
     * ========================================================
     * BASIC ITEM VALIDATION
     * ========================================================
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
     * ========================================================
     * CUSTOMER ORDER RULES
     * ========================================================
     *
     * Customer accounts are restricted to online orders.
     *
     * They cannot:
     * - create POS orders
     * - choose another customer's ID
     * - create manual cash/card/UPI orders
     */

    let customerDocument = null;

    if (
      req.user.role === "customer"
    ) {
      if (orderType !== "online") {
        return res.status(400).json({
          success: false,
          message:
            "Customers can only create online orders",
        });
      }

      if (
        ![
          "razorpay",
          "unpaid",
        ].includes(
          paymentMethod
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Customers must use Razorpay for online orders",
        });
      }

      customerDocument =
        await resolveAuthenticatedCustomer(
          req.user
        );

      if (!customerDocument) {
        return res.status(404).json({
          success: false,
          message:
            "Customer profile not found",
        });
      }

      if (
        !customerDocument.isActive
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Your customer account is inactive",
        });
      }
    } else {
      /*
       * ======================================================
       * ADMIN / STAFF CUSTOMER RESOLUTION
       * ======================================================
       */

      if (customer) {
        if (
          !isValidObjectId(
            customer
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid customer ID",
          });
        }

        customerDocument =
          await Customer.findById(
            customer
          );

        if (!customerDocument) {
          return res.status(404).json({
            success: false,
            message:
              "Customer not found",
          });
        }

        if (
          !customerDocument.isActive
        ) {
          return res.status(400).json({
            success: false,
            message:
              "This customer account is inactive",
          });
        }
      }
    }

    /*
     * ========================================================
     * ORDER TYPE VALIDATION
     * ========================================================
     */

    if (
      !["pos", "online"].includes(
        orderType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order type",
      });
    }

    /*
     * ========================================================
     * PAYMENT METHOD VALIDATION
     * ========================================================
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
        message:
          "Invalid payment method",
      });
    }

    /*
     * ========================================================
     * FETCH PRODUCTS
     * ========================================================
     */

    const productIds =
      items.map(
        (item) =>
          item.product
      );

    for (
      const productId of productIds
    ) {
      if (
        !isValidObjectId(
          productId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid product ID: ${productId}`,
        });
      }
    }

    const uniqueProductIds = [
      ...new Set(
        productIds.map(
          (id) =>
            id.toString()
        )
      ),
    ];

    const products =
      await Product.find({
        _id: {
          $in:
            uniqueProductIds,
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

    const productMap =
      new Map();

    products.forEach(
      (product) => {
        productMap.set(
          product._id.toString(),
          product
        );
      }
    );

    /*
     * ========================================================
     * BUILD ORDER ITEMS
     * ========================================================
     */

    const orderItems = [];

    let subtotal = 0;

    let itemTaxAmount = 0;

    for (
      const item of items
    ) {
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

      if (
        !product.isAvailable
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${product.name} is currently unavailable`,
        });
      }

      const quantity =
        Number(
          item.quantity
        );

      if (
        !Number.isFinite(
          quantity
        ) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid quantity for ${product.name}`,
        });
      }

      const unitPrice =
        roundMoney(
          product.price
        );

      const lineSubtotal =
        roundMoney(
          unitPrice *
            quantity
        );

      const taxRate =
        Number(
          product.taxRate
        ) || 0;

      const lineTax =
        roundMoney(
          (lineSubtotal *
            taxRate) /
            100
        );

      const lineTotal =
        roundMoney(
          lineSubtotal +
            lineTax
        );

      subtotal +=
        lineSubtotal;

      itemTaxAmount +=
        lineTax;

      orderItems.push({
        product:
          product._id,

        name:
          product.name,

        sku:
          product.sku,

        quantity,

        unitPrice,

        taxRate,

        taxAmount:
          lineTax,

        discountAmount:
          0,

        subtotal:
          lineSubtotal,

        total:
          lineTotal,
      });
    }

    subtotal =
      roundMoney(
        subtotal
      );

    itemTaxAmount =
      roundMoney(
        itemTaxAmount
      );

    /*
     * ========================================================
     * DISCOUNT
     * ========================================================
     */

    const discount =
      roundMoney(
        discountAmount
      );

    if (
      discount < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Discount cannot be negative",
      });
    }

    if (
      discount > subtotal
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Discount cannot exceed subtotal",
      });
    }

    /*
     * ========================================================
     * FINAL TAX
     * ========================================================
     */

    let finalTax =
      itemTaxAmount;

    if (
      discount > 0 &&
      subtotal > 0
    ) {
      const taxableBase =
        subtotal -
        discount;

      finalTax =
        roundMoney(
          itemTaxAmount *
            (taxableBase /
              subtotal)
        );
    }

    /*
     * ========================================================
     * FINAL TOTAL
     * ========================================================
     */

    const totalAmount =
      roundMoney(
        subtotal -
          discount +
          finalTax
      );

    /*
     * ========================================================
     * GENERATE ORDER NUMBER
     * ========================================================
     */

    const orderNumber =
      await generateOrderNumber();

    /*
     * ========================================================
     * CUSTOMER SNAPSHOT
     * ========================================================
     */

    const customerSnapshot =
      customerDocument
        ? {
            name:
              customerDocument.name,

            phone:
              customerDocument.phone,

            email:
              customerDocument.email,

            address:
              customerDocument.address,
          }
        : {
            name:
              "Walk-in Customer",

            phone:
              "",

            email:
              "",

            address:
              "",
          };

    /*
     * ========================================================
     * CREATE ORDER
     * ========================================================
     */

    const order =
      await Order.create({
        orderNumber,

        customer:
          customerDocument?._id ||
          null,

        customerSnapshot,

        items:
          orderItems,

        subtotal,

        discountAmount:
          discount,

        taxAmount:
          finalTax,

        totalAmount,

        paymentStatus:
          "pending",

        paymentMethod,

        status:
          "pending",

        orderType,

        notes:
          typeof notes ===
          "string"
            ? notes.trim()
            : "",

        createdBy:
          req.user._id,
      });

    /*
     * ========================================================
     * POPULATE ORDER
     * ========================================================
     */

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
        )
        .populate(
          "items.product",
          "name image sku price taxRate unit"
        );

    return res.status(201).json({
      success: true,

      message:
        "Order created successfully",

      order:
        formatOrder(
          populatedOrder
        ),
    });
  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      const messages =
        Object.values(
          error.errors
        ).map(
          (item) =>
            item.message
        );

      return res.status(400).json({
        success: false,
        message:
          messages.join(", "),
      });
    }

    return res.status(500).json({
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
 *
 * Admin / Staff:
 *   All orders
 *
 * Customer:
 *   Own orders only
 */

export const getOrders = async (
  req,
  res
) => {
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
        parseInt(
          page,
          10
        ) || 1,
        1
      );

    const requestedLimit =
      parseInt(
        limit,
        10
      ) || 20;

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
     * ========================================================
     * CUSTOMER SECURITY
     * ========================================================
     *
     * Never allow the customer to choose the customer ID
     * through a query parameter.
     */

    if (
      req.user.role ===
      "customer"
    ) {
      const customerDocument =
        await resolveAuthenticatedCustomer(
          req.user
        );

      if (!customerDocument) {
        return res.status(404).json({
          success: false,
          message:
            "Customer profile not found",
        });
      }

      filter.customer =
        customerDocument._id;
    } else if (customer) {
      if (
        !isValidObjectId(
          customer
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid customer ID",
        });
      }

      filter.customer =
        customer;
    }

    /*
     * ========================================================
     * SEARCH
     * ========================================================
     */

    if (
      search.trim()
    ) {
      filter.orderNumber = {
        $regex:
          search
            .trim()
            .replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            ),

        $options:
          "i",
      };
    }

    /*
     * ========================================================
     * FILTERS
     * ========================================================
     */

    if (status) {
      filter.status =
        status;
    }

    if (
      paymentStatus
    ) {
      filter.paymentStatus =
        paymentStatus;
    }

    if (
      paymentMethod
    ) {
      filter.paymentMethod =
        paymentMethod;
    }

    if (orderType) {
      filter.orderType =
        orderType;
    }

    /*
     * ========================================================
     * PAGINATION
     * ========================================================
     */

    const sortDirection =
      sortOrder ===
      "asc"
        ? 1
        : -1;

    const skip =
      (currentPage -
        1) *
      perPage;

    const [
      orders,
      totalOrders,
    ] =
      await Promise.all([
        Order.find(filter)
          .populate(
            "customer",
            "name phone email customerType"
          )
          .populate(
            "createdBy",
            "name email role"
          )
          .populate(
            "items.product",
            "name image sku"
          )
          .sort({
            createdAt:
              sortDirection,
          })
          .skip(skip)
          .limit(
            perPage
          )
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

    return res.status(200).json({
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
          currentPage >
          1,
      },
    });
  } catch (error) {
    console.error(
      "Get orders error:",
      error
    );

    return res.status(500).json({
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
 *
 * Admin / Staff:
 *   Any order
 *
 * Customer:
 *   Own order only
 */

export const getOrderById =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order ID",
        });
      }

      const order =
        await Order.findById(
          id
        )
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
            "name image sku price taxRate unit"
          );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found",
        });
      }

      /*
       * ======================================================
       * CUSTOMER OWNERSHIP CHECK
       * ======================================================
       */

      if (
        req.user.role ===
        "customer"
      ) {
        const customerDocument =
          await resolveAuthenticatedCustomer(
            req.user
          );

        if (
          !customerDocument
        ) {
          return res.status(404).json({
            success: false,
            message:
              "Customer profile not found",
          });
        }

        if (
          !order.customer ||
          order.customer._id.toString() !==
            customerDocument._id.toString()
        ) {
          return res.status(403).json({
            success: false,
            message:
              "You are not authorized to view this order",
          });
        }
      }

      return res.status(200).json({
        success: true,

        order:
          formatOrder(
            order
          ),
      });
    } catch (error) {
      console.error(
        "Get order error:",
        error
      );

      return res.status(500).json({
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
 * Admin + Staff only
 */

export const updateOrderStatus =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      const { status } =
        req.body;

      if (
        !isValidObjectId(
          id
        )
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
        await Order.findById(
          id
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found",
        });
      }

      if (
        order.status ===
          "refunded" &&
        status !==
          "refunded"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A refunded order cannot be reactivated",
        });
      }

      if (
        order.status ===
          "completed" &&
        [
          "draft",
          "pending",
          "confirmed",
          "processing",
        ].includes(
          status
        )
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

      return res.status(200).json({
        success: true,

        message:
          "Order status updated successfully",

        order:
          formatOrder(
            order
          ),
      });
    } catch (error) {
      console.error(
        "Update order status error:",
        error
      );

      return res.status(500).json({
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
 * Admin / Staff:
 *   Can cancel eligible orders
 *
 * Customer:
 *   Can cancel only their own eligible order
 */

export const cancelOrder =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order ID",
        });
      }

      const order =
        await Order.findById(
          id
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found",
        });
      }

      /*
       * ======================================================
       * CUSTOMER OWNERSHIP CHECK
       * ======================================================
       */

      if (
        req.user.role ===
        "customer"
      ) {
        const customerDocument =
          await resolveAuthenticatedCustomer(
            req.user
          );

        if (
          !customerDocument
        ) {
          return res.status(404).json({
            success: false,
            message:
              "Customer profile not found",
          });
        }

        if (
          !order.customer ||
          order.customer.toString() !==
            customerDocument._id.toString()
        ) {
          return res.status(403).json({
            success: false,
            message:
              "You are not authorized to cancel this order",
          });
        }

        /*
         * Customers should only be able to cancel
         * orders that have not entered processing.
         */
        if (
          ![
            "draft",
            "pending",
            "confirmed",
          ].includes(
            order.status
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "This order can no longer be cancelled",
          });
        }
      }

      /*
       * ======================================================
       * GENERAL CANCELLATION RULES
       * ======================================================
       */

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

      return res.status(200).json({
        success: true,

        message:
          "Order cancelled successfully",

        order:
          formatOrder(
            order
          ),
      });
    } catch (error) {
      console.error(
        "Cancel order error:",
        error
      );

      return res.status(500).json({
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
 * Admin + Staff only
 */

export const getOrderStats =
  async (
    req,
    res
  ) => {
    try {
      const [
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        paidOrders,
      ] =
        await Promise.all([
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
          totalRevenue:
            0,

          totalTax:
            0,

          totalDiscount:
            0,
        };

      return res.status(200).json({
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

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve order statistics",
      });
    }
  };