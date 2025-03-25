import express from 'express';
import cors from 'cors';
import {randomUUID} from "crypto"
import dotenv from "dotenv"
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from "pg-sdk-node";
const PORT = process.env.PORT ||5000
dotenv.config();

import { db,Payment } from './db.js';

const app = express();

app.use(express.json())
app.use(cors());


const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const clientVersion = 1
const env = Env.SANDBOX  // Change to Env.PRODUCTION when going live

const client = StandardCheckoutClient.getInstance(clientId, clientSecret,clientVersion, env)


app.post('/create-order', async (req, res) => {
  try {
      //  Frontend se name, mobile, amount lenge
      const { name, mobile, amount } = req.body;

      if (!name || !mobile || !amount) {
          return res.status(400).json({ message: "Name, Mobile, and Amount are required" });
      }

      const merchantOrderId = randomUUID();
      console.log("Generated Order ID:", merchantOrderId);

      const redirectUrl = `http://localhost:5000/check-status?merchantOrderId=${merchantOrderId}`;

      const request = StandardCheckoutPayRequest.builder()
          .merchantOrderId(merchantOrderId)
          // .name(name)     
          // .mobile(mobile) 

        // jb name and mobile frntend se lene pr  "{
        //  "message": "Error creating order",
        //  "error": "StandardCheckoutPayRequest.builder(...).merchantOrderId(...).name is not a function"
        
        // }"

          .amount(amount*100)
          .redirectUrl(redirectUrl)
          .build();

      console.log("Payment Request Built:", request);

      const response = await client.pay(request);
      console.log("Payment Response:", response);
      // I folllow this process and solve our problem   
     // First in backed create order id and save your name mobile email of customer in db using order id
      //After payment status api get the order id then find in db and just update status
      const newPayment_create = new Payment({
        merchantOrderId,
        name,
        mobile,
        amount,
        status: "pending",
      });

      await newPayment_create.save();
      console.log(" Payment saved to MongoDB");


      return res.json({
          checkoutPageUrl: response.redirectUrl
      });

  } catch (error) {
      console.error("Error creating order:", error.message, error.stack);
      res.status(500).json({ message: "Error creating order", error: error.message });
  }
});




app.get('/check-status', async (req, res) => {
    try {

        const {merchantOrderId,name,mobile ,amount} = req.query

        // console.log(merchantOrderId);
        // console.log(name);
        // console.log(amount);
        // console.log(mobile);
      

        if(!merchantOrderId){
            return res.status(400).send("MerchantOrderId is required")
        }

        const response = await client.getOrderStatus(merchantOrderId)
        console.log(" Payment Status Response:", response);

        const status = response.state
        // console.log(status);


        const payment = await Payment.findOne({ merchantOrderId });
        if (payment) {
          payment.status = status;
          await payment.save();
          console.log(' Payment status updated in MongoDB');
        } else {
          console.warn(' Payment record not found in MongoDB');
        }
    

        if (status === "COMPLETED") {
          // **Save Payment to MongoDB**
          // const newPayment = new Payment({
          //   merchantOrderId,
          //   name,
          //   mobile,
          //   amount,
          //   status: "COMPLETED",
          // });
    
          // await newPayment.save();
          // console.log(" Payment saved to MongoDB");

         
          

    
          return res.redirect(`http://localhost:5173/success`);
        } else {
          return res.redirect(`http://localhost:5173/failed`);
        }

        
    } catch (error) {
        console.error("error creating order" + error)
        res.status(500).send("Error getting status")
    }   
})


app.get("/payments", async (req, res) => {
  try {
    const payments = await Payment.find();
    res.json(payments);
  } catch (error) {
    console.error(" Error fetching payments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, ()=>{
    console.log("Server is running on port 5000")
})