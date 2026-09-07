import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

/*
 * GET /api/products
 * Admin / Staff
 */
export const getProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      isActive,
      isAvailable,
    } = req.query;

    const filter = {};

    if (
      category &&
      mongoose.Types.ObjectId.isValid(category)
    ) {
      filter.category = category;
    }

    if (search && search.trim()) {
      filter.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          sku: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (isAvailable !== undefined) {
      filter.isAvailable =
        isAvailable === "true";
    }

    const products = await Product.find(filter)
      .populate(
        "category",
        "name slug"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(
      "Get products error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to retrieve products",
    });
  }
};

/*
 * GET /api/products/available
 * Public
 */
export const getAvailableProducts = async (
  req,
  res
) => {
  try {
    const products = await Product.find({
      isActive: true,
      isAvailable: true,
    })
      .populate(
        "category",
        "name slug"
      )
      .sort({
        name: 1,
      })
      .lean();

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(
      "Get available products error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to retrieve available products",
    });
  }
};

/*
 * GET /api/products/:id
 * Admin / Staff
 */
export const getProductById = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(
      req.params.id
    ).populate(
      "category",
      "name slug"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "Get product error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to retrieve product",
    });
  }
};

/*
 * POST /api/products
 * Admin
 */
export const createProduct = async (
  req,
  res
) => {
  try {
    const {
      name,
      sku,
      category,
      description,
      image,
      price,
      costPrice,
      taxRate,
      unit,
      lowStockThreshold,
      isAvailable,
      isActive,
    } = req.body;

    if (
      !name ||
      !sku ||
      !category ||
      price === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, SKU, category and price are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        category
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const existingCategory =
      await Category.findById(category);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Selected category not found",
      });
    }

    const normalizedSku =
      sku.trim().toUpperCase();

    const existingProduct =
      await Product.findOne({
        sku: normalizedSku,
      });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message:
          "A product with this SKU already exists",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      sku: normalizedSku,
      category,
      description: description?.trim() || "",
      image: image?.trim() || "",
      price: Number(price),
      costPrice:
        costPrice !== undefined
          ? Number(costPrice)
          : 0,
      taxRate:
        taxRate !== undefined
          ? Number(taxRate)
          : 5,
      unit: unit || "piece",
      lowStockThreshold:
        lowStockThreshold !== undefined
          ? Number(lowStockThreshold)
          : 10,
      isAvailable:
        typeof isAvailable === "boolean"
          ? isAvailable
          : true,
      isActive:
        typeof isActive === "boolean"
          ? isActive
          : true,
    });

    const populatedProduct =
      await Product.findById(product._id)
        .populate(
          "category",
          "name slug"
        );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: populatedProduct,
    });
  } catch (error) {
    console.error(
      "Create product error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A product with this SKU already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to create product",
    });
  }
};

/*
 * PUT /api/products/:id
 * Admin
 */
export const updateProduct = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "image",
      "price",
      "costPrice",
      "taxRate",
      "unit",
      "lowStockThreshold",
      "isAvailable",
      "isActive",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    if (req.body.category !== undefined) {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.body.category
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }

      const category =
        await Category.findById(
          req.body.category
        );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      product.category = req.body.category;
    }

    if (req.body.sku !== undefined) {
      const normalizedSku =
        req.body.sku.trim().toUpperCase();

      const duplicateProduct =
        await Product.findOne({
          sku: normalizedSku,
          _id: {
            $ne: product._id,
          },
        });

      if (duplicateProduct) {
        return res.status(409).json({
          success: false,
          message:
            "Another product already uses this SKU",
        });
      }

      product.sku = normalizedSku;
    }

    const updatedProduct =
      await product.save();

    const populatedProduct =
      await Product.findById(
        updatedProduct._id
      ).populate(
        "category",
        "name slug"
      );

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: populatedProduct,
    });
  } catch (error) {
    console.error(
      "Update product error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to update product",
    });
  }
};

/*
 * DELETE /api/products/:id
 * Admin
 */
export const deleteProduct = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete product error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to delete product",
    });
  }
};