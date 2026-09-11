import dns from "dns";

/*
|--------------------------------------------------------------------------
| DNS Configuration
|--------------------------------------------------------------------------
|
| Helps resolve MongoDB Atlas SRV records in environments where the
| default DNS resolver may have problems.
|
|--------------------------------------------------------------------------
*/

dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
]);

/*
|--------------------------------------------------------------------------
| Environment Variables
|--------------------------------------------------------------------------
*/

import "dotenv/config";

/*
|--------------------------------------------------------------------------
| Core Dependencies
|--------------------------------------------------------------------------
*/

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

/*
|--------------------------------------------------------------------------
| Database
|--------------------------------------------------------------------------
*/

import connectDB from "./config/db.js";

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

/*
|--------------------------------------------------------------------------
| Payment Controller
|--------------------------------------------------------------------------
|
| Razorpay webhook must be handled with the ORIGINAL raw request body.
|
|--------------------------------------------------------------------------
*/

import {
  razorpayWebhook,
} from "./controllers/paymentController.js";

/*
|--------------------------------------------------------------------------
| Error Middleware
|--------------------------------------------------------------------------
*/

import {
  notFound,
  errorHandler,
} from "./middleware/errorMiddleware.js";

/*
|--------------------------------------------------------------------------
| Express Application
|--------------------------------------------------------------------------
*/

const app = express();

const PORT =
  process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| Render / Reverse Proxy Configuration
|--------------------------------------------------------------------------
|
| Render runs the application behind a reverse proxy.
| This makes secure request handling and protocol detection more reliable.
|
|--------------------------------------------------------------------------
*/

app.set(
  "trust proxy",
  1
);

/*
|--------------------------------------------------------------------------
| Database Connection
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
    crossOriginResourcePolicy:
      false,
  })
);

/*
|--------------------------------------------------------------------------
| Compression
|--------------------------------------------------------------------------
*/

app.use(
  compression()
);

/*
|--------------------------------------------------------------------------
| Logging
|--------------------------------------------------------------------------
*/

if (
  process.env.NODE_ENV !==
  "production"
) {
  app.use(
    morgan("dev")
  );
}

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (
      origin,
      callback
    ) => {
      /*
      |--------------------------------------------------------------------------
      | Requests without Origin
      |--------------------------------------------------------------------------
      |
      | Includes:
      | - server-to-server requests
      | - Razorpay webhooks
      | - some health checks
      |
      |--------------------------------------------------------------------------
      */

      if (!origin) {
        return callback(
          null,
          true
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Allowed frontend origin
      |--------------------------------------------------------------------------
      */

      if (
        allowedOrigins.includes(
          origin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Block unknown origin
      |--------------------------------------------------------------------------
      */

      console.warn(
        `🚫 CORS blocked origin: ${origin}`
      );

      return callback(
        new Error(
          `CORS policy blocked origin: ${origin}`
        )
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
    ],
  })
);

/*
|--------------------------------------------------------------------------
| Razorpay Webhook
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Razorpay webhook signature verification requires the ORIGINAL RAW
| request body.
|
| Therefore this route MUST be registered BEFORE express.json().
|
|--------------------------------------------------------------------------
*/

app.post(
  "/api/payments/webhook",
  express.raw({
    type: "application/json",
    limit: "2mb",
  }),
  razorpayWebhook
);

/*
|--------------------------------------------------------------------------
| Body Parsers
|--------------------------------------------------------------------------
|
| These parsers intentionally come AFTER the Razorpay webhook.
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
    limit: "10mb",
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
    return res.status(200).json({
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
| Root API
|--------------------------------------------------------------------------
*/

app.get(
  "/",
  (req, res) => {
    return res.status(200).json({
      success: true,

      message:
        "🍦 IceCream Billing API is running",

      version:
        "1.0.0",

      environment:
        process.env.NODE_ENV ||
        "development",

      health:
        "/api/health",
    });
  }
);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

app.use(
  "/api/auth",
  authRoutes
);

/*
|--------------------------------------------------------------------------
| Categories
|--------------------------------------------------------------------------
*/

app.use(
  "/api/categories",
  categoryRoutes
);

/*
|--------------------------------------------------------------------------
| Products
|--------------------------------------------------------------------------
*/

app.use(
  "/api/products",
  productRoutes
);

/*
|--------------------------------------------------------------------------
| Inventory
|--------------------------------------------------------------------------
*/

app.use(
  "/api/inventory",
  inventoryRoutes
);

/*
|--------------------------------------------------------------------------
| Customers
|--------------------------------------------------------------------------
*/

app.use(
  "/api/customers",
  customerRoutes
);

/*
|--------------------------------------------------------------------------
| Orders
|--------------------------------------------------------------------------
*/

app.use(
  "/api/orders",
  orderRoutes
);

/*
|--------------------------------------------------------------------------
| Payments
|--------------------------------------------------------------------------
|
| NOTE:
| The /api/payments/webhook endpoint is already registered above because
| it requires express.raw().
|
| The payment router can still contain its webhook route, but the
| server-level webhook route above will handle Razorpay webhook requests
| first.
|
|--------------------------------------------------------------------------
*/

app.use(
  "/api/payments",
  paymentRoutes
);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use(
  notFound
);

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use(
  errorHandler
);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `🍦 IceCream Billing API running on port ${PORT}`
    );

    console.log(
      "🌐 Allowed CORS origins:",
      allowedOrigins
    );

    console.log(
      "💳 Razorpay webhook:",
      "/api/payments/webhook"
    );

    console.log(
      "🏥 Health check:",
      "/api/health"
    );
  }
);