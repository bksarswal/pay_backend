const { randomUUID } = require("crypto");
const GetPaymentModel = require("../model/getpaymet"); // Ensure correct model path



const client = require("../Config/Client")

const { StandardCheckoutPayRequest } = require("pg-sdk-node");


const createOrder = async (req, res) => {
  try {
    const { name, mobile, amount } = req.body;

    if (!name || !mobile || !amount) {
      return res.status(400).json({ message: "Name, Mobile, and Amount are required" });
    }

    const merchantOrderId = randomUUID();
    console.log("Generated Order ID:", merchantOrderId);

    const redirectUrl = `http://localhost:8080/checkstatus?merchantOrderId=${merchantOrderId}`;

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amount * 100)
      .redirectUrl(redirectUrl)
      .build();

    console.log("Payment Request Built:", request);

    // 🔥 Fix: Use client.pay() instead of GetPaymentModel.pay()
    const response = await client.pay(request);
    console.log("Payment Response:", response);

    // 🔥 Fix: Create new instance of GetPaymentModel
    const newPayment = new GetPaymentModel({
      merchantOrderId,
      name,
      mobile,
      amount,
      status: "pending",
    });

    await newPayment.save();
    console.log("Payment saved to MongoDB");

    return res.json({
      checkoutPageUrl: response.redirectUrl,
    });

  } catch (error) {
    console.error("Error creating order:", error.message, error.stack);
    res.status(500).json({ message: "Error creating order", error: error.message });
  }
};

const checkStatusForGetPayment = async (req, res) => {
  try {
    const { merchantOrderId } = req.query;

    if (!merchantOrderId) {
      return res.status(400).send("MerchantOrderId is required");
    }

    // 🔥 Fix: Ensure `client` is imported properly
    const response = await client.getOrderStatus(merchantOrderId);
    console.log("Payment Status Response:", response);

    const status = response.state;
    const payment = await GetPaymentModel.findOne({ merchantOrderId });

    if (payment) {
      payment.status = status;
      await payment.save();
      console.log("Payment status updated in MongoDB");
    } else {
      console.warn("Payment record not found in MongoDB");
    }

    const redirectUrl =
      status === "COMPLETED" ? "http://localhost:5173/success" : "http://localhost:5173/failed";

    return res.redirect(redirectUrl);

  } catch (error) {
    console.error("Error getting payment status:", error.message, error.stack);
    res.status(500).send("Error getting status");
  }
};

const getPayments = async (req, res) => {
  try {
    const payments = await GetPaymentModel.find();
    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createOrder,
  checkStatusForGetPayment,
  getPayments,
};
