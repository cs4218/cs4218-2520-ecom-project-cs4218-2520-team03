import colors from "colors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import express from "express";
import morgan from "morgan";
import cors from "cors";

import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";

import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";

import rateLimit from 'express-rate-limit';

dotenv.config();

//database config
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Sun Zihan, A0259581R 
app.use(helmet()); 
app.use(mongoSanitize());
app.set('trust proxy', 1);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
  message: {
    success: false,
    message: "Too many login attempts, please try again after 15 minutes"
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});

app.use("/api/v1/auth/login", loginLimiter);
app.use("/api/v1/auth/forgot-password", loginLimiter);

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);

// rest api

app.get("/", (req, res) => {
  res.send("<h1>Welcome to ecommerce app</h1>");
});

// Sun Zihan, A0259581R
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 6060;
  app.listen(PORT, () => {
      console.log(`Server running on ${process.env.DEV_MODE} mode on ${PORT}`.bgCyan.white);
  });
}

export default app;
