const User = require("../models/usermodel");
const Product = require("../models/productmodel");
const Admin=require("../models/adminmodel")
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const { name } = require("ejs");
const mongoose = require("mongoose");
const Category = require("../models/categorymodel");





const loadcategory = async (req, res,next) => {
    try {
      // Fetch categories from the database
      const categories = await Category.find();
      
      res.render("admin/categories", { categories }); // Pass categories data to the view
    } catch (error) {
    next(error);
    }
  };




  
// Define the route handler for fetching categories
const fetchCategories = async (req, res,next) => {
    try {
      // Fetch categories from your database or source
      const categories = await Category.find({}); // Fetch all categories, adjust query as needed
  
      // Send the categories data as a JSON response
      res.status(200).json(categories);
    } catch (error) {
     next(error);
    }
  };
  


  // const newcategoryLoad = async (req, res,next) => {
  //   try {
      
  //     res.render("admin/addcategory");
  //   } catch (error) {
  //    next(error);
  //   }
  // };
  
  const addcategory = async (req, res,next) => {
    try {
      const { name  } = req.body;
     
      // Ensure 'name' is present in the request body before creating a new category
      if (!name) {
        const error = new Error("Name is required for creating a category");
        error.statusCode = 400;
        throw error;
      }
  

       // Check if the category with the same name already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      res.render('admin/addcategory', { errorMessage: "Category with this name already exists" });
      return;
    }
      // Create a new category with the required fields
      const category = new Category({
        name: name,
        image: `http://localhost:4000/${req.file.path}`,
        // Other properties...
      });
  
      // Save the category to the database
      const categoryData = await category.save();
      if (categoryData) {
        return res.redirect("/admin/categories?success=Category added successfully");
      } else {
        const error = new Error("Failed to add category");
        error.statusCode = 500;
        throw error;
      }
    }  catch (error) {
      // Handle other errors
      next(error);
    }
  };


  const updatecategory = async (req, res, next) => {
    try {
      const categoryId = req.params.id;
      const category = await Category.findById(categoryId);
  
      if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
        const error = new Error("Invalid Category ID");
        error.statusCode = 400;
        throw error;
      }
  
      let imagePath = category.image; // Retain the existing image by default
  
      if (req.file && req.file.path) {
        imagePath = `http://localhost:4000/${req.file.path}`;
      }
  
      const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        { name: req.body.name, image: imagePath },
        { new: true }
      );
  
      if (updatedCategory) {
        res.redirect("/admin/categories");
      } else {
        res.redirect("/admin/edit-category?id=" + categoryId);
      }
    } catch (error) {
      next(error);
    }
  };





  
const unlistCategory = async (req, res) => {
    try {
      const categoryId = req.params.id; // Retrieve product ID from the URL parameter
      const category = await Category.findById(categoryId);
  
      if (!category) {
        const error=new Error("Category not found");
        error.statusCode=400;
        throw error;
      }
  
      category.listed = !category.listed;
      await category.save();
  
      // Success message or further operations after toggling the product status
      console.log(
        `Category ${category.listed ? "listed" : "unlisted"} successfully:`,
        category
      );
      // Redirect to '/admin/products' after successfully toggling the product status
      return res.redirect("/admin/categories");
    } catch (error) {
     next(error);
    }
  };
  




  const searchcategory = async (req, res) => {
    try {
      const searchquery = req.query.search || ""; // Set a default value when searchquery is not provided
  
      const categoryData = await Category.find({
        $or: [{ name: { $regex: searchquery, $options: "i" } }],
      });
  
      res.render("admin/categories", { categories: categoryData, searchquery }); // Pass searchquery to the template
    } catch (error) {
     next(error);
    }
  };




  module.exports={
    loadcategory,
    fetchCategories,
    addcategory,
     
    
  updatecategory,
  unlistCategory,
  searchcategory,
  }