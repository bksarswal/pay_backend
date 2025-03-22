import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("connected", () => {
  console.log("MongoDB connected successfully!");
});

db.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

// Payment Schema
const PaymentSchema = new mongoose.Schema({
  merchantOrderId: String,
  name: String,
  mobile: String,
  amount: Number,
  status: String,
  createdAt: { type: Date, default: Date.now },
});

const Payment = mongoose.model("Payment", PaymentSchema);

export { db, Payment };
