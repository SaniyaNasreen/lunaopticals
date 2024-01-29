const mongoose = require("mongoose");
const { Number } = require("twilio/lib/twiml/VoiceResponse");

const offerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
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
  },
  validity: {
    type: Date,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  referral: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Offer = mongoose.model("Offer", offerSchema);

module.exports = Offer;
