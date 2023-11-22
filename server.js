import express, { json } from "express"; //Line 1
const port = process.env.PORT || 5000; //Line 3
import cors from "cors";
import { request } from "http";
import { default as connectDB } from "./config/db.js";
import dotenv from "dotenv";
dotenv.config();
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import StripeCustomer from "./models/Customer.js"; // Assuming you have a Mongoose model

const app = express();
connectDB();

//middleware
app.use(json());
app.use(cors());

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

app.get("/products", async (req, res) => {
  const products = await stripe.products.list({
    limit: 4,
    expand: ["data.default_price"],
  });
  res.json({
    products: products,
  });
});

app.get("/product/:productId", async (req, res) => {
  const product = await stripe.products.retrieve(req.params.productId);

  res.json({
    product: product,
  });
});

app.post("/api/saveUser", async (req, res) => {
  try {
    const userData = req.body;

    // Create a new StripeCustomer document using the Mongoose model
    const newCustomer = new StripeCustomer();

    const existingUser = await StripeCustomer.findOne({
      email: userData.email,
    });

    if (existingUser) {
      res.status(200).json({ message: "User exists" });
    } else {
      // Create a new user record
      newCustomer.name = req.body.nickname;
      newCustomer.customerId = req.body.sub;
      newCustomer.email = req.body.email;
      await newCustomer.save();
      await stripe.customers.create({
        email: req.body.email,
        name: req.body.nickname,
      });
      res.status(201).json({ message: "User data saved successfully" });
    }
  } catch (error) {
    console.error("Error saving/updating user data:", error);
    res.status(500).json({ error: "Failed to save/update user data" });
  }
});

app.get("/success", async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session);
  const line_items = await stripe.checkout.sessions.listLineItems(
    req.query.session,
    {
      expand: ["data.price.product"],
    }
  );

  res.json({
    session: session,
    name: session.customer_details.name,
    total: session.amount_total,
    email: session.customer_details.email,
    line_items: line_items.data,
  });
});

app.post("/api/create-checkout-session", async (req, res) => {
  console.log(req.body);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: req.body.lineItems,
    mode: "payment",
    success_url: `${req.headers.origin}/success?session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.headers.origin}/`,
  });
  res.json({ id: session.id });
});

// This displays message that the server running and listening to specified port
app.listen(port, () => console.log(`Listening on port ${port}`)); //Line 6
