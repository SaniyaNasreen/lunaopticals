const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  productimage: String,
  productname: String,
  price: String,
  quantity: Number,
  firstname: String,
  lastname: String,
  address: String,
  city: String,
  country: String,
  pincode: String,
  email: String,
  mobile: String,
  // Other fields related to the order
});

module.exports = mongoose.model("Order", orderSchema);
