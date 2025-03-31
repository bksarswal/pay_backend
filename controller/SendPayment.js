const client = require("../Config/Client"); 
const { StandardCheckoutPayRequest } = require("pg-sdk-node");
const SendPaymentModel = require("../model/sendPaymentmodel");

// **🔹 Send Payment**
const sendPayment = async (req, res) => {
  try {
    const { name, amount, paymentMethod, upiId, accountNumber, ifsc } = req.body;

    if (!name || !amount) {
      return res.status(400).json({ success: false, message: "Name and amount are required!" });
    }

    // Convert to Paisa
    const amountInPaisa = Number(amount) * 100; 
    if (isNaN(amountInPaisa)) {
      return res.status(400).json({ success: false, message: "Invalid amount format" });
    }

    // Unique Merchant Order ID 
    const merchantOrderId = `ORD-${Date.now()}`;

    // Payment Request Object
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amountInPaisa)
      .redirectUrl(`http://localhost:8080/sendpaymentstatus?merchantOrderId=${merchantOrderId}`)
      .build();

    // Call Payment Gateway
    const response = await client.pay(request);
    if (!response || !response.redirectUrl) {
      throw new Error("Invalid payment gateway response");
    }

    // Save Payment to DB
    const newPayment = new SendPaymentModel({
      merchantOrderId,
      name,
      amount,
      paymentMethod,
      upiId,
      accountNumber,
      ifsc,
      status: "pending",
    });

    await newPayment.save();

    res.json({ success: true, message: "Payment Initiated", checkoutPageUrl: response.redirectUrl });
  } catch (error) {
    console.error("Payment Error:", error.message);
    res.status(500).json({ success: false, message: "Payment Failed", error: error.message });
  }
};

// **🔹 Check Payment Status**
const checkStatusforsendpayment = async (req, res) => {
  try {
    const { merchantOrderId } = req.query;
    if (!merchantOrderId) return res.status(400).json({ success: false, message: "MerchantOrderId is required" });

    const response = await client.getOrderStatus(merchantOrderId);
    const status = response?.state === "COMPLETED" ? "success" : "failed";

    // Update Payment in DB
    const payment = await SendPaymentModel.findOne({ merchantOrderId });
    if (payment) {
      payment.status = status;
      await payment.save();
    }

    // Redirect based on payment status
    return res.redirect(`http://localhost:5173/${status}`);
  } catch (error) {
    console.error("Status Check Error:", error);
    res.status(500).json({ success: false, message: "Error checking payment status", error: error.message });
  }
};

// Exporting functions
module.exports = { sendPayment, checkStatusforsendpayment };
