const mongoose = require("mongoose");
const { Number } = require("twilio/lib/twiml/VoiceResponse");

const couponSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ["Active", "In Active"],
    default: "In Active",
  },
  discount: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        return value >= 0 && value <= 100;
      },
      message: "Discount should be a percentage between 0 and 100",
    },
    default: 0,
    get: (v) => `${v}%`,
    set: (v) => parseFloat(v),
  },
  validity: {
    type: Date,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  minAmount: {
    type: Number,
    required: true,
  },
  maxAmount: {
    type: Number,
    required: true,
  },
});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
