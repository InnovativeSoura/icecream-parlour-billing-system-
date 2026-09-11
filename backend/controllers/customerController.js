import User from "../models/User.js";
import Customer from "../models/Customer.js";

import generateToken from "../utils/generateToken.js";

/*
 * ============================================================
 * ENSURE CUSTOMER PROFILE
 * ============================================================
 *
 * Every authenticated customer must have a corresponding
 * Customer document in the customers collection.
 *
 * User:
 * - authentication
 * - password
 * - JWT identity
 * - role
 *
 * Customer:
 * - actual customer/business profile
 * - address
 * - customer statistics
 * - order relationship
 *
 * This helper also repairs older customer accounts that were
 * registered before Customer profiles were automatically created.
 */
const ensureCustomerProfile = async (user) => {
  if (!user || user.role !== "customer") {
    return null;
  }

  /*
   * First try the proper relationship.
   */
  let customer = await Customer.findOne({
    user: user._id,
  });

  if (customer) {
    return customer;
  }

  /*
   * If the relationship is missing, check whether a customer
   * profile already exists with the same email.
   *
   * This is important for existing accounts such as Customer01.
   */
  if (user.email) {
    customer = await Customer.findOne({
      email: user.email.toLowerCase(),
    });
  }

  if (customer) {
    /*
     * Existing customer profile found.
     *
     * Link it to the authenticated User account.
     */
    customer.user = user._id;
    customer.customerType = "registered";

    /*
     * Keep profile information synchronized when appropriate.
     */
    if (!customer.name && user.name) {
      customer.name = user.name;
    }

    if (!customer.phone && user.phone) {
      customer.phone = user.phone;
    }

    await customer.save();

    return customer;
  }

  /*
   * No customer profile exists at all.
   *
   * Create the actual customer profile in the customers
   * collection.
   */
  customer = await Customer.create({
    user: user._id,

    name: user.name,

    phone: user.phone || "",

    email: user.email,

    customerType: "registered",

    address: "",

    notes: "",

    isActive: true,
  });

  return customer;
};

/*
 * ============================================================
 * REGISTER USER
 * ============================================================
 *
 * POST /api/auth/register
 *
 * Public registration ALWAYS creates a customer account.
 *
 * Registration creates:
 *
 * 1. User authentication identity
 * 2. Customer business profile
 */
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
    } = req.body;

    /*
     * Basic validation.
     */
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    /*
     * Check existing User account.
     */
    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists",
      });
    }

    /*
     * Create authentication account.
     */
    const user = await User.create({
      name: name.trim(),

      email: normalizedEmail,

      phone: phone?.trim() || "",

      password,

      /*
       * Public registration ALWAYS creates customer.
       *
       * Admin/staff accounts are created separately.
       */
      role: "customer",
    });

    /*
     * Create the actual customer profile.
     *
     * The profile lives in the customers collection.
     */
    let customer;

    try {
      customer = await Customer.create({
        user: user._id,

        name: user.name,

        phone: user.phone || "",

        email: user.email,

        customerType: "registered",

        address: "",

        notes: "",

        isActive: true,
      });
    } catch (customerError) {
      /*
       * If Customer creation fails, remove the newly-created
       * User so registration does not leave an orphan account.
       */
      try {
        await User.findByIdAndDelete(user._id);
      } catch (rollbackError) {
        console.error(
          "Registration rollback error:",
          rollbackError
        );
      }

      throw customerError;
    }

    /*
     * Generate authentication token.
     */
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,

      message:
        "Account created successfully",

      token,

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        phone: user.phone,

        role: user.role,

        avatar: user.avatar,
      },

      /*
       * Customer ID is useful for the frontend if needed.
       */
      customer: {
        id: customer._id,

        name: customer.name,

        email: customer.email,

        phone: customer.phone,

        customerType:
          customer.customerType,
      },
    });
  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    /*
     * MongoDB duplicate key.
     */
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An account or customer with this information already exists",
      });
    }

    /*
     * Mongoose validation.
     */
    if (error.name === "ValidationError") {
      const messages =
        Object.values(error.errors).map(
          (item) => item.message
        );

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Unable to create account",
    });
  }
};

/*
 * ============================================================
 * LOGIN USER
 * ============================================================
 *
 * POST /api/auth/login
 */
export const loginUser = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    /*
     * Password is select:false, so explicitly request it.
     */
    const user =
      await User.findOne({
        email: normalizedEmail,
      }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated",
      });
    }

    const isPasswordValid =
      await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    /*
     * Update login timestamp.
     */
    user.lastLogin = new Date();

    await user.save();

    /*
     * IMPORTANT:
     *
     * For customer accounts, automatically make sure
     * the corresponding Customer profile exists.
     *
     * This repairs old accounts such as Customer01.
     */
    let customer = null;

    if (user.role === "customer") {
      customer =
        await ensureCustomerProfile(user);

      /*
       * A deactivated Customer profile should not be allowed
       * to use the customer portal even if the User account
       * itself is active.
       */
      if (
        customer &&
        !customer.isActive
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your customer account has been deactivated",
        });
      }
    }

    const token =
      generateToken(user._id);

    res.status(200).json({
      success: true,

      message:
        "Login successful",

      token,

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        phone: user.phone,

        role: user.role,

        avatar: user.avatar,

        lastLogin:
          user.lastLogin,
      },

      /*
       * Customer information is returned separately.
       */
      customer: customer
        ? {
            id: customer._id,

            name: customer.name,

            email: customer.email,

            phone: customer.phone,

            address: customer.address,

            customerType:
              customer.customerType,

            isActive:
              customer.isActive,
          }
        : null,
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to login",
    });
  }
};

/*
 * ============================================================
 * GET CURRENT USER
 * ============================================================
 *
 * GET /api/auth/me
 */
export const getCurrentUser = async (
  req,
  res
) => {
  try {
    let customer = null;

    /*
     * If the authenticated identity is a customer,
     * retrieve/repair the customer profile.
     */
    if (
      req.user &&
      req.user.role === "customer"
    ) {
      customer =
        await ensureCustomerProfile(
          req.user
        );
    }

    res.status(200).json({
      success: true,

      user: {
        id: req.user._id,

        name: req.user.name,

        email: req.user.email,

        phone: req.user.phone,

        role: req.user.role,

        avatar: req.user.avatar,

        isActive:
          req.user.isActive,

        lastLogin:
          req.user.lastLogin,

        createdAt:
          req.user.createdAt,
      },

      customer: customer
        ? {
            id: customer._id,

            name: customer.name,

            email: customer.email,

            phone: customer.phone,

            address: customer.address,

            customerType:
              customer.customerType,

            totalOrders:
              customer.totalOrders,

            totalSpent:
              customer.totalSpent,

            lastOrderAt:
              customer.lastOrderAt,

            isActive:
              customer.isActive,
          }
        : null,
    });
  } catch (error) {
    console.error(
      "Current user error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to retrieve user",
    });
  }
};