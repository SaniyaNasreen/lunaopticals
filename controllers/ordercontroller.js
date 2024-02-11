const path = require("path");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const User = require("../models/usermodel");
const Order = require("../models/ordermodel");
const Coupon = require("../models/couponmodel");
const Offer = require("../models/offermodel");
const Wallet = require("../models/walletmodel");
const Razorpay = require("razorpay");
const instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});
const loadOrder = async (req, res, next) => {
  try {
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
    const sortedOrders = await Order.find()
      .sort(sortOption)
      .populate("purchasedItems.product")
      .sort({ date: -1 });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = sortedOrders.slice(startIndex, endIndex);
    let offer;
    let productDiscountAmount = 0;
    const user = await User.find();

    const userId = await Order.find({ _id: user._id });
    for (const order of paginatedOrders) {
      for (const purchasedItem of order.purchasedItems) {
        const product = purchasedItem.product;
        const currentDate = new Date();
        offer = await Offer.findOne({
          $and: [
            {
              $or: [
                {
                  category: product.category,
                  status: "Active",
                  validity: { $gte: new Date() },
                },
                {
                  product: product._id,
                  status: "Active",
                  validity: { $gte: new Date() },
                },
                {
                  referral: userId,
                  status: "Active",
                  validity: { $gte: new Date() },
                },
              ],
            },
            { validity: { $gte: currentDate } },
          ],
        }).populate("category", "referral");

        console.log("Product Category:", product.category);
        console.log("Found Offer:", offer);

        const coupon = await Coupon.findOne({
          category: product.category,
          validity: { $gte: currentDate },
          minAmount: { $lte: purchasedItem.price },
          maxAmount: { $gte: purchasedItem.price },
        });

        if (offer) {
          if (
            offer.referral &&
            req?.session?.userId == offer.referral.toString()
          ) {
            productDiscountAmount = (
              product.price *
              (offer.discount / 100)
            ).toFixed(2);
          } else {
            console.log("heyy", product.price);
            productDiscountAmount = (
              product.price *
              (offer.discount / 100)
            ).toFixed(2);
            console.log("discountAmount", productDiscountAmount);
          }
        }
        purchasedItem.productDiscountAmount = productDiscountAmount;
        if (order.couponApplied === true && coupon) {
          console.log("hoihoi");
          if (productDiscountAmount) {
            const couponDiscount = (
              (product.price - purchasedItem.productDiscountAmount) *
              (coupon.discount / 100)
            ).toFixed(2);
            purchasedItem.productDiscountAmount = (
              parseFloat(purchasedItem.productDiscountAmount) +
              parseFloat(couponDiscount)
            ).toFixed(2);
            console.log(
              "purchasedItem.productDiscountAmount",
              purchasedItem.productDiscountAmount
            );
          } else {
            const discount = (
              (product.price - purchasedItem.productDiscountAmount) *
              (coupon.discount / 100)
            ).toFixed(2);
            purchasedItem.productDiscountAmount = couponDiscount;
            console.log(
              "purchasedItem.productDiscountAmount",
              purchasedItem.productDiscountAmount
            );
          }
        }
      }
    }
    const totalPages = Math.ceil(totalOrders / limit);
    const currentPage = page;
    const selectedSort = sortQuery;
    res.render("admin/orders", {
      selectedSort,
      currentPage,
      totalPages,
      totalItems: totalOrders,
      orders: paginatedOrders,
      limit,
      user,
      productDiscountAmount,
      offer,
      section: "orders",
    });
  } catch (error) {
    next(error);
  }
};
const updateStatus = async (req, res, next) => {
  try {
    const { orderId, action, itemId } = req.params;
    console.log("Params:", req.params);
    console.log("Extracted values:", orderId, action, itemId);
    const order = await Order.findById(orderId);
    console.log("hey", order);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    const purchasedItem = order.purchasedItems.find(
      (item) => item._id.toString() === itemId
    );
    console.log(purchasedItem);
    console.log("0order", order.purchasedItems);
    if (!purchasedItem) {
      return res.status(404).json({ error: "Purchased item not found" });
    }

    switch (action) {
      case "markDelivered":
        purchasedItem.status = "Delivered";
        break;
      case "markReturned":
        purchasedItem.status = "Returned";
        break;
      case "markPlaced":
        purchasedItem.status = "Order Placed";
        break;
      case "markProcessing":
        purchasedItem.status = "Processing";
        break;
      case "markShipped":
        purchasedItem.status = "Shipped";
        break;
      default:
        return res.status(400).json({ error: "Invalid action" });
    }
    if (purchasedItem.status === "Delivered") {
      const paymentstatus = await Order.findByIdAndUpdate(orderId, {
        $set: { "payment.status": "Received" },
      }).populate("purchasedItems.product");
    }
    const updatedOrder = await order.save();
    console.log("hello", updatedOrder);
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
    const user = await User.findById(userId).populate("cart.product");
    const orderId = req.params.id;
    if (!orderId) {
      console.error("Order ID not found in the request");
      return res.status(404).send("Order ID not found");
    }

    const orders = await Order.find({ _id: orderId }).populate(
      "purchasedItems.product"
    );
    console.log("orders", orders);
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }
    let offer;
    let productDiscountAmount = 0;
    for (const order of orders) {
      for (const purchasedItem of order.purchasedItems) {
        const product = purchasedItem.product;
        const quantity = purchasedItem.quantity;
        const currentDate = new Date();
        offer = await Offer.findOne({
          $and: [
            {
              $or: [
                {
                  category: product.category,
                  status: "Active",
                  validity: { $gte: new Date() },
                },
                {
                  product: product._id,
                  status: "Active",
                  validity: { $gte: new Date() },
                },
                {
                  referral: userId,
                  status: "Active",
                  validity: { $gte: new Date() },
                },
              ],
            },
            { validity: { $gte: currentDate } },
          ],
        }).populate("category", "referral");

        console.log("Product Category:", product.category);
        console.log("Found Offer:", offer);

        const coupon = await Coupon.findOne({
          category: product.category,
          validity: { $gte: currentDate },
          minAmount: { $lte: purchasedItem.price },
          maxAmount: { $gte: purchasedItem.price },
        });

        if (offer) {
          if (
            offer.referral &&
            req?.session?.userId == offer.referral.toString()
          ) {
            productDiscountAmount =
              (product.price * (offer.discount / 100)).toFixed(2) * quantity;
          } else {
            console.log("heyy", product.price);
            productDiscountAmount =
              (product.price * (offer.discount / 100)).toFixed(2) * quantity;
            console.log("discountAmount", productDiscountAmount);
          }
        }
        purchasedItem.productDiscountAmount = productDiscountAmount;
        console.log(
          "purchasedItem.productDiscountAmount",
          purchasedItem.productDiscountAmount
        );
        if (order.couponApplied === true && coupon) {
          console.log("hoihoi");
          if (productDiscountAmount) {
            const couponDiscount = (
              (product.price - purchasedItem.productDiscountAmount) *
              (coupon.discount / 100)
            ).toFixed(2);
            purchasedItem.productDiscountAmount = (
              parseFloat(purchasedItem.productDiscountAmount) +
              parseFloat(couponDiscount)
            ).toFixed(2);
            console.log(
              "purchasedItem.productDiscountAmount",
              purchasedItem.productDiscountAmount
            );
          } else {
            const couponDiscount = (
              (product.price - purchasedItem.productDiscountAmount) *
              (coupon.discount / 100)
            ).toFixed(2);
            purchasedItem.productDiscountAmount = couponDiscount;
            console.log(
              "purchasedItem.productDiscountAmount",
              purchasedItem.productDiscountAmount
            );
          }
        }
      }
    }
    console.log("discountAmountcat", productDiscountAmount);
    res.render("users/orderInfo", {
      orders,
      isUserLoggedIn,
      productDiscountAmount,
      totalAmount: 0,
      user,
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
    const orders = await Order.find();
    const order = await Order.findById(orderId)
      .populate("purchasedItems.product")
      .exec();
    console.log(order);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    let offer;
    let productDiscountAmount = 0;
    const user = await User.find();

    const userId = await Order.find({ _id: user._id });
    for (const order of orders) {
      for (const purchasedItem of order.purchasedItems) {
        const product = purchasedItem.product;
        const currentDate = new Date();
        offer = await Offer.findOne({
          $and: [
            {
              $or: [
                {
                  category: product.category,
                  status: "Active",
                  validity: { $gte: new Date() },
                },
                {
                  product: product._id,
                  status: "Active",
                  validity: { $gte: new Date() },
                },
                {
                  referral: userId,
                  status: "Active",
                  validity: { $gte: new Date() },
                },
              ],
            },
            { validity: { $gte: currentDate } },
          ],
        }).populate("category", "referral");

        console.log("Product Category:", product.category);
        console.log("Found Offer:", offer);

        const coupon = await Coupon.findOne({
          category: product.category,
          validity: { $gte: currentDate },
          minAmount: { $lte: purchasedItem.price },
          maxAmount: { $gte: purchasedItem.price },
        });

        if (offer) {
          if (
            offer.referral &&
            req?.session?.userId == offer.referral.toString()
          ) {
            productDiscountAmount = (
              product.price *
              (offer.discount / 100)
            ).toFixed(2);
          } else {
            console.log("heyy", product.price);
            productDiscountAmount = (
              product.price *
              (offer.discount / 100)
            ).toFixed(2);
            console.log("discountAmount", productDiscountAmount);
          }
        }
        purchasedItem.productDiscountAmount = productDiscountAmount;
        if (order.couponApplied === true && coupon) {
          console.log("hoihoi");
          if (productDiscountAmount) {
            const couponDiscount = (
              (product.price - purchasedItem.productDiscountAmount) *
              (coupon.discount / 100)
            ).toFixed(2);
            purchasedItem.productDiscountAmount = (
              parseFloat(purchasedItem.productDiscountAmount) +
              parseFloat(couponDiscount)
            ).toFixed(2);
            console.log(
              "purchasedItem.productDiscountAmount",
              purchasedItem.productDiscountAmount
            );
          } else {
            const discount = (
              (product.price - purchasedItem.productDiscountAmount) *
              (coupon.discount / 100)
            ).toFixed(2);
            purchasedItem.productDiscountAmount = couponDiscount;
            console.log(
              "purchasedItem.productDiscountAmount",
              purchasedItem.productDiscountAmount
            );
          }
        }
      }
    }

    res.render("admin/orderInfo", {
      order,
      user,
      productDiscountAmount,
      offer,
    });
  } catch (error) {
    next(error);
  }
};

const returnOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const userId = req.user._id;
    const returnedOrder = await Order.findById(orderId).populate(
      "purchasedItems.product"
    );
    const returnedItem = returnedOrder.purchasedItems.find(
      (item) => item._id.toString() === req.params.itemId
    );
    if (!returnedOrder || !returnedItem) {
      return res.status(404).json({ message: "Order or item not found" });
    }
    if (returnedOrder.payment.status !== "Received") {
      return res
        .status(400)
        .json({ error: "Payment not received for the order" });
    }
    returnedItem.status = "Returned";
    await returnedOrder.save();
    const user = await User.findById(userId);

    const offer = await Offer.findOne({
      $or: [
        {
          category: returnedItem.category,
          status: "Active",
          validity: { $gte: new Date() },
        },
        {
          product: returnedItem._id,
          status: "Active",
          validity: { $gte: new Date() },
        },
        {
          referral: userId,
          status: "Active",
          validity: { $gte: new Date() },
        },
      ],
    }).populate("category", "referral");
    console.log("off", offer);
    if (offer) {
      const discountAmount = returnedItem.price * (offer.discount / 100);
      console.log(discountAmount);
      returnedItem.price -= discountAmount;
    }
    if (user) {
      const walletAmount = returnedItem.price * returnedItem.quantity;

      const walletDate = Date.now();
      const walletEntry = new Wallet({
        user: user,
        amount: walletAmount,
        date: walletDate,
        method: "Refund",
      });
      await walletEntry.save();
      user.wallets.push(walletEntry._id);
      await user.save();
    }

    res.redirect("/order");
  } catch (error) {
    next(error);
  }
};

const razorPayment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate("cart.product");
    console.log(user.totalAmount);
    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found");
    }
    const cart = user.cart;
    const totalAmount = user.totalAmount;
    const options = {
      amount: totalAmount * 100,
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

const walletPayment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userWallet = await Wallet.findOne({ user: userId });

    if (!userWallet) {
      console.error("Wallet not found");
      return res.status(404).json("Wallet not found");
    }

    const user = await User.findOne({ _id: userId });

    const totalAmount = user.totalAmount;

    if (userWallet.amount < totalAmount) {
      console.error("Insufficient funds in wallet");
      return res.status(400).json("Insufficient funds in wallet");
    }

    userWallet.amount -= totalAmount;
    await userWallet.save();
    res.json(userWallet.amount);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadOrder,
  updateStatus,
  loadOrderDetails,
  loadAdminOrderDetails,
  returnOrder,
  razorPayment,
  walletPayment,
};
