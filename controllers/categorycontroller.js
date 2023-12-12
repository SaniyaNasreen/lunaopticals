const User = require("../models/usermodel");
const Product = require("../models/productmodel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const { name } = require("ejs");
const mongoose = require("mongoose");
const Category = require("../models/categorymodel");





const loadcategory = async (req, res) => {
    try {
      // Fetch categories from the database
      const categories = await Category.find();
      res.render("admin/categories", { categories }); // Pass categories data to the view
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
    }
  };




  
// Define the route handler for fetching categories
const fetchCategories = async (req, res) => {
    try {
      // Fetch categories from your database or source
      const categories = await Category.find({}); // Fetch all categories, adjust query as needed
  
      // Send the categories data as a JSON response
      res.status(200).json(categories);
    } catch (error) {
      // Handle errors in case of failure
      console.error("Error fetching categories:", error.message);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  };
  


  const newcategoryLoad = async (req, res) => {
    try {
      res.render("admin/addcategory");
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
    }
  };
  
  const addcategory = async (req, res) => {
    try {
      const { name, icon } = req.body;
  
      // Ensure 'name' is present in the request body before creating a new category
      if (!name) {
        return res.status(400).send("Name is required for creating a category");
      }
  
      // Create a new category with the required fields
      const category = new Category({
        name: name,
        icon: icon,
        // Other properties...
      });
  
      // Save the category to the database
      const categoryData = await category.save();
  
      if (categoryData) {
        return res.redirect(
          "/admin/categories?success=Category added successfully"
        );
      } else {
        return res.status(500).send("Failed to add category");
      }
    } catch (error) {
      console.log(error.message);
      return res.status(500).send("Internal Server Error");
    }
  };





  const editcategoryLoad = async (req, res) => {
    try {
      const id = req.query.id;
  
      // Ensure the 'id' parameter is provided and it's a valid ObjectId
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send("Invalid Category ID");
      }
  
      const categoryData = await Category.findById(id);
      if (categoryData) {
        res.render("admin/edit-category", { category: categoryData });
      } else {
        res.redirect("/admin/categories");
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
    }
  };
  const updatecategory = async (req, res) => {
    try {
      const categoryId = req.body.id; // Assuming the ID is sent in the request body
  
      // Ensure categoryId is provided and is a valid ObjectId
      if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).send("Invalid Category ID");
      }
  
      // Retrieve category data by ID and update the fields
      const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        { name: req.body.name, icon: req.body.icon },
        { new: true } // To get the updated document after the update
      );
  
      if (updatedCategory) {
        // If the category was updated successfully, redirect to the categories page
        res.redirect("/admin/categories");
      } else {
        // If the category was not found, redirect back to the edit page or handle appropriately
        res.redirect("/admin/edit-category?id=" + categoryId);
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
    }
  };






  
const unlistCategory = async (req, res) => {
    try {
      const categoryId = req.params.id; // Retrieve product ID from the URL parameter
      const category = await Category.findById(categoryId);
  
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
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
      console.error(
        "Error occurred while toggling the product status:",
        error.message
      );
      return res.status(500).json({ message: "Internal server error" });
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
      console.log(error.message);
      res.status(500).send("Internal Server Error");
    }
  };




  module.exports={
    loadcategory,
    fetchCategories,
    addcategory,
    newcategoryLoad,
    editcategoryLoad,
  updatecategory,
  unlistCategory,
  searchcategory,
  }