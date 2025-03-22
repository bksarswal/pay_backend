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
      // 🔹 Frontend se name, mobile, amount lenge
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

          .amount(amount)
          .redirectUrl(redirectUrl)
          .build();

      console.log("Payment Request Built:", request);

      const response = await client.pay(request);
      console.log("Payment Response:", response);

      return res.json({
          checkoutPageUrl: response.redirectUrl
      });

  } catch (error) {
      console.error("Error creating order:", error.message, error.stack);
      res.status(500).json({ message: "Error creating order", error: error.message });
  }
});


// app.post('/create-order', async (req, res) => {
//     try {

//         const {amount} = req.body

//         if(!amount){
//             return res.status(400).send("Amount is required")
//         }

//         const merchantOrderId = randomUUID()
//         console.log(merchantOrderId);

//         const redirectUrl = `http://localhost:5000/check-status?merchantOrderId=${merchantOrderId}`

//         const request = StandardCheckoutPayRequest.builder()
//         .merchantOrderId(merchantOrderId)
//         .amount(amount)
//         .redirectUrl(redirectUrl)
//         .build()

//         const response = await client.pay(request)

//         return res.json({
//             checkoutPageUrl:response.redirectUrl
//         })
        
//     } catch (error) {
//         console.error("error creating order" + error)
//         res.status(500).send("Error creating order")
//     }
// })

app.get('/check-status', async (req, res) => {
    try {

        const {merchantOrderId,name,mobile ,amount} = req.query

        console.log(merchantOrderId);
        console.log(name);
        console.log(amount);
        console.log(mobile);
      

        if(!merchantOrderId){
            return res.status(400).send("MerchantOrderId is required")
        }

        const response = await client.getOrderStatus(merchantOrderId)
        console.log(" Payment Status Response:", response);

        const status = response.state
        console.log(status);

        if (status === "COMPLETED") {
          // **Save Payment to MongoDB**
          const newPayment = new Payment({
            merchantOrderId,
            name,
            mobile,
            amount,
            status: "COMPLETED",
          });
    
          await newPayment.save();
          console.log("✅ Payment saved to MongoDB");
    
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