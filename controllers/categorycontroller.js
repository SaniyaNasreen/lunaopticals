const mongoose = require("mongoose");
const Category = require("../models/categorymodel");

const loadCategory = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.render("admin/categories", { categories });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({});
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

const addCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const imagePath = req.file.path;
    if (!name) {
      const error = new Error("Name is required for creating a category");
      error.statusCode = 400;
      throw error;
    }

    console.log("Request Body:", req.body);
    console.log("File Path:", req.file.path);

    const existingCategoryByName = await Category.findOne({ name });
    if (existingCategoryByName) {
      return res.render("admin/addcategory", {
        errorMessage: "Category with this name already exists",
      });
    }

    const existingCategoryByImage = await Category.findOne({
      image: imagePath,
    });
    if (existingCategoryByImage) {
      return res.render("admin/addcategory", {
        errorMessage: "Category with this image already exists",
      });
    }

    const category = new Category({
      name: name,
      image: imagePath,
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

const updateCategory = async (req, res, next) => {
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
    if (error.code === 11000) {
      res
        .status(400)
        .send("Category with the same name or image already exists.");
    } else {
      next(error);
    }
  }
};

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

const searchCategory = async (req, res) => {
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

module.exports = {
  loadCategory,
  getCategories,
  addCategory,
  updateCategory,
  unlistCategory,
  searchCategory,
};
