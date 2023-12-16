const User=require("../models/usermodel")
const Product=require("../models/productmodel")
const bcrypt=require('bcrypt')
const nodemailer=require("nodemailer")
const randomstring=require("randomstring")
const { name } = require("ejs")
const mongoose=require("mongoose")
const Category = require("../models/categorymodel");
const multer = require("multer");



 
  
 



const loadproducts = async (req, res) => {
    try {
        const products = await Product.find().populate('category'); // Populate the 'category' field
        return res.render('admin/products', { products }); // Pass products with populated category to the view
    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Error loading products'); // Handle error response
    }
};





// Add product //



const newproductLoad = async (req, res, next) => {
    try {
        const categories = await Category.find();
        const products = await Product.find().populate('category'); // Populate the 'category' field    
        res.render('admin/addproduct',{categories});
    } catch (error) {
        console.log(error.message);
        next(error); // Pass the error to Express error handling middleware
    }
};


const addproduct=async(req,res,next)=>{
 
    try {
        console.log(req.body)
         

        // Destructure fields from req.body
        const {
            name,
            description,
            richDescription,
             
            brand,
            price,
           category,
            countInStock,
            rating,
            numReviews
              // Assuming req.body.category  is the ID of the selected category
        } = req.body;
   
        if (req.fileValidationError) {
            return res.status(400).send(req.fileValidationError); // Return validation error
          }    
      // Find the category by name to get its ID
const foundCategory = await Category.findOne({ name: category});
   

      
if (!foundCategory) {
    console.log('Category not found or undefined');
    return res.status(404).send('Category not found or undefined');
}


 
if (!req.files || req.files.length === 0) {
    return res.status(400).send('No file uploaded.'); // Handle when no file is uploaded
  }

const fileUrls = req.files.map(file => `http://localhost:4000/${file.path}`);

// $addToSet: {images:{$each:fileUrls}},        
        const product = new Product({
            name,
            description,
            richDescription,
            images:fileUrls, 
            brand,
            price,
            category: foundCategory._id,// Assign the found category's ID
            countInStock,
            rating,
            numReviews,
            dateCreated: Date.now(),
            is_admin: 0 // Assuming this field is intended for something specific
        });
        
        const productData=await product.save()

      
    
      
      if(productData){
        console.log('Product added:', productData); // Log the added product data
        res.redirect('/admin/products?success=Product added successfully');
    }else{
        res.status(500).send('Failed to add product');
    }
    } catch (error) {
      next(error);
    }
  };
  





const editproductLoad = async (req, res,next) => {
    try {
        const id = req.params.id;// Retrieve the 'id' query parameter
        const productData = await Product.findById(id); // Use the 'id' directly
        if (productData) {
            res.render('admin/edit-product', { product: productData });
        } else {
            res.redirect('/admin/products');
        }
    } catch (error) {
      next(error);
    }
};
const updateproduct=async(req,res,next)=>{
    try {
         
     const productId = req.params.id;
     const product = await Product.findById(productId);

     if (!product) {
        return res.status(404).send('Product not found.');
      }

      console.log(req.body.deleteImages);
      if(typeof req.body.deleteImages!=="object"){
        req.body.deleteImages=[req.body.deleteImages]
      }
      if (req.body._delete && req.body.deleteImages && req.body.deleteImages.length > 0) {
       
        const indexesToDelete = req.body.deleteImages.map(index => parseInt(index));
        product.images = product.images.filter((image, index) => !indexesToDelete.includes(index));
      }
      
      product.name = req.body.name;
      product.description = req.body.description;
      product.brand=req.body.brand;
      product.price=req.body.price;
      product.category=req.body.category;
      // ... (update other fields accordingly)
  
      if (req.files && req.files.length > 0) {
        const fileUrls = req.files.map(file => `http://localhost:4000/${file.path}`);
        product.images = [...product.images,...fileUrls];
      }
  
     


             
    

      await product.save();
      res.redirect('/admin/products')
    } catch (error) {
       next(error);
    }
}

 


const unlist = async (req, res,next) => {
    try {
        const productId = req.params.id; // Retrieve product ID from the URL parameter
        const product = await Product.findById(productId);
    
        if (!product) {
         
          const error=("Product not found");
          error.statusCode = 404;
          throw error;
        }
    
        // Toggle the 'listed' field between true and false
        product.listed = !product.listed;
        await product.save();
    
        // Success message or further operations after toggling the product status
        console.log(`Product ${product.listed ? 'listed' : 'unlisted'} successfully:`, product);
        // Redirect to '/admin/products' after successfully toggling the product status
        return res.redirect('/admin/products');
      } catch (error) {
       next(error);
      }
    };




    const searchproduct = async (req, res,next) => {
        try {
            const searchquery = req.query.search || ''; // Set a default value when searchquery is not provided

            const productData = await Product.find({
                
                $or: [
                
                    { name: { $regex: searchquery, $options: 'i' } },
                    { brand: { $regex: searchquery, $options: 'i' } },
                    { description: { $regex: searchquery, $options: 'i' } },
                    { category: { $regex: searchquery, $options: 'i' } },
                    
                ],
            });

            res.render('admin/products', { products: productData, searchquery }); // Pass searchquery to the template
        } catch (error) {
         next(error);
        }
    };



module.exports={
    loadproducts,
    addproduct,
    newproductLoad,
    editproductLoad,
     
    updateproduct,
    searchproduct,
    unlist
}    