
import dns from "dns";

dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
]);

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

import {
  notFound,
  errorHandler,
} from "./middleware/errorMiddleware.js";



const app = express();

const PORT = process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| Database
|--------------------------------------------------------------------------
*/

connectDB();

/*
|--------------------------------------------------------------------------
| Security
|--------------------------------------------------------------------------
*/

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(compression());

/*
|--------------------------------------------------------------------------
| Logging
|--------------------------------------------------------------------------
*/

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin:
      process.env.CLENT_URL||
      "http://localhost:5173",

    credentials: true,
  })
);

/*
|--------------------------------------------------------------------------
| Razorpay Webhook
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Razorpay signature verification requires the ORIGINAL raw request body.
|
| Therefore this MUST be registered BEFORE express.json().
|
|--------------------------------------------------------------------------
*/

app.post(
  "/api/payments/webhook",
  express.raw({
    type: "application/json",
  }),
  async (req, res, next) => {
    try {
      const {
        razorpayWebhook,
      } = await import(
        "./controllers/paymentController.js"
      );

      await razorpayWebhook(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Body Parsers
|--------------------------------------------------------------------------
|
| These parsers are intentionally placed AFTER the Razorpay webhook.
|
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,

      message:
        "IceCream Billing API is running",

      environment:
        process.env.NODE_ENV ||
        "development",

      timestamp:
        new Date().toISOString(),
    });
  }
);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/categories",
  categoryRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/inventory",
  inventoryRoutes
);

app.use(
  "/api/customers",
  customerRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/payments",
  paymentRoutes
);

/*
|--------------------------------------------------------------------------
| Error Handling
|--------------------------------------------------------------------------
*/

app.use(notFound);

app.use(errorHandler);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🍦 IceCream Billing API running on port ${PORT}`);
});