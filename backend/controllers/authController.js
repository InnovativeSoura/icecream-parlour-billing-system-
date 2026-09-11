import User from "../models/User.js";
import Customer from "../models/Customer.js";
import generateToken from "../utils/generateToken.js";

/*
|--------------------------------------------------------------------------
| Ensure Customer Profile
|--------------------------------------------------------------------------
| User = authentication / authorization
| Customer = actual business/customer profile
|
| This function makes sure every customer-role User has
| a corresponding Customer document.
|--------------------------------------------------------------------------
*/
const ensureCustomerProfile = async (user) => {
  if (!user || user.role !== "customer") {
    return null;
  }

  // 1. Try to find customer already linked to this User
  let customer = await Customer.findOne({
    user: user._id,
  });

  if (customer) {
    return customer;
  }

  // 2. Try to find an existing customer using the same email
  // This repairs old customer records created before User linking.
  if (user.email) {
    customer = await Customer.findOne({
      email: user.email.toLowerCase(),
    });

    if (customer) {
      customer.user = user._id;
      customer.customerType = "registered";
      customer.isActive = true;

      if (!customer.name) {
        customer.name = user.name;
      }

      if (!customer.phone && user.phone) {
        customer.phone = user.phone;
      }

      await customer.save();

      console.log(
        `Customer profile linked to User: ${user.email}`
      );

      return customer;
    }
  }

  // 3. No existing customer profile -> create one
  customer = await Customer.create({
    user: user._id,
    name: user.name,
    phone: user.phone || "",
    email: user.email.toLowerCase(),
    customerType: "registered",
    isActive: true,
  });

  console.log(
    `Customer profile created for User: ${user.email}`
  );

  return customer;
};


/*
|--------------------------------------------------------------------------
| Register User
|--------------------------------------------------------------------------
*/
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    /*
     * Public registration ALWAYS creates a customer User.
     * Admin/staff accounts should be created separately.
     */
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || "",
      password,
      role: "customer",
    });

    try {
      // Create the actual customer business profile
      await ensureCustomerProfile(user);
    } catch (customerError) {
      // If Customer creation fails, remove the User as well
      // so registration doesn't leave inconsistent data.
      await User.findByIdAndDelete(user._id);

      throw customerError;
    }

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });

  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create account",
    });
  }
};


/*
|--------------------------------------------------------------------------
| Login User
|--------------------------------------------------------------------------
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
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    /*
     * password is select:false in User.js,
     * therefore explicitly select it.
     */
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    /*
     * Compare the plain-text login password against
     * the bcrypt hash stored in MongoDB.
     */
    const isPasswordValid =
      await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    /*
     * Update login timestamp.
     */
    user.lastLogin = new Date();

    await user.save();

    /*
     * IMPORTANT:
     * After authentication succeeds, make sure the
     * corresponding Customer document exists.
     *
     * This also repairs older accounts such as Customer01
     * whose Customer document exists but wasn't linked
     * to the User document.
     */
    if (user.role === "customer") {
      await ensureCustomerProfile(user);
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
};


/*
|--------------------------------------------------------------------------
| Get Current User
|--------------------------------------------------------------------------
*/
export const getCurrentUser = async (req, res) => {
  try {

    /*
     * Repair/create Customer profile if necessary.
     * protect middleware has already authenticated req.user.
     */
    if (req.user.role === "customer") {
      await ensureCustomerProfile(req.user);
    }

    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        avatar: req.user.avatar,
        isActive: req.user.isActive,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt,
      },
    });

  } catch (error) {
    console.error("Current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve user",
    });
  }
};