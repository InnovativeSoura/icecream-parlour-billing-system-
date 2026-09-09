import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "./config/db.js";
import Category from "./models/Category.js";

const categories = [
  {
    name: "Ice Cream",
    description: "Classic ice cream flavors and scoops",
    isActive: true,
    sortOrder: 1,
  },
  {
    name: "Sundaes",
    description: "Premium ice cream sundaes with delicious toppings",
    isActive: true,
    sortOrder: 2,
  },
  {
    name: "Milkshakes",
    description: "Creamy and delicious ice cream milkshakes",
    isActive: true,
    sortOrder: 3,
  },
  {
    name: "Cakes",
    description: "Ice cream cakes for celebrations and special occasions",
    isActive: true,
    sortOrder: 4,
  },
  {
    name: "Waffles",
    description: "Fresh waffles served with ice cream and toppings",
    isActive: true,
    sortOrder: 5,
  },
  {
    name: "Brownies",
    description: "Warm brownies served with premium ice cream",
    isActive: true,
    sortOrder: 6,
  },
  {
    name: "Falooda",
    description: "Traditional falooda with ice cream and toppings",
    isActive: true,
    sortOrder: 7,
  },
  {
    name: "Beverages",
    description: "Cold beverages and refreshing drinks",
    isActive: true,
    sortOrder: 8,
  },
];

const seedCategories = async () => {
  try {
    await connectDB();

    console.log("🌱 Seeding categories...");

    for (const category of categories) {
      const existingCategory = await Category.findOne({
        name: category.name,
      });

      if (existingCategory) {
        console.log(`⏭️ Already exists: ${category.name}`);
        continue;
      }

      await Category.create(category);

      console.log(`✅ Created: ${category.name}`);
    }

    console.log("🎉 Category seeding completed.");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Category seeding failed:");
    console.error(error);

    await mongoose.connection.close();
    process.exit(1);
  }
};

seedCategories();