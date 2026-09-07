import mongoose from "mongoose";

import Inventory from "../models/Inventory.js";
import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";

/*
 * GET /api/inventory
 * Admin / Staff
 */
export const getInventory = async (
  req,
  res
) => {
  try {
    const {
      search,
      lowStock,
    } = req.query;

    const products = await Product.find()
      .populate(
        "category",
        "name slug"
      )
      .lean();

    const inventory =
      await Inventory.find()
        .populate(
          "product",
          "name sku price unit image category isActive isAvailable"
        )
        .sort({
          updatedAt: -1,
        })
        .lean();

    const inventoryMap = new Map();

    inventory.forEach((item) => {
      inventoryMap.set(
        String(item.product?._id),
        item
      );
    });

    let result = products.map(
      (product) => {
        const item =
          inventoryMap.get(
            String(product._id)
          );

        const currentStock =
          item?.currentStock ?? 0;

        const reservedStock =
          item?.reservedStock ?? 0;

        const lowStockThreshold =
          item?.lowStockThreshold ??
          product.lowStockThreshold ??
          10;

        const availableStock =
          Math.max(
            0,
            currentStock -
              reservedStock
          );

        return {
          _id: item?._id || null,
          product,
          currentStock,
          reservedStock,
          availableStock,
          lowStockThreshold,
          unit:
            item?.unit ||
            product.unit ||
            "piece",
          lastRestockedAt:
            item?.lastRestockedAt ||
            null,
          lastStockUpdateAt:
            item?.lastStockUpdateAt ||
            null,
          isLowStock:
            currentStock <=
            lowStockThreshold,
        };
      }
    );

    if (search?.trim()) {
      const searchValue =
        search.trim().toLowerCase();

      result = result.filter(
        (item) =>
          item.product.name
            .toLowerCase()
            .includes(searchValue) ||
          item.product.sku
            .toLowerCase()
            .includes(searchValue)
      );
    }

    if (lowStock === "true") {
      result = result.filter(
        (item) => item.isLowStock
      );
    }

    res.status(200).json({
      success: true,
      count: result.length,
      inventory: result,
    });
  } catch (error) {
    console.error(
      "Get inventory error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to retrieve inventory",
    });
  }
};

/*
 * GET /api/inventory/:productId
 * Admin / Staff
 */
export const getInventoryByProduct =
  async (req, res) => {
    try {
      const {
        productId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          productId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID",
        });
      }

      const product =
        await Product.findById(
          productId
        );

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found",
        });
      }

      let inventory =
        await Inventory.findOne({
          product: productId,
        }).populate(
          "product",
          "name sku price unit image"
        );

      if (!inventory) {
        inventory =
          await Inventory.create({
            product: productId,
            currentStock: 0,
            lowStockThreshold:
              product.lowStockThreshold,
            unit: product.unit,
          });

        inventory =
          await Inventory.findById(
            inventory._id
          ).populate(
            "product",
            "name sku price unit image"
          );
      }

      res.status(200).json({
        success: true,
        inventory,
      });
    } catch (error) {
      console.error(
        "Get product inventory error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to retrieve inventory",
      });
    }
  };

/*
 * POST /api/inventory/:productId/adjust
 * Admin
 */
export const adjustStock = async (
  req,
  res
) => {
  try {
    const {
      productId,
    } = req.params;

    const {
      quantity,
      type,
      reason,
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(
        productId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID",
      });
    }

    if (
      quantity === undefined ||
      Number(quantity) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity must be greater than zero",
      });
    }

    const allowedTypes = [
      "purchase",
      "restock",
      "adjustment",
      "damage",
      "return",
    ];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid stock movement type",
      });
    }

    const product =
      await Product.findById(
        productId
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    let inventory =
      await Inventory.findOne({
        product: productId,
      });

    if (!inventory) {
      inventory =
        await Inventory.create({
          product: productId,
          currentStock: 0,
          lowStockThreshold:
            product.lowStockThreshold,
          unit: product.unit,
        });
    }

    const previousStock =
      inventory.currentStock;

    let newStock;

    /*
     * Damage decreases stock.
     * Purchase/restock/return increase stock.
     * Adjustment sets stock to an exact value.
     */
    if (type === "damage") {
      newStock =
        previousStock -
        Number(quantity);

      if (newStock < 0) {
        return res.status(400).json({
          success: false,
          message:
            "Insufficient stock for this adjustment",
        });
      }
    } else if (
      type === "adjustment"
    ) {
      newStock = Number(quantity);
    } else {
      newStock =
        previousStock +
        Number(quantity);
    }

    inventory.currentStock =
      newStock;

    inventory.lastStockUpdateAt =
      new Date();

    if (
      type === "purchase" ||
      type === "restock"
    ) {
      inventory.lastRestockedAt =
        new Date();
    }

    const updatedInventory =
      await inventory.save();

    await StockMovement.create({
      product: productId,
      inventory:
        updatedInventory._id,
      type,
      quantity: Number(quantity),
      previousStock,
      newStock,
      referenceType:
        type === "purchase"
          ? "purchase"
          : type === "return"
          ? "return"
          : type === "damage"
          ? "damage"
          : "manual",
      reason:
        reason?.trim() || "",
      createdBy: req.user._id,
    });

    const populatedInventory =
      await Inventory.findById(
        updatedInventory._id
      ).populate(
        "product",
        "name sku price unit image"
      );

    res.status(200).json({
      success: true,
      message:
        "Stock updated successfully",
      inventory:
        populatedInventory,
    });
  } catch (error) {
    console.error(
      "Adjust stock error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to update stock",
    });
  }
};

/*
 * GET /api/inventory/:productId/movements
 * Admin / Staff
 */
export const getStockMovements =
  async (req, res) => {
    try {
      const {
        productId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          productId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID",
        });
      }

      const movements =
        await StockMovement.find({
          product: productId,
        })
          .populate(
            "createdBy",
            "name email role"
          )
          .sort({
            createdAt: -1,
          })
          .lean();

      res.status(200).json({
        success: true,
        count: movements.length,
        movements,
      });
    } catch (error) {
      console.error(
        "Get stock movements error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to retrieve stock movements",
      });
    }
  };