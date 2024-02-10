const mongoose = require("mongoose");
const Category = require("../models/categorymodel");

const loadCategory = async (req, res, next) => {
  try {
    const categories = await Category.find();
    let sortOption = {};
    const sortQuery = req.query.sort;
    if (sortQuery === "price_asc") {
      sortOption = { price: 1 };
    } else if (sortQuery === "price_desc") {
      sortOption = { price: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const totalCategory = await Category.countDocuments();
    const sortedCategory = await Category.find().sort(sortOption).lean().exec();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedCategory = sortedCategory.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalCategory / limit);
    const currentPage = page;
    const selectedSort = sortQuery;

    res.render("admin/categories", {
      categories: categories,
      selectedSort,
      currentPage,
      totalPages,
      totalItems: totalCategory,
      categories: paginatedCategory,
      limit,
      section: "categories",
    });
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
    if (!name) {
      const error = new Error("Name is required for creating a category");
      error.statusCode = 400;
      throw error;
    }

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      const categories = await Category.find({});
      res.render("admin/categories", {
        errorWith: "CATEGORY",
        message: "Category with this name already exists",
        categories,
      });
      error.statusCode = 409;
      throw error;
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
    return res.redirect("/admin/categories");
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
