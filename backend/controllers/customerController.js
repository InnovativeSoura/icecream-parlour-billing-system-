import mongoose from "mongoose";

import Customer from "../models/Customer.js";
import User from "../models/User.js";

/*
 * Helper: validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/*
 * Helper: sanitize customer response
 */
const formatCustomer = (customer) => {
  if (!customer) {
    return null;
  }

  return {
    id: customer._id,
    user: customer.user || null,

    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,

    customerType: customer.customerType,

    totalOrders: customer.totalOrders,
    totalSpent: customer.totalSpent,
    lastOrderAt: customer.lastOrderAt,

    notes: customer.notes,

    isActive: customer.isActive,

    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
};

/*
 * ============================================================
 * GET ALL CUSTOMERS
 * ============================================================
 *
 * GET /api/customers
 *
 * Admin + Staff
 *
 * Query parameters:
 *
 * ?search=john
 * ?customerType=registered
 * ?isActive=true
 * ?page=1
 * ?limit=20
 * ?sortBy=createdAt
 * ?sortOrder=desc
 */
export const getCustomers = async (req, res) => {
  try {
    const {
      search = "",
      customerType = "",
      isActive = "",
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);

    const requestedLimit =
      parseInt(limit, 10) || 20;

    const perPage = Math.min(
      Math.max(requestedLimit, 1),
      100
    );

    const filter = {};

    /*
     * Search by:
     * - name
     * - phone
     * - email
     */
    if (search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      filter.$or = [
        {
          name: searchRegex,
        },
        {
          phone: searchRegex,
        },
        {
          email: searchRegex,
        },
      ];
    }

    /*
     * Customer type filter
     */
    if (
      customerType &&
      ["registered", "walk-in"].includes(customerType)
    ) {
      filter.customerType = customerType;
    }

    /*
     * Active/inactive filter
     */
    if (isActive !== "") {
      if (isActive === "true") {
        filter.isActive = true;
      }

      if (isActive === "false") {
        filter.isActive = false;
      }
    }

    /*
     * Allowed sorting fields.
     *
     * This prevents arbitrary MongoDB sort fields
     * from being supplied by the client.
     */
    const allowedSortFields = [
      "name",
      "createdAt",
      "updatedAt",
      "totalOrders",
      "totalSpent",
      "lastOrderAt",
    ];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const safeSortOrder =
      sortOrder === "asc" ? 1 : -1;

    const skip =
      (currentPage - 1) * perPage;

    const [customers, totalCustomers] =
      await Promise.all([
        Customer.find(filter)
          .populate(
            "user",
            "name email phone role isActive lastLogin"
          )
          .sort({
            [safeSortBy]: safeSortOrder,
          })
          .skip(skip)
          .limit(perPage)
          .lean(),

        Customer.countDocuments(filter),
      ]);

    const totalPages = Math.ceil(
      totalCustomers / perPage
    );

    res.status(200).json({
      success: true,

      customers: customers.map(formatCustomer),

      pagination: {
        currentPage,
        perPage,
        totalCustomers,
        totalPages,

        hasNextPage:
          currentPage < totalPages,

        hasPreviousPage:
          currentPage > 1,
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve customers",
    });
  }
};

/*
 * ============================================================
 * GET CUSTOMER BY ID
 * ============================================================
 *
 * GET /api/customers/:id
 *
 * Admin + Staff
 */
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findById(id).populate(
      "user",
      "name email phone role isActive lastLogin createdAt"
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      customer: formatCustomer(customer),
    });
  } catch (error) {
    console.error("Get customer error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve customer",
    });
  }
};

/*
 * ============================================================
 * CREATE CUSTOMER
 * ============================================================
 *
 * POST /api/customers
 *
 * Admin + Staff
 *
 * Used for:
 * - walk-in customers
 * - registered customer profile creation
 */
