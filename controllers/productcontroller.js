const User=require("../models/usermodel")
const Product=require("../models/productmodel")
const bcrypt=require('bcrypt')
const nodemailer=require("nodemailer")
const randomstring=require("randomstring")
const { name } = require("ejs")
const mongoose=require("mongoose")
const Category = require("../models/categorymodel");



const loadproducts = async (req, res) => {
    try {
        const products = await Product.find(); // Fetch products from the database
        return res.render('admin/products', { products }); // Pass products to the view
    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Error loading products'); // Handle error response
    }
};





// Add product //



const newproductLoad=async(req,res)=>{
    try {
        res.render('admin/addproduct')
    } catch (error) {
        console.log(error.message);
    }
}


const addproduct=async(req,res)=>{
    console.log(req.body)
    try {
        const name=req.body.name
        const description=req.body.description
        const richDescription=req.body.richDescription
        const image=req.body.image
        const images=req.body.images
        const brand =req.body.brand
        const price=req.body.price
              const countInStock=req.body.countInStock
        const rating=req.body.rating
        const numReviews=req.body.numReviews
        const dateCreated=req.body.dateCreated
        const category = await Category.findOne({ name: req.body.category });
if (!category) {
    console.log('Category not found or undefined');
}
  
         

        

        // const spassword=await securepassword(password)

        const product= new Product({
            name:name,
             description:description,
             richDescription:richDescription,
             image:image,
             images:images,
             brand :brand,
             price:price,
             category: category,
             countInStock: 30,
              rating:rating,
             numReviews:numReviews,
              dateCreated:new Date(),
            
            is_admin:0
        })

        const productData=await product.save()

        if(productData){

            res.redirect('/admin/products?success=Product added successfully');
        }else{
            res.status(500).send('Failed to add product');
        }
    } catch (error) {
       console.log(error.message); 
       res.status(500).send('Internal Server Error');
    }
}





const editproductLoad = async (req, res) => {
    try {
        const id = req.params.id;// Retrieve the 'id' query parameter
        const productData = await Product.findById(id); // Use the 'id' directly
        if (productData) {
            res.render('admin/edit-product', { product: productData });
        } else {
            res.redirect('/admin/products');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};
const updateproduct=async(req,res)=>{
    try {
        const productId = req.params.id;
      const productData=  await Product.findByIdAndUpdate({_id: productId },{ $set:{image:req.body.image,name:req.body.name,description:req.body.description,richDescription:req.body.richDescription,brand:req.body.brand,price:req.body.price,category:req.body.category,dateCreated:req.body.dateCreated}})
      res.redirect('/admin/products')
    } catch (error) {
        console.log(error.message);
    }
}




const unlist = async (req, res) => {
    try {
        const productId = req.params.id; // Retrieve product ID from the URL parameter
        const product = await Product.findById(productId);
    
        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }
    
        // Toggle the 'listed' field between true and false
        product.listed = !product.listed;
        await product.save();
    
        // Success message or further operations after toggling the product status
        console.log(`Product ${product.listed ? 'listed' : 'unlisted'} successfully:`, product);
        // Redirect to '/admin/products' after successfully toggling the product status
        return res.redirect('/admin/products');
      } catch (error) {
        console.error('Error occurred while toggling the product status:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
      }
    };




    const searchproduct = async (req, res) => {
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
            console.log(error.message);
            res.status(500).send('Internal Server Error');
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