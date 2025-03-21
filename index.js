require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const paymentRoutes = require("./routes/payment");
const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");

app.use(cors());
app.use(express.json());
app.use(userRoutes);
app.use(offerRoutes);
app.use(paymentRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" });
});

app.listen(process.env.PORT, () => {
  console.log("Serveur has started");
});
