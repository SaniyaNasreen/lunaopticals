const User = require("../models/usermodel");
const Product = require("../models/productmodel");
const Admin = require("../models/adminmodel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const { name } = require("ejs");
const mongoose = require("mongoose");
const Category = require("../models/categorymodel");

//...................................Load Category page.................................//
const loadcategory = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.render("admin/categories", { categories });
  } catch (error) {
    next(error);
  }
};

//.............................Fetch Category from Database..............................//
const fetchCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({});
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

//.....................................Add Category.......................................//
const addcategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      const error = new Error("Name is required for creating a category");
      error.statusCode = 400;
      throw error;
    }

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      res.render("admin/addcategory", {
        errorMessage: "Category with this name already exists",
      });
      return;
    }

    const category = new Category({
      name: name,
      image: `http://localhost:4000/${req.file.path}`,
    });
    const categoryData = await category.save();
    if (!categoryData) {
      const error = new Error("Failed to add category");
      error.statusCode = 500;
      throw error;
    }
    return res.redirect(
      "/admin/categories?success=Category added successfully"
    );
  } catch (error) {
    next(error);
  }
};

//........................... ...Updating  Category.........................................//
const updatecategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      const error = new Error("Invalid Category ID");
      error.statusCode = 400;
      throw error;
    }

    let imagePath = category.image;
    if (req.file && req.file.path) {
      imagePath = `http://localhost:4000/${req.file.path}`;
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { name: req.body.name, image: imagePath },
      { new: true }
    );
    if (!updatedCategory) {
      res.redirect("/admin/edit-category?id=" + categoryId);
    }
    res.redirect("/admin/categories");
  } catch (error) {
    next(error);
  }
};

//.....................................Unlist Category.....................................//
const unlistCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);
    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 400;
      throw error;
    }
    category.listed = !category.listed;
    await category.save();
    return res.redirect("/admin/categories");
  } catch (error) {
    next(error);
  }
};

//....................................Search Category........................................//
const searchcategory = async (req, res) => {
  try {
    const searchquery = req.query.search || "";
    const categoryData = await Category.find({
      $or: [{ name: { $regex: searchquery, $options: "i" } }],
    });
    res.render("admin/categories", { categories: categoryData, searchquery });
  } catch (error) {
    next(error);
  }
};

//........................................Exports..............................................//
module.exports = {
  loadcategory,
  fetchCategories,
  addcategory,
  updatecategory,
  unlistCategory,
  searchcategory,
};
