import mongoose from "mongoose";

import Customer from "../models/Customer.js";
import User from "../models/User.js";

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

/*
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/*
 * Sanitize customer response
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

    const currentPage = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const requestedLimit =
      parseInt(limit, 10) || 20;

    const perPage = Math.min(
      Math.max(requestedLimit, 1),
      100
    );

    const filter = {};

    /*
     * Search by name, phone, or email
     */
    if (search.trim()) {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const searchRegex = new RegExp(
        escapedSearch,
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
      ["registered", "walk-in"].includes(
        customerType
      )
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
     * Allowed sorting fields
     */
    const allowedSortFields = [
      "name",
      "createdAt",
      "updatedAt",
      "totalOrders",
      "totalSpent",
      "lastOrderAt",
    ];

    const safeSortBy =
      allowedSortFields.includes(sortBy)
        ? sortBy
        : "createdAt";

    const safeSortOrder =
      sortOrder === "asc" ? 1 : -1;

    const skip =
      (currentPage - 1) * perPage;

    const [
      customers,
      totalCustomers,
    ] = await Promise.all([
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

      customers: customers.map(
        formatCustomer
      ),

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
    console.error(
      "Get customers error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to retrieve customers",
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
export const getCustomerById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer =
      await Customer.findById(id).populate(
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
      customer:
        formatCustomer(customer),
    });
  } catch (error) {
    console.error(
      "Get customer error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to retrieve customer",
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
 * Supports:
 * - Walk-in customers
 * - Registered customer profiles
 */
export const createCustomer = async (
  req,
  res
) => {
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
     * Name is required.
     */
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Customer name is required",
      });
    }

    /*
     * Resolve linked User when provided.
     */
    let linkedUser = null;

    if (user) {
      if (!isValidObjectId(user)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      linkedUser =
        await User.findById(user);

      if (!linkedUser) {
        return res.status(404).json({
          success: false,
          message:
            "Linked user account not found",
        });
      }

      /*
       * Only customer-role users can be linked.
       */
      if (
        linkedUser.role !== "customer"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only users with the customer role can be linked to a customer profile",
        });
      }

      /*
       * A User may only have one Customer profile.
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
     * Registered vs walk-in.
     */
    const normalizedCustomerType =
      linkedUser || user
        ? "registered"
        : customerType === "registered"
        ? "registered"
        : "walk-in";

    /*
     * Normalize email.
     */
    const normalizedEmail =
      email?.trim().toLowerCase() ||
      linkedUser?.email?.toLowerCase() ||
      "";

    /*
     * Normalize phone.
     */
    const normalizedPhone =
      phone?.trim() ||
      linkedUser?.phone ||
      "";

    /*
     * Registered customers should have an email
     * when linked to a User.
     */
    if (
      normalizedCustomerType ===
        "registered" &&
      linkedUser &&
      !normalizedEmail
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Registered customer email is required",
      });
    }

    /*
     * Prevent duplicate email.
     */
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
     * Prevent duplicate phone.
     *
     * Empty phone is allowed for walk-ins.
     */
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

    /*
     * Create actual Customer profile.
     */
    const customer =
      await Customer.create({
        user:
          linkedUser?._id || null,

        name:
          name.trim() ||
          linkedUser?.name ||
          "Customer",

        phone: normalizedPhone,

        email: normalizedEmail,

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

    /*
     * Return populated customer.
     */
    const populatedCustomer =
      await Customer.findById(
        customer._id
      ).populate(
        "user",
        "name email phone role isActive lastLogin"
      );

    res.status(201).json({
      success: true,
      message:
        "Customer created successfully",

      customer:
        formatCustomer(
          populatedCustomer
        ),
    });
  } catch (error) {
    console.error(
      "Create customer error:",
      error
    );

    if (error.code === 11000) {
      const duplicateField =
        Object.keys(
          error.keyPattern || {}
        )[0];

      let message =
        "A customer with this information already exists";

      if (
        duplicateField === "user"
      ) {
        message =
          "This user already has a customer profile";
      }

      if (
        duplicateField === "email"
      ) {
        message =
          "A customer with this email already exists";
      }

      if (
        duplicateField === "phone"
      ) {
        message =
          "A customer with this phone number already exists";
      }

      return res.status(409).json({
        success: false,
        message,
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
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
        "Unable to create customer",
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
 */
export const updateCustomer = async (
  req,
  res
) => {
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
        message:
          "Customer not found",
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
        message:
          "Customer name cannot be empty",
      });
    }

    /*
     * Normalize values.
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
     * Duplicate email check.
     */
    if (
      normalizedEmail &&
      normalizedEmail !==
        customer.email
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
     * Duplicate phone check.
     */
    if (
      normalizedPhone &&
      normalizedPhone !==
        customer.phone
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
      customer.name =
        name.trim();
    }

    if (phone !== undefined) {
      customer.phone =
        normalizedPhone;
    }

    if (email !== undefined) {
      customer.email =
        normalizedEmail;
    }

    if (address !== undefined) {
      customer.address =
        address.trim();
    }

    if (notes !== undefined) {
      customer.notes =
        notes.trim();
    }

    if (
      typeof isActive ===
      "boolean"
    ) {
      customer.isActive =
        isActive;
    }

    await customer.save();

    const populatedCustomer =
      await Customer.findById(
        customer._id
      ).populate(
        "user",
        "name email phone role isActive lastLogin"
      );

    res.status(200).json({
      success: true,
      message:
        "Customer updated successfully",

      customer:
        formatCustomer(
          populatedCustomer
        ),
    });
  } catch (error) {
    console.error(
      "Update customer error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A customer with this information already exists",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
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
        "Unable to update customer",
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
 * Soft delete.
 */
export const deleteCustomer = async (
  req,
  res
) => {
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
        message:
          "Customer not found",
      });
    }

    customer.isActive = false;

    await customer.save();

    res.status(200).json({
      success: true,
      message:
        "Customer deactivated successfully",
    });
  } catch (error) {
    console.error(
      "Delete customer error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to deactivate customer",
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
 *
 * THIS EXPORT IS IMPORTANT.
 *
 * customerRoutes.js imports activateCustomer,
 * so this function must exist in this controller.
 */
export const activateCustomer = async (
  req,
  res
) => {
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
        message:
          "Customer not found",
      });
    }

    customer.isActive = true;

    await customer.save();

    const populatedCustomer =
      await Customer.findById(
        customer._id
      ).populate(
        "user",
        "name email phone role isActive lastLogin"
      );

    res.status(200).json({
      success: true,

      message:
        "Customer activated successfully",

      customer:
        formatCustomer(
          populatedCustomer
        ),
    });
  } catch (error) {
    console.error(
      "Activate customer error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to activate customer",
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
export const getCustomerStats = async (
  req,
  res
) => {
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
        customerType:
          "registered",
      }),

      Customer.countDocuments({
        customerType:
          "walk-in",
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
 */
export const getCustomerByPhone = async (
  req,
  res
) => {
  try {
    const { phone } =
      req.params;

    if (
      !phone ||
      !phone.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number is required",
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

      customer:
        formatCustomer(customer),
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