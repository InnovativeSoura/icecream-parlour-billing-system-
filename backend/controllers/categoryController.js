import Category from "../models/Category.js";

/*
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Admin / Staff
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({
        sortOrder: 1,
        name: 1,
      })
      .lean();

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve categories",
    });
  }
};

/*
 * @desc    Get active categories
 * @route   GET /api/categories/active
 * @access  Public
 */
export const getActiveCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
    })
      .sort({
        sortOrder: 1,
        name: 1,
      })
      .lean();

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get active categories error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve active categories",
    });
  }
};

/*
 * @desc    Get single category
 * @route   GET /api/categories/:id
 * @access  Admin / Staff
 */
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Get category error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve category",
    });
  }
};

/*
 * @desc    Create category
 * @route   POST /api/categories
 * @access  Admin
 */
export const createCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      image,
      isActive,
      sortOrder,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const normalizedName = name.trim();

    const existingCategory = await Category.findOne({
      name: {
        $regex: `^${normalizedName}$`,
        $options: "i",
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "A category with this name already exists",
      });
    }

    const category = await Category.create({
      name: normalizedName,
      description: description || "",
      image: image || "",
      isActive:
        typeof isActive === "boolean"
          ? isActive
          : true,
      sortOrder:
        typeof sortOrder === "number"
          ? sortOrder
          : 0,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create category error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A category with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to create category",
    });
  }
};

/*
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Admin
 */
export const updateCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      image,
      isActive,
      sortOrder,
    } = req.body;

    const category = await Category.findById(
      req.params.id
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (name !== undefined) {
      const normalizedName = name.trim();

      if (!normalizedName) {
        return res.status(400).json({
          success: false,
          message: "Category name cannot be empty",
        });
      }

      const duplicateCategory =
        await Category.findOne({
          name: {
            $regex: `^${normalizedName}$`,
            $options: "i",
          },
          _id: {
            $ne: category._id,
          },
        });

      if (duplicateCategory) {
        return res.status(409).json({
          success: false,
          message:
            "Another category with this name already exists",
        });
      }

      category.name = normalizedName;
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    if (image !== undefined) {
      category.image = image.trim();
    }

    if (typeof isActive === "boolean") {
      category.isActive = isActive;
    }

    if (typeof sortOrder === "number") {
      category.sortOrder = sortOrder;
    }

    const updatedCategory = await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Update category error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update category",
    });
  }
};

/*
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Admin
 */
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(
      req.params.id
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete category",
    });
  }
};

export default {
  getCategories,
  getActiveCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};