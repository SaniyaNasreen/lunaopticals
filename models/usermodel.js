const mongoose = require("mongoose");

// .......................user schema for address........................... //
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mobile: {
    type: Number,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  cpassword: {
    type: String,
    required: true,
  },
  street: {
    type: String,
    required: false,
  },
  appartment: {
    type: String,
    required: false,
  },
  zip: {
    type: String,
    required: false,
  },
  city: {
    type: String,
    required: false,
  },
  state: {
    type: String,
    required: false,
  },
  country: {
    type: String,
    required: true,
  },
  is_admin: {
    type: Number,
    required: true,
  },
  is_varified: {
    type: Number,
    default: 0,
  },
  token: {
    type: String,
    default: "",
  },
  listed: {
    type: Boolean,
    default: true,
  },
  is_blocked: {
    type: Boolean,
    default: false,
  },
  address: [
    {
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
  ],
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon",
  },
  couponApplied: {
    type: Boolean,
    default: false,
  },
  cart: [
    {
      _id: false,
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],

      quantity: {
        type: Number,
      },
      total: {
        type: Number,
      },
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
