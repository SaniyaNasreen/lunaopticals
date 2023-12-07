
const express = require("express");
const router = express.Router();
const multer = require("multer");
const Category = require("../models/categorymodel");

// File type map for validating uploaded images
const FILE_TYPE_MAP = {
  "/image/png": "png",
  "/image/jpeg": "jpeg",
  "/image/jpg": "jpg",
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Define the destination where uploaded category images will be stored
    cb(null, 'public/category_images'); // Update the destination folder as needed
  },
  filename: function (req, file, cb) {
    // Generate unique filenames for uploaded category images
    cb(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.split('.').pop());
  }
});


// Multer upload options
const upload = multer({ storage: storage });


// Fetch all categories using async/await

// Call the function to fetch and log category data


// router.get('/categories', async (req, res) => {
//     try {
//       const categories = await Category.find();
//       res.render('categories', { categories }); // Render 'categories.ejs' view and pass the categories data
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   });

router.get("/", async (req, res) => {
  const categoryList = await Category.find();

  if (!categoryList) {
    res.status(500).json({ success: false });
  }
  res.status(200).send(categoryList);
});


router.get("/:id", async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res
      .status(500)
      .json({ message: "The category with the given ID was not found." });
  }
  res.status(200).send(category);
});

router.post("/", upload.single('icon'), async (req, res) => {
  try {
    const { name } = req.body;
    const iconPath = req.file.path; // Get the path of the uploaded image

    // Create a new category with the provided name and the uploaded image path
    let category = new Category({
      name: name,
      icon: iconPath, // Store the image path in the 'icon' field of the Category model
      // Other properties...
    });

    category = await category.save();

    if (!category) {
      return res.status(404).send("The category cannot be created");
    }
    res.send(category);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
});


// router.put("/:id", async (req, res) => {
//   const category = await Category.findByIdAndUpdate(
//     req.params.id,
//     {
//       name: req.body.name,
//       icon: req.body.icon || category.icon,
//       color: req.body.color,
//     },
//     { new: true }
//   );
//   if (!category) return res.status(404).send("the category cannot be created!");

//   res.send(category);
// });
// Define your Category model (schema) and import necessary modules

// Route to unlist a category by ID
// router.put('/admin/categories/:categoryId/unlist', async (req, res) => {
//   try {
//     const categoryId = req.params.categoryId;

//     // Update the 'listed' field of the category to mark it as unlisted
//     const updatedCategory = await Category.findByIdAndUpdate(
//       categoryId,
//       { listed: false },
//       { new: true }
//     );

//     if (updatedCategory) {
//       res.status(200).json({ message: 'Category unlisted successfully' });
//     } else {
//       res.status(404).json({ message: 'Category not found' });
//     }
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// Assuming this is your route handler for rendering the categories view
router.get("/admin/categories", async (req, res) => {
  try {
    // Fetch categories data from the database (Category.find(), etc.)
    const categories = await Category.find();
    // Render the 'categories.ejs' template and pass the 'categories' data to it
    res.render("admin/categories", { categories });
  } catch (error) {
    // Handle errors if fetching categories fails
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


router.get("/edit-category", async (req, res) => {
  try {
    const categoryId = req.query.id; // Get the category ID from the query parameters
    // Check if categoryId is empty or undefined or not a valid ObjectId
    if (
      !categoryId ||
      typeof categoryId !== "string" ||
      !mongoose.isValidObjectId(categoryId)
    ) {
      return res.status(400).send("Invalid Category ID");
    }
    const categoryData = await Category.findById(categoryId);
    if (categoryData) {
      res.render("admin/edit-category", { category: categoryData });
    } else {
      res.redirect("/admin/categories");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
});


 

// router.delete('/:categoryId',(req,res)=>{
//     Category.findByIdAndRemove(req.params.id).then(category=>{
//         if(category){
//             return res.status(200).json({success:true,message: 'the category is deleted'})
//         }else{
//             return res.status(404).json({success: false, message:"category not found"})
//         }
//     }).catch(err=>{
//         return res.status(400).json({success:false,error:err})
//     })
// })
module.exports = router;
