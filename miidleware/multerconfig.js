// const express = require("express");
// const admin_route = express.Router();
// const auth = require("../miidleware/adminauth");
// const admincontroller = require("../controllers/admincontroller");
// const productcontroller=require("../controllers/productcontroller")
// const categorycontroller=require("../controllers/categorycontroller")
// const session = require("express-session");
// const multer = require("multer");
// const Category = require("../models/categorymodel");




//   admin_route.post("/", upload.single('icon'), async (req, res) => {
//     try {
//       const { name } = req.body;
//       const iconPath = req.file.path; // Get the path of the uploaded image
  
//       // Create a new category with the provided name and the uploaded image path
//       let category = new Category({
//         name: name,
//         icon: iconPath, // Store the image path in the 'icon' field of the Category model
//         // Other properties...
//       });
  
//       category = await category.save();
  
//       if (!category) {
//         return res.status(404).send("The category cannot be created");
//       }
//       res.send(category);
//     } catch (error) {
//       console.log(error.message);
//       res.status(500).send("Internal Server Error");
//     }
//   });

  