export const createCustomer = async (req, res) => {
  try {
    const {
      user,
      name,
      phone,
      email,
      address,
      customerType,
      notes,
      isActive,
    } = req.body;

    /*
     * Basic validation
     */
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    /*
     * Validate user if provided.
     */
    let linkedUser = null;

    if (user) {
      if (!isValidObjectId(user)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      linkedUser = await User.findById(user);

      if (!linkedUser) {
        return res.status(404).json({
          success: false,
          message: "Linked user account not found",
        });
      }

      /*
       * Customer accounts must be actual customers.
       */
      if (linkedUser.role !== "customer") {
        return res.status(400).json({
          success: false,
          message:
            "Only users with the customer role can be linked to a customer profile",
        });
      }

      /*
       * Check whether this User already has
       * a Customer profile.
       */
      const existingLinkedCustomer =
        await Customer.findOne({
          user: linkedUser._id,
        });

      if (existingLinkedCustomer) {
        return res.status(409).json({
          success: false,
          message:
            "This user already has a customer profile",
        });
      }
    }

    /*
     * Customer type.
     *
     * If a user is linked, the model automatically
     * treats it as registered.
     */
    const normalizedCustomerType =
      user
        ? "registered"
        : customerType === "registered"
        ? "registered"
        : "walk-in";

    /*
     * Registered customers should normally have
     * an email address.
     */
    if (
      normalizedCustomerType === "registered" &&
      !email &&
      linkedUser
    ) {
      // Use email from linked User.
      req.body.email = linkedUser.email;
    }

    /*
     * Check duplicate email only when supplied.
     */
    const normalizedEmail =
      email?.trim().toLowerCase() ||
      linkedUser?.email?.toLowerCase() ||
      "";

    if (normalizedEmail) {
      const existingEmailCustomer =
        await Customer.findOne({
          email: normalizedEmail,
        });

      if (existingEmailCustomer) {
        return res.status(409).json({
          success: false,
          message:
            "A customer with this email already exists",
        });
      }
    }

    /*
     * Phone duplicate check.
     *
     * We allow empty phone numbers because
     * walk-in customers may not provide one.
     */
    const normalizedPhone =
      phone?.trim() || "";

    if (normalizedPhone) {
      const existingPhoneCustomer =
        await Customer.findOne({
          phone: normalizedPhone,
        });

      if (existingPhoneCustomer) {
        return res.status(409).json({
          success: false,
          message:
            "A customer with this phone number already exists",
        });
      }
    }

    const customer = await Customer.create({
      user: linkedUser?._id || null,

      name:
        name.trim() ||
        linkedUser?.name ||
        "Customer",

      phone:
        normalizedPhone ||
        linkedUser?.phone ||
        "",

      email:
        normalizedEmail ||
        linkedUser?.email ||
        "",

      address:
        address?.trim() || "",

      customerType:
        normalizedCustomerType,

      notes:
        notes?.trim() || "",

      isActive:
        typeof isActive === "boolean"
          ? isActive
          : true,
    });

    const populatedCustomer =
      await Customer.findById(customer._id).populate(
        "user",
        "name email phone role isActive lastLogin"
      );

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer: formatCustomer(populatedCustomer),
    });
  } catch (error) {
    console.error("Create customer error:", error);

    /*
     * Handle MongoDB duplicate key errors.
     */
    if (error.code === 11000) {
      const duplicateField =
        Object.keys(error.keyPattern || {})[0];

      let message =
        "A customer with this information already exists";

      if (duplicateField === "user") {
        message =
          "This user already has a customer profile";
      }

      if (duplicateField === "email") {
        message =
          "A customer with this email already exists";
      }

      res.status(409).json({
        success: false,
        message,
      });

      return;
    }

    /*
     * Mongoose validation error.
     */
    if (error.name === "ValidationError") {
      const messages = Object.values(
        error.errors
      ).map((item) => item.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to create customer",
    });
  }
};

