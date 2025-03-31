const dotenv = require ('dotenv')
dotenv.config();

const mongoose = require("mongoose");
const db = mongoose.connect(process.env.DB)

.then((result)=>{
  console.log("conncted");
})

.catch((err)=>{
  console.log(err.messsage)
})
const express = require("express");

const app = express();
app.listen(process.env.PORT || 8080);

app.use(express.json());

const cors = require("cors");
const { createOrder, checkStatusForGetPayment, getPayments } = require('./controller/GetPayment');
const { sendPayment, checkStatusforsendpayment } = require('./controller/SendPayment');
app.use(cors());

//getpayments 

app.post("/create-order",createOrder)

app.get("/checkstatus",checkStatusForGetPayment)

app.get("/payment",getPayments)

//sendpayments

app.post('/send-payment',sendPayment)

app.get('/sendpaymentstatus',checkStatusforsendpayment)






