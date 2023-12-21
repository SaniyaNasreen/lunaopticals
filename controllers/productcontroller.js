const User = require("../models/usermodel");
const Product = require("../models/productmodel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const { name } = require("ejs");
const mongoose = require("mongoose");
const Category = require("../models/categorymodel");

//........................................Load Product Page...............................//
const loadproducts = async (req, res) => {
  try {
    const categories = await Category.find();
    const products = await Product.find().populate("category");
    return res.render("admin/products", { products, categories });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Error loading products");
  }
};

//.....................................Add product.........................................//
const addproduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      richDescription,
      brand,
      price,
      category,
      countInStock,
      rating,
      numReviews,
    } = req.body;
    if (req.fileValidationError) {
      return res.status(400).send(req.fileValidationError);
    }

    const foundCategory = await Category.findOne({ name: category });
    if (!foundCategory) {
      console.log("Category not found or undefined");
      return res.status(404).send("Category not found or undefined");
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No file uploaded.");
    }
    const fileUrls = req.files.map(
      (file) => `http://localhost:4000/${file.path}`
    );
    const product = new Product({
      name,
      description,
      richDescription,
      images: fileUrls,
      brand,
      price,
      category: foundCategory._id,
      countInStock,
      rating,
      numReviews,
      dateCreated: Date.now(),
      is_admin: 0,
    });
    const productData = await product.save();

    if (!productData) {
      res.status(500).send("Failed to add product");
    }
    res.redirect("/admin/products?success=Product added successfully");
  } catch (error) {
    next(error);
  }
};

//......................................Updating Product....................................//
const updateproduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found.");
    }

    const categoryId = req.body.category;
    const foundCategory = await Category.findById(categoryId);
    if (!foundCategory) {
      console.log("Category not found or undefined");
      return res.status(404).send("Category not found or undefined");
    }

    if (typeof req.body.deleteImages !== "object") {
      req.body.deleteImages = [req.body.deleteImages];
    }
    if (
      req.body._delete &&
      req.body.deleteImages &&
      req.body.deleteImages.length > 0
    ) {
      const indexesToDelete = req.body.deleteImages.map((index) =>
        parseInt(index)
      );
      product.images = product.images.filter(
        (image, index) => !indexesToDelete.includes(index)
      );
    }
    product.name = req.body.name;
    product.description = req.body.description;
    product.brand = req.body.brand;
    product.price = req.body.price;
    product.category = foundCategory._id;
    if (req.files && req.files.length > 0) {
      const fileUrls = req.files.map(
        (file) => `http://localhost:4000/${file.path}`
      );
      product.images = [...product.images, ...fileUrls];
    }
    await product.save();
    res.redirect("/admin/products");
  } catch (error) {
    next(error);
  }
};

//.....................................Unlist Product..........................................//
const unlist = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      const error = "Product not found";
      error.statusCode = 404;
      throw error;
    }
    product.listed = !product.listed;
    await product.save();
    return res.redirect("/admin/products");
  } catch (error) {
    next(error);
  }
};

//.......................................Search Product..........................................//
const searchproduct = async (req, res, next) => {
  try {
    const searchquery = req.query.search || "";  
    const productData = await Product.find({
      $or: [
        { name: { $regex: searchquery } },
        { brand: { $regex: searchquery } },
        { description: { $regex: searchquery } },
        { category: { $regex: searchquery } },
      ],
    });
    res.render("admin/products", { products: productData, searchquery }); 
  } catch (error) {
    next(error);
  }
};

//...........................................Exports..............................................//
module.exports = {
  loadproducts,
  addproduct,
  updateproduct,
  searchproduct,
  unlist,
};
