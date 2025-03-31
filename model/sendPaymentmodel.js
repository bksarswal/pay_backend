const mongoose = require("mongoose");

const SendPaymentSchema = new mongoose.Schema({
  merchantOrderId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
 
    paymentMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "net_banking", "upi"],
      required: true,
    },
  
  
  upiId: {
    type: String,
    required: function () {
      return this.paymentMethod === "UPI";
    },
  },
  accountNumber: {
    type: String,
    required: function () {
      return this.paymentMethod === "NetBanking";
    },
  },
  ifsc: {
    type: String,
    required: function () {
      return this.paymentMethod === "NetBanking";
    },
  },
  status: {
    type: String,
    enum: ["pending", "COMPLETED", "FAILED"],
    default: "pending",
  },
}, { timestamps: true });

const SendPaymentModel = mongoose.model("Payment", SendPaymentSchema);
module.exports = SendPaymentModel;
