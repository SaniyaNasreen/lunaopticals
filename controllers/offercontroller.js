const Coupon = require("../models/couponmodel");
const Category = require("../models/categorymodel");
const Order = require("../models/ordermodel");
const Offer = require("../models/offermodel");
const Product = require("../models/productmodel");
const User = require("../models/usermodel");
const productmodel = require("../models/productmodel");
const mongoose = require("mongoose");

const loadOffer = async (req, res, next) => {
  try {
    const categories = await Category.find();
    const products = await Product.find();
    const offers = await Offer.find({
      $and: [{ $or: [{ referral: null }] }, { type: { $ne: "admin" } }],
    })
      .populate({
        path: "category",
        model: "Category",
        select: "name image",
      })
      .populate({
        path: "product",
        model: "Product",
        select: "name image",
      })
      .exec();
    const status = {
      enum: ["Active", "In Active"],
    };
    res.render("admin/offer", {
      categories: categories,
      products: products,
      status,
      offers,
      section: "offers",
    });
  } catch (error) {
    next(error);
  }
};
const addOffer = async (req, res, next) => {
  console.log("hello");
  try {
    const categories = await Category.find();
    const products = await Product.find();
    const offers = await Offer.find().populate("category", "product");
    const { name, description, status, validity, discount, category, product } =
      req.body;
    console.log(req.body);
    const currentDate = new Date();
    const validityDate = new Date(validity);
    if (validityDate <= currentDate) {
      return res.render("admin/offer", {
        categories,
        offers,
        products,
        section: "offers",
        errorWith: "DATE",
        message: "Validity date should not be less than the current date",
      });
    }

    const foundCategory = await Category.findById(category);
    if (!foundCategory) {
      return res.render("admin/offer", {
        categories,
        products,
        section: "offers",
        offers,
        errorWith: "CATEGORY",
        message: "Category not found",
      });
    }

    console.log(foundCategory);

    const foundProduct = await Product.findById(product);
    if (!foundProduct) {
      return res.render("admin/offer", {
        categories,
        products,
        offers,
        section: "offers",
        errorWith: "PRODUCT",
        message: "Product not found",
      });
    }
    console.log(foundProduct);

    const categoryOffer = new Offer({
      name,
      description,
      status,
      validity,
      discount,
      category: foundCategory._id,
    });
    const savedCategoryOffer = await categoryOffer.save();

    const productOffer = new Offer({
      name,
      description,
      status,
      validity,
      discount,
      product: foundProduct._id,
    });
    const savedProductOffer = await productOffer.save();

    return res.render("admin/offer", {
      categoryOffer: savedCategoryOffer,
      productOffer: savedProductOffer,
      products,
      categories,
      offers,
      section: "offers",
    });
  } catch (error) {
    next(error);
  }
};

const editOffer = async (req, res, next) => {
  try {
    const offerId = req.params.id;
    const offer = await Offer.findById(offerId)
      .populate("category")
      .populate("product");

    if (!offer) {
      return res.status(404).send("Offer not found.");
    }
    const categoryId = req.body.category;
    const foundCategory = await Category.findOne({ _id: categoryId });

    if (!foundCategory) {
      console.log("Category not found or undefined");
      return res.status(404).send("Category not found or undefined");
    }
    if (offer.category) {
      const categoryOffer = await Offer.findOne({ category: offer.category });
      if (!categoryOffer) {
        return res.status(404).send("Category offer not found.");
      }
      categoryOffer.name = req.body.name;
      categoryOffer.description = req.body.description;
      categoryOffer.status = req.body.status;
      categoryOffer.discount = req.body.discount;
      categoryOffer.category = foundCategory._id;
      await categoryOffer.save();
    }

    const productId = req.body.product;
    console.log("productId", productId);
    const foundProduct = await Product.findOne({ _id: productId });
    console.log("foundproduct", foundProduct);

    if (!foundProduct) {
      console.log("Product not found or undefined");
      return res.status(404).send("Product not found or undefined");
    }

    if (offer.product) {
      const productOffer = await Offer.findOne({ product: offer.product });
      console.log("productoffer", productOffer);

      if (!productOffer) {
        console.log("Product offer not found for ID:", productId);
        return res.status(404).send("Product offer not found.");
      }

      productOffer.name = req.body.name;
      productOffer.description = req.body.description;
      productOffer.status = req.body.status;
      productOffer.discount = req.body.discount;
      productOffer.product = foundProduct._id;
      await productOffer.save();
    }

    console.log("Offers updated successfully");
    res.redirect("/admin/offer");
  } catch (error) {
    next(error);
  }
};

const loadUserOffer = async (req, res, next) => {
  try {
    let isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }
    const userId = req.session.user_id;
    const currentDate = new Date();
    const offers = await Offer.find({
      $and: [
        {
          $or: [{ referral: null }, { referral: userId }],
        },
        { validity: { $gte: currentDate } },
      ],
    })
      .populate({
        path: "category",
        model: "Category",
        select: "name image",
      })
      .populate({ path: "product", select: "name images" })
      .populate("referral")
      .exec();

    if (!offers) {
      const error = "Offer not found";
      error.statusCode = 404;
      throw error;
    }

    const categoryIds = [
      ...new Set(offers.map((offer) => offer.category && offer.category._id)),
    ];
    const categoryObjectIds = categoryIds.map(
      (categoryId) => new mongoose.Types.ObjectId(categoryId)
    );
    const products = await Product.find({
      category: { $in: categoryObjectIds },
    })
      .populate("category")
      .exec();
    res.render("users/offers", {
      isUserLoggedIn,
      offers: offers,
      products,
    });
  } catch (error) {
    next(error);
  }
};

const offerShopList = async (req, res, next) => {
  try {
    let isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }
    let sortOption = {};
    const sortQuery = req.query.sort;
    if (sortQuery === "price_asc") {
      sortOption = { price: 1 };
    } else if (sortQuery === "price_desc") {
      sortOption = { price: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    let filter = { listed: true };
    let categoryFilter = {};
    if (req.query.category) {
      const category = await Category.findOne({
        name: req.query.category,
      });

      if (category) {
        filter.category = category._id;
        categoryFilter = { category: category._id };
      } else {
        filter = { listed: true };
      }
    }

    const totalProducts = await Product.countDocuments(filter);
    const sortedProducts = await Product.find(filter)
      .populate("category")
      .sort(sortOption)
      .lean()
      .exec();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedProducts = sortedProducts.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalProducts / limit);
    const currentPage = page;
    const selectedSort = sortQuery;
    const offerCategoryName = req.params.offerCategory;
    console.log(offerCategoryName);
    const category = await Category.findOne({ name: offerCategoryName });
    console.log(category);
    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      throw error;
    }

    const productsForOfferCategory = await Product.find({
      category: category._id,
    })
      .populate("category")
      .lean()
      .exec();

    res.render("users/shop-list", {
      products: productsForOfferCategory,
      offerCategory: offerCategoryName,
      isUserLoggedIn,
      category,
      is_blocked: false,
      selectedSort,
      currentPage,
      totalPages,
      totalItems: totalProducts,
      limit,
      categoryFilter,
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  loadOffer,
  offerShopList,
  addOffer,
  editOffer,
  loadUserOffer,
};