/*
 * ============================================================
 * UPDATE CUSTOMER
 * ============================================================
 *
 * PUT /api/customers/:id
 *
 * Admin + Staff
 *
 * Note:
 * Order statistics are intentionally NOT accepted
 * from this endpoint.
 *
 * totalOrders / totalSpent / lastOrderAt should later
 * be controlled by the Order/Payment system.
 */
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer =
      await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const {
      name,
      phone,
      email,
      address,
      notes,
      isActive,
    } = req.body;

    /*
     * Validate name.
     */
    if (
      name !== undefined &&
      (!name || !name.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer name cannot be empty",
      });
    }

    /*
     * Normalize incoming values.
     */
    const normalizedEmail =
      email !== undefined
        ? email.trim().toLowerCase()
        : customer.email;

    const normalizedPhone =
      phone !== undefined
        ? phone.trim()
        : customer.phone;

    /*
     * Prevent duplicate email.
     */
    if (
      normalizedEmail &&
      normalizedEmail !== customer.email
    ) {
      const existingEmailCustomer =
        await Customer.findOne({
          email: normalizedEmail,
          _id: {
            $ne: customer._id,
          },
        });

      if (existingEmailCustomer) {
        return res.status(409).json({
          success: false,
          message:
            "A customer with this email already exists",
        });
      }
    }

    /*
     * Prevent duplicate phone.
     */
    if (
      normalizedPhone &&
      normalizedPhone !== customer.phone
    ) {
      const existingPhoneCustomer =
        await Customer.findOne({
          phone: normalizedPhone,
          _id: {
            $ne: customer._id,
          },
        });

      if (existingPhoneCustomer) {
        return res.status(409).json({
          success: false,
          message:
            "A customer with this phone number already exists",
        });
      }
    }

    /*
     * Update editable fields.
     */
    if (name !== undefined) {
      customer.name = name.trim();
    }

    if (phone !== undefined) {
      customer.phone = normalizedPhone;
    }

    if (email !== undefined) {
      customer.email = normalizedEmail;
    }

    if (address !== undefined) {
      customer.address = address.trim();
    }

    if (notes !== undefined) {
      customer.notes = notes.trim();
    }

    if (typeof isActive === "boolean") {
      customer.isActive = isActive;
    }

    await customer.save();

    const populatedCustomer =
      await Customer.findById(customer._id).populate(
        "user",
        "name email phone role isActive lastLogin"
      );

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer: formatCustomer(populatedCustomer),
    });
  } catch (error) {
    console.error("Update customer error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A customer with this information already exists",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(
        error.errors
      ).map((item) => item.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to update customer",
    });
  }
};

/*
 * ============================================================
 * DEACTIVATE CUSTOMER
 * ============================================================
 *
 * DELETE /api/customers/:id
 *
 * Admin only
 *
 * We use soft deletion rather than physically deleting
 * the customer because customer records can be referenced
 * by historical orders/invoices.
 */
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer =
      await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    customer.isActive = false;

    await customer.save();

    res.status(200).json({
      success: true,
      message: "Customer deactivated successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to deactivate customer",
    });
  }
};

/*
 * ============================================================
 * ACTIVATE CUSTOMER
 * ============================================================
 *
 * PATCH /api/customers/:id/activate
 *
 * Admin only
 */
export const activateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer =
      await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    customer.isActive = true;

    await customer.save();

    res.status(200).json({
      success: true,
      message: "Customer activated successfully",
      customer: formatCustomer(customer),
    });
  } catch (error) {
    console.error("Activate customer error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to activate customer",
    });
  }
};

/*
 * ============================================================
 * GET CUSTOMER STATISTICS
 * ============================================================
 *
 * GET /api/customers/stats/summary
 *
 * Admin + Staff
 */
export const getCustomerStats = async (req, res) => {
  try {
    const [
      totalCustomers,
      activeCustomers,
      registeredCustomers,
      walkInCustomers,
    ] = await Promise.all([
      Customer.countDocuments(),

      Customer.countDocuments({
        isActive: true,
      }),

      Customer.countDocuments({
        customerType: "registered",
      }),

      Customer.countDocuments({
        customerType: "walk-in",
      }),
    ]);

    const spendingResult =
      await Customer.aggregate([
        {
          $group: {
            _id: null,

            totalSpent: {
              $sum: "$totalSpent",
            },

            totalOrders: {
              $sum: "$totalOrders",
            },
          },
        },
      ]);

    const totals =
      spendingResult[0] || {
        totalSpent: 0,
        totalOrders: 0,
      };

    res.status(200).json({
      success: true,

      stats: {
        totalCustomers,
        activeCustomers,
        registeredCustomers,
        walkInCustomers,

        totalOrders:
          totals.totalOrders || 0,

        totalSpent:
          totals.totalSpent || 0,
      },
    });
  } catch (error) {
    console.error(
      "Get customer stats error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to retrieve customer statistics",
    });
  }
};

/*
 * ============================================================
 * SEARCH CUSTOMER BY PHONE
 * ============================================================
 *
 * GET /api/customers/phone/:phone
 *
 * Admin + Staff
 *
 * Useful for POS:
 *
 * Cashier enters phone number
 * ↓
 * Existing customer found
 * ↓
 * Add customer to bill
 */
export const getCustomerByPhone = async (
  req,
  res
) => {
  try {
    const { phone } = req.params;

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const customer =
      await Customer.findOne({
        phone: phone.trim(),
        isActive: true,
      }).populate(
        "user",
        "name email phone role isActive"
      );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message:
          "No active customer found with this phone number",
      });
    }

    res.status(200).json({
      success: true,
      customer: formatCustomer(customer),
    });
  } catch (error) {
    console.error(
      "Get customer by phone error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to search customer by phone",
    });
  }
};