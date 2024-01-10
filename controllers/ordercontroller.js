const path = require("path");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const User = require("../models/usermodel");
const Order = require("../models/ordermodel");
const Razorpay = require("razorpay");
const instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});
const { upload, cropToSquare } = require("../utils/multer");
const loadOrder = async (req, res, next) => {
  try {
    const orders = await Order.find().populate("purchasedItems.product");
    let sortOption = {};
    const sortQuery = req.query.sort;
    if (sortQuery === "price_asc") {
      sortOption = { price: 1 };
    } else if (sortQuery === "price_desc") {
      sortOption = { price: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const totalOrders = await Order.countDocuments();
    const sortedOrders = await Order.find().sort(sortOption).lean().exec();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = sortedOrders.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalOrders / limit);
    const currentPage = page;
    const selectedSort = sortQuery;
    res.render("admin/orders", {
      orders,
      selectedSort,
      currentPage,
      totalPages,
      totalItems: totalOrders,
      orders: paginatedOrders,
      limit,
    });
  } catch (error) {
    next(error);
  }
};
const updateStatus = async (req, res, next) => {
  try {
    const { orderId, action } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    switch (action) {
      case "markDelivered":
        order.status = "Delivered";
        break;
      case "markPaid":
        order.status = "Received";
        break;
      case "markonHold":
        order.status = "On Hold";
        break;
      case "markRejected":
        order.status = "Rejected";
        break;
      case "markPlaced":
        order.status = "Order Placed";
        break;
      case "markProcessing":
        order.status = "Processing";
        break;
      default:
        return res.status(400).json({ error: "Invalid action" });
    }
    const updatedOrder = await order.save();
    const user = await User.findOne({ "order._id": orderId });
    if (user) {
      const userOrder = user.order.find(
        (uOrder) => uOrder._id.toString() === orderId
      );
      if (userOrder) {
        userOrder.status = updatedOrder.status;
        await user.save();
      }
    }
    res.redirect("/admin/orders");
  } catch (error) {
    next(error);
  }
};

const loadOrderDetails = async (req, res, next) => {
  try {
    let isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }
    const userId = req.user?._id;
    if (!userId) {
      console.error("User ID not found in the request");
      return res.status(404).send("User ID not found");
    }
    const orderId = req.params.id;
    if (!orderId) {
      console.error("Order ID not found in the request");
      return res.status(404).send("Order ID not found");
    }

    const orders = await Order.find({ _id: orderId }).populate(
      "purchasedItems.product"
    );

    if (!orders) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.render("users/orderInfo", {
      orders,
      isUserLoggedIn,
    });
  } catch (error) {
    next(error);
  }
};

const loadAdminOrderDetails = async (req, res, next) => {
  try {
    console.log(req.params);
    const orderId = req.params.id;
    if (!orderId) {
      console.error("Order ID not found in the request");
      return res
        .status(400)
        .json({ error: "Order ID not found in the request" });
    }

    const order = await Order.findById(orderId)
      .populate("purchasedItems.product")
      .exec();
    console.log(order);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.render("admin/orderInfo", {
      order,
    });
  } catch (error) {
    next(error);
  }
};

const razorPayment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate("cart.product");
    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found");
    }
    const cart = user.cart;
    const options = {
      amount: cart[0].product.price * 100,
      currency: "INR",
      receipt: "receipt_order_1",
      payment_capture: 1,
    };
    instance.orders.create(options, function (err, order) {
      console.log(order);
      res.json(order);
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  loadOrder,
  updateStatus,
  loadOrderDetails,
  loadAdminOrderDetails,
  razorPayment,
};
