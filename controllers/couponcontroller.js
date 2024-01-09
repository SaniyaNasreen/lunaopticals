const Coupon = require("../models/couponmodel");
const Category = require("../models/categorymodel");
const Order = require("../models/ordermodel");
const User = require("../models/usermodel");
const loadCoupon = async (req, res, next) => {
  try {
    const categories = await Category.find();
    const coupons = await Coupon.find().populate("category");
    const status = {
      enum: ["Active", "In Active"],
    };
    res.render("admin/coupon", {
      categories,
      status,
      coupons,
    });
  } catch (error) {
    next(error);
  }
};

const addCouponForCategory = async (req, res, next) => {
  try {
    const categories = await Category.find();
    const coupons = await Coupon.find().populate("category");
    const {
      name,
      code,
      status,
      validity,
      discount,
      category,
      minAmount,
      maxAmount,
    } = req.body;
    console.log(req.body);
    const currentDate = new Date();
    const validityDate = new Date(validity);
    if (validityDate <= currentDate) {
      return res.render("admin/coupon", {
        categories,
        coupons,
        errorWith: "DATE",
        message: "Validity date should not be less than current date",
      });
    }

    if (minAmount >= maxAmount) {
      return res.render("admin/coupon", {
        categories,
        coupons,
        errorWith: "AMOUNT",
        message: "Minimum amount should be less than maximum amount",
      });
    }

    const foundCategory = await Category.findById(category);
    if (!foundCategory) {
      return res.render("admin/coupon", {
        categories,
        coupons,
        errorWith: "CATEGORY",
        message: "Category not found",
      });
    }
    console.log(foundCategory);
    const newCoupon = new Coupon({
      categories,
      name,
      code,
      status,
      validity,
      discount,
      category: foundCategory._id,
      minAmount,
      maxAmount,
    });
    const savedCoupon = await newCoupon.save();
    res.json({ message: "Coupon added successfully", coupon: savedCoupon });
  } catch (error) {
    next(error);
  }
};

const editCouponForCategory = async (req, res, next) => {
  try {
    const couponId = req.params.id;
    const coupon = await Coupon.findById(couponId).populate("category");
    if (!coupon) {
      return res.status(404).send("Coupon not found.");
    }
    const categoryId = req.body.category;
    const foundCategory = await Category.findOne({ _id: categoryId });
    if (!foundCategory) {
      console.log("Category not found or undefined");
      return res.status(404).send("Category not found or undefined");
    }

    console.log(req.body);
    coupon.name = req.body.name;
    coupon.status = req.body.status;
    coupon.discount = req.body.discount;
    coupon.category = foundCategory._id;
    coupon.minAmount = req.body.minAmount;
    coupon.maxAmount = req.body.maxAmount;
    await coupon.save();
    console.log("Coupon updated successfully:", coupon);
    res.redirect("/admin/coupon");
  } catch (error) {
    next(error);
  }
};

const applyCoupon = async (req, res, next) => {
  console.log("applyCoupon function triggered");
  try {
    let isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }
    const userId = req.user._id;
    const user = await User.findById(userId).populate("cart.product");
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }
    const usercart = user.cart;
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code: code });
    if (!coupon) {
      console.log("Coupon not found");
      return res.render("users/checkout", {
        isUserLoggedIn,
        coupon,
        req,
        userCart: usercart,
        errorWith: "COUPON",
        message: "Coupon not found",
        showModal: true,
      });
    }
    const categoryMatched = user.cart.filter((cartItem) => {
      if (cartItem.product.category === coupon.category) {
        console.log(`Category matched for product: ${cartItem.product.name}`);
        return true;
      }
      return false;
    });
    console.log(categoryMatched);
    if (!categoryMatched) {
      console.log("Coupon not applicable to items in the cart");
      return res
        .status(400)
        .json({ message: "Coupon not applicable to items in the cart" });
    }

    if (coupon.status !== "Active") {
      console.log("Coupon not found");
      return res.render("users/checkout", {
        isUserLoggedIn,
        req,
        coupon,
        categoryMatched,
        userCart: usercart,
        errorWith: "COUPON",
        message: "Coupon not found",
        showModal: true,
      });
    }
    const currentDate = new Date();
    if (currentDate > coupon.validity) {
      console.log("Coupon has expired");
      return res.status(400).json({ message: "Coupon has expired" });
    }
    const cartItems = user.cart;

    if (!cartItems || cartItems.length === 0) {
      console.log("Cart is empty");
      return res.status(400).json({ message: "Cart is empty" });
    }
    const order = await Order.find({ _id: userId });
    if (user?.cart?.length <= 0) {
      res.render("users/shop-cart", {
        user,
        isUserLoggedIn,
        emptyCart: true,
        listed: true,
      });
    }
    const updatedUser = await User.findById(userId).populate("cart.product");
    const discountPercentage = coupon.discount
      ? parseFloat(coupon.discount) / 100
      : 0;
    let subtotal = 0;
    let updatedSubtotal = 0;
    for (const cartItem of updatedUser.cart) {
      updatedSubtotal += cartItem.product.price * cartItem.quantity;
    }
    const discountAmount = updatedSubtotal * discountPercentage;
    const total = updatedSubtotal - discountAmount;
    const couponAlreadyApplied = user.couponApplied;
    await user.save();
    console.log("Coupon applied successfully");
    res.render("users/checkout", {
      coupon,
      discountPercentage,
      categoryMatched,
      subtotal: updatedSubtotal,
      discountAmount,
      couponAlreadyApplied,
      total,
      order,
      listed: true,
      user: updatedUser,
      isUserLoggedIn,
      userCart: updatedUser.cart,
      req,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = {
  loadCoupon,
  applyCoupon,
  addCouponForCategory,
  editCouponForCategory,
};
