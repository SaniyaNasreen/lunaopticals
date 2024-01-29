const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },

  couponApplied: {
    type: Boolean,
    default: false,
  },
  payment: {
    status: {
      type: String,
      enum: ["Received", "Not Received"],
      default: "Not Received",
    },
    type: {
      type: String,
      enum: ["Cash on delivery", "Razorpay"],
    },
    details: {
      type: Object,
    },
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  purchasedItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
        default: 1,
      },
      price: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        enum: [
          "Delivered",
          "Shipped",
          "Processing",
          "Returned",
          "Placed",
          "cancelled",
        ],
        default: "Placed",
      },
    },
  ],
  address: {
    _id: false,
    firstname: {
      type: String,
    },
    lastname: {
      type: String,
    },
    address: {
      type: String,
    },
    email: {
      type: String,
    },
    city: {
      type: String,
    },
    country: {
      type: String,
    },
    pincode: {
      type: Number,
    },
    mobile: {
      type: Number,
    },
  },

  totalAmount: {
    type: Number,
    required: true,
  },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
