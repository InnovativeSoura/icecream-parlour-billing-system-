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
 *
 * Customer can be linked through:
 *
 * 1. user -> req.user._id
 * 2. email -> req.user.email
 */

const resolveAuthenticatedCustomer = async (user) => {
  if (!user?._id) {
    return null;
  }

  let customer = null;

  /*
   * First try User -> Customer relationship.
   */
  try {
    customer = await Customer.findOne({
      user: user._id,
    });
  } catch (error) {
    /*
     * If the schema does not contain a user field,
     * continue with email lookup.
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

    paymentSignature:
      order.paymentSignature || "",

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
 * BUILD ORDER ITEMS
 * ============================================================
 *
 * IMPORTANT:
 *
 * Prices, tax rates and totals are ALWAYS calculated from
 * MongoDB Product documents.
 *
 * The frontend must never be trusted for:
 *
 * - price
 * - subtotal
 * - tax
 * - total
 */

const buildOrderItems = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      error: "At least one product is required",
    };
  }

  /*
   * Limit the number of different products in one order.
   */
  if (items.length > 50) {
    return {
      error: "An order cannot contain more than 50 items",
    };
  }

  const productIds = items.map(
    (item) => item?.product
  );

  /*
   * Validate product IDs.
   */
  for (const productId of productIds) {
    if (!isValidObjectId(productId)) {
      return {
        error: `Invalid product ID: ${productId}`,
      };
    }
  }

  /*
   * Remove duplicate product IDs for database query.
   */
  const uniqueProductIds = [
    ...new Set(
      productIds.map(
        (id) => id.toString()
      )
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
    return {
      error:
        "One or more selected products are unavailable",
    };
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

  const orderItems = [];

  let subtotal = 0;

  let itemTaxAmount = 0;

  /*
   * Build every order item using server-side product data.
   */
  for (const item of items) {
    const product =
      productMap.get(
        item.product.toString()
      );

    if (!product) {
      return {
        error:
          "One or more products could not be found",
      };
    }

    if (!product.isAvailable) {
      return {
        error:
          `${product.name} is currently unavailable`,
      };
    }

    const quantity =
      Number(item.quantity);

    /*
     * Quantity must be a positive integer.
     */
    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return {
        error:
          `Invalid quantity for ${product.name}`,
      };
    }

    /*
     * Prevent unreasonable quantities.
     */
    if (quantity > 100) {
      return {
        error:
          `Maximum quantity for ${product.name} is 100`,
      };
    }

    const unitPrice =
      roundMoney(product.price);

    if (unitPrice < 0) {
      return {
        error:
          `Invalid price configured for ${product.name}`,
      };
    }

    const lineSubtotal =
      roundMoney(
        unitPrice * quantity
      );

    const taxRate =
      Number(product.taxRate) || 0;

    if (
      taxRate < 0 ||
      taxRate > 100
    ) {
      return {
        error:
          `Invalid tax rate configured for ${product.name}`,
      };
    }

    const lineTax =
      roundMoney(
        (lineSubtotal * taxRate) /
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
    roundMoney(subtotal);

  itemTaxAmount =
    roundMoney(itemTaxAmount);

  return {
    orderItems,
    subtotal,
    itemTaxAmount,
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
 * CREATE CUSTOMER ONLINE ORDER
 * ============================================================
 *
 * POST /api/orders/customer
 *
 * Customer only.
 *
 * This endpoint is intentionally separate from:
 *
 * POST /api/orders
 *
 * The customer ID is NEVER accepted from the frontend.
 *
 * The customer is resolved from req.user.
 */

export const createCustomerOrder =
  async (
    req,
    res
  ) => {
    try {
      /*
       * ========================================================
       * CUSTOMER PROFILE
       * ========================================================
       */

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

      if (
        customerDocument.isActive ===
        false
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Your customer account is inactive",
        });
      }

      /*
       * ========================================================
       * REQUEST DATA
       * ========================================================
       *
       * Customer checkout only accepts:
       *
       * items
       * notes
       *
       * Price/tax/total/customer are NOT trusted.
       */

      const {
        items,
        notes = "",
      } = req.body;

      /*
       * ========================================================
       * BUILD ITEMS FROM DATABASE
       * ========================================================
       */

      const itemResult =
        await buildOrderItems(
          items
        );

      if (itemResult.error) {
        return res.status(400).json({
          success: false,
          message:
            itemResult.error,
        });
      }

      const {
        orderItems,
        subtotal,
        itemTaxAmount,
      } = itemResult;

      /*
       * ========================================================
       * CUSTOMER ORDERS DO NOT ACCEPT FRONTEND DISCOUNTS
       * ========================================================
       *
       * Discounts should be controlled by the backend/admin
       * rather than trusted from the browser.
       */

      const discount = 0;

      const finalTax =
        roundMoney(
          itemTaxAmount
        );

      const totalAmount =
        roundMoney(
          subtotal -
            discount +
            finalTax
        );

      if (totalAmount <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "Order total must be greater than zero",
        });
      }

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

      const customerSnapshot = {
        name:
          customerDocument.name,

        phone:
          customerDocument.phone,

        email:
          customerDocument.email,

        address:
          customerDocument.address,
      };

      /*
       * ========================================================
       * CREATE ONLINE ORDER
       * ========================================================
       *
       * Payment starts as pending.
       *
       * Razorpay order/payment is created separately by
       * /api/payments/razorpay/create-order.
       */

      const order =
        await Order.create({
          orderNumber,

          customer:
            customerDocument._id,

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

          paymentMethod:
            "razorpay",

          status:
            "pending",

          orderType:
            "online",

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
          "Online order created successfully",

        order:
          formatOrder(
            populatedOrder
          ),
      });
    } catch (error) {
      console.error(
        "Create customer order error:",
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
          "Unable to create online order",
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
 *
 * NOTE:
 *
 * Customer checkout should preferably use:
 *
 * POST /api/orders/customer
 *
 * This function still supports customer requests for
 * backwards compatibility.
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
     */

    let customerDocument = null;

    if (
      req.user.role ===
      "customer"
    ) {
      if (
        orderType !==
        "online"
      ) {
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
        customerDocument.isActive ===
        false
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
          customerDocument.isActive ===
          false
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
      ![
        "pos",
        "online",
      ].includes(
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

    const itemResult =
      await buildOrderItems(
        items
      );

    if (itemResult.error) {
      return res.status(400).json({
        success: false,
        message:
          itemResult.error,
      });
    }

    const {
      orderItems,
      subtotal,
      itemTaxAmount,
    } = itemResult;

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

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    /*
     * ============================================================
     * CUSTOMER OWNERSHIP
     * ============================================================
     *
     * Resolve the authenticated customer through the same helper
     * used by customer order creation / retrieval.
     *
     * This supports accounts where the Customer document is linked
     * through the User ID as well as accounts that need email fallback.
     */
    if (req.user.role === "customer") {
      const customer = await resolveAuthenticatedCustomer(req.user);

      if (!customer) {
        return res.status(403).json({
          success: false,
          message: "Customer profile not found for this account",
        });
      }

      if (
        !order.customer ||
        order.customer.toString() !== customer._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to cancel this order",
        });
      }

      /*
       * Customers can cancel only orders that are still pending
       * or confirmed.
       */
      if (!["pending", "confirmed"].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: "This order can no longer be cancelled",
        });
      }
    }

    /*
     * Orders that are already completed, cancelled, or refunded
     * cannot be cancelled again.
     */
    if (
      ["completed", "cancelled", "refunded"].includes(order.status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Order is already ${order.status}`,
      });
    }

    /*
     * Never silently cancel an already-paid order.
     * A paid order must go through a refund workflow.
     */
    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message:
          "This order has already been paid. Please request a refund instead of cancelling it.",
      });
    }

    /*
     * Cancel the order.
     */
    order.status = "cancelled";
    order.paymentStatus = "cancelled";
    order.cancelledAt = new Date();

    /*
     * Preserve the existing payment method if one exists.
     * For an unpaid order with no method, explicitly mark it unpaid.
     */
    if (!order.paymentMethod) {
      order.paymentMethod = "unpaid";
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel order",
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