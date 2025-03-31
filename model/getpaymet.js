const mongoose = require('mongoose');
const getpaymentSchema = mongoose.Schema({
    merchantOrderId: String,
    name: String,
    mobile: String,
    amount: Number,
    status: String,
    createdAt: { type: Date, default: Date.now },
})

const GetPaymentModel= mongoose.model("getpayment",getpaymentSchema);

module.exports = GetPaymentModel