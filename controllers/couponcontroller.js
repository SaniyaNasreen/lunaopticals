const Coupon = require("../models/couponmodel");
const Category = require("../models/categorymodel");
const Order = require("../models/ordermodel");
const Offer = require("../models/offermodel");
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
      section: "coupons",
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
    res.redirect("/admin/coupon?success=Coupon added successfully");
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
  try {
    let isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }
    const userId = req.session.user_id;
    const user = await User.findById(userId).populate("cart.product");
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    const usercart = user.cart;

    let hasOffer;
    const { code } = req.body;
    req.session.couponCode = code;
    const coupon = await Coupon.findOne({ code: code });
    console.log("coup", coupon.category);
    if (!coupon) {
      console.log("Coupon not found");
      return res.redirect("/users/checkout");
    }
    const categoryMatched = usercart.filter((cartItem) => {
      if (cartItem.product.category === coupon.category) {
        console.log(cartItem.product.category);
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

    const currentDate = new Date();
    if (currentDate > coupon.validity) {
      console.log("Coupon has expired");
      return res.status(400).json({ message: "Coupon has expired" });
    }
    const order = await Order.find({ _id: userId });

    const discountPercentage = coupon.discount
      ? parseFloat(coupon.discount) / 100
      : 0;
    const cartItems = user.cart;
    let subtotal = user.cart.reduce((sum, cartItem) => {
      return sum + cartItem.total;
    }, 0);
    console.log("copsub", subtotal);
    let discountAmount = 0;
    const cart = user.cart;
    let offer;
    for (const cartItem of user.cart) {
      const product = cartItem.product;
      const quantity = cartItem.quantity;
      const currentDate = new Date();
      const offer = await Offer.findOne({
        $and: [
          {
            $or: [
              {
                category: product.category,
                status: "Active",
                validity: { $gte: new Date() },
              },
              {
                product: product,
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

      if (offer) {
        if (
          offer.referral &&
          req?.session?.userId == offer.referral.toString()
        ) {
          discountAmount = (product.price * (offer.discount / 100)).toFixed(2);
        } else {
          console.log("heyy", product.price);
          discountAmount = (product.price * (offer.discount / 100)).toFixed(2);
          console.log("discountAmount", discountAmount);
          subtotal = subtotal - discountAmount;

          console.log("copsub1", subtotal);
        }
        cartItem.discountAmount = discountAmount;
      }

      let totalPrice = 0;
      if (req.body.code && coupon.status === "Active") {
        totalPrice = subtotal - cartItem.discountAmount;
        user.totalAmount = user.totalAmount - totalPrice;
      } else {
        let Shipping = 0;
        if (subtotal < 2000) {
          Shipping = 100;
        } else {
          Shipping = 0;
        }
        totalPrice = hasOffer ? subtotal : subtotal + Shipping;
        user.totalAmount = totalPrice;
      }

      await user.save();
      cartItem.product.couponApplied = true;
      await cartItem.product.save();
    }

    let Shipping = 0;
    if (subtotal < 2000) {
      Shipping = 100;
    } else {
      Shipping = 0;
    }
    const discountPrice = subtotal * discountPercentage;
    let totalPrice = subtotal - discountPrice + Shipping;
    user.totalAmount = totalPrice;
    console.log("discountPrice", discountPrice);
    console.log("discountAmount", discountAmount);
    console.log("total", totalPrice);
    const couponAlreadyApplied = user.couponApplied;

    if (coupon.status !== "Active") {
      console.log("Coupon not found");
      return res.redirect("users/checkout");
    }

    await user.save();
    console.log("Coupon applied successfully");
    res.render("users/checkout", {
      coupon,
      discountPercentage,
      categoryMatched,
      subtotal,
      discountPrice,
      couponAlreadyApplied,
      order,
      listed: true,
      user,
      isUserLoggedIn,
      userCart: user.cart,
      req,
      userAddresses: user.address,
      selectedAddress: req.body.selectedAddress || user.address[0],
      Shipping,
      discountAmount,
      hasOffer: discountAmount > 0,
      totalPrice,
      offer,
      couponCode: req.session.couponCode,
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
