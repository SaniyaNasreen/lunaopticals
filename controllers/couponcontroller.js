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
    res.render("admin/coupon", { categories, status, coupons });
  } catch (error) {
    next(error);
  }
};

const addCouponForCategory = async (req, res, next) => {
  try {
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
    const categoryId = req.body.category;
    const foundCategory = await Category.findById(categoryId);
    if (!foundCategory) {
      console.log("Category not found or undefined");
      return res.status(404).send("Category not found or undefined");
    }

    console.log(foundCategory);

    // Create the coupon for the specified category
    const newCoupon = new Coupon({
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
    const categoryId = req.body.category;
    const foundCategory = await Category.find(categoryId);
    if (!foundCategory) {
      console.log("Category not found or undefined");
      return res.status(404).send("Category not found or undefined");
    }

    console.log(foundCategory);
    const updatedCoupon = {
      name,
      code,
      status,
      validity,
      discount,
      category: foundCategory._id,
      minAmount,
      maxAmount,
    };

    const coupons = await Coupon.findById(couponId);
    const couponToUpdate = await Coupon.findByIdAndUpdate(
      couponId,
      updatedCoupon,
      { new: true }
    );

    if (!couponToUpdate) {
      console.error("Coupon not found");
      return res.status(404).send("Coupon not found");
    }

    console.log("Coupon updated successfully:", couponToUpdate);
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
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code: code });

    if (!coupon) {
      console.log("Coupon not found");
      return res.status(404).json({ message: "Coupon not found" });
    }

    const currentDate = new Date();
    if (currentDate > coupon.validity) {
      console.log("Coupon has expired");
      return res.status(400).json({ message: "Coupon has expired" });
    }
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    const cartItems = user.cart;

    if (!cartItems || cartItems.length === 0) {
      console.log("Cart is empty");
      return res.status(400).json({ message: "Cart is empty" });
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

    const order = await Order.find({ _id: userId });
    if (user?.cart?.length <= 0) {
      res.render("users/shop-cart", {
        user,
        isUserLoggedIn,
        emptyCart: true,
        listed: true,
      });
    }
    let subtotal = 0;
    for (const cartItem of user.cart) {
      subtotal += cartItem.product.price * cartItem.quantity;
    }
    const discountPercentage = coupon.discount
      ? parseFloat(coupon.discount) / 100
      : 0;
    const discountAmount = subtotal * discountPercentage;
    const total = subtotal - discountAmount;
    user.couponApplied = true;
    await user.save();
    console.log("Coupon applied successfully");
    res.render("users/checkout", {
      coupon,
      discountPercentage,
      subtotal,
      discountAmount,
      total,
      order,
      listed: true,
      user,
      isUserLoggedIn,
      userCart: user.cart,
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
