const User=require("../models/usermodel")
const Product=require("../models/productmodel")
const bcrypt=require('bcrypt')
const nodemailer=require("nodemailer")
const randomstring=require("randomstring")
const { name } = require("ejs")
const mongoose=require("mongoose")
const Category = require("../models/categorymodel");
const securepassword= async(password)=>{
    try {
       const saltRounds=10;
       const passwordHash= await bcrypt.hash(password,saltRounds)
       return passwordHash
    } catch (error) {
      console.log(error.message);   
      
    }
   
   }

   const sendverifymail=async(name,email,user_id)=>{
    try {

const transporter = nodemailer.createTransport({
   service:'gmail',
 auth: {
   user:config.emailUser,     // Use environment variables
   pass:config.emailpassword // Use environment variables
 }
});

       const mailOption={
           from:"jafferkuwait0916@gmail.com",
           to: email,
           subject:'For varification mail',
           html:'<p>Hy '+name+',please click here to <a href="http://localhost:4000/verify?id='+user_id+' ">Verify </a> your mail.</p> '
       }
       transporter.sendMail(mailOption,function(error,info){
           if(error){
               console.log(error);
           }else{
               console.log("Email has been sent:-",info.response);
           }
       })
    } catch (error) {
      console.log(error.message); 
    }
}
   
const loadindex=async(req,res)=>{
    try {
         
       return res.render('admin/indexhome') 
    } catch (error) {
      console.log(error.message);  
    }
}
 





const loadproducts = async (req, res) => {
    try {
        const products = await Product.find({listed:true}); // Fetch products from the database
        return res.render('admin/products', { products }); // Pass products to the view
    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Error loading products'); // Handle error response
    }
};

const loadcategory = async (req, res) => {
    try {
        // Fetch categories from the database
        const categories = await Category.find({listed:true});
        res.render('admin/categories', { categories }); // Pass categories data to the view
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
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
      console.error('Error fetching categories:', error.message);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  };
  

const loadregister=async(req,res)=>{
    try {
         
       return res.render('users/registration') 
    } catch (error) {
      console.log(error.message);  
    }
}

const insertUser= async(req,res)=>{
    try {
        console.log(req.body)
        if (req.body.password !== req.body.confirm_password) {
            res.render('registration', {  message: "Password and Confirm Password do not match" });
            return;
          }
          
        const spassword=await securepassword(req.body.password)
        const user= new User({
            name:req.body.name,
            email:req.body.email, 
            mobile:req.body.mobile,
            password:spassword,  
            is_admin:0
          
        })
       const userData= await user.save()

       if(userData){
        sendverifymail(req.body.name,req.body.email,userData._id)
        // res.redirect('/home')
        res.render('users/login',{message:"Your regestration has been susseccfull,please verify your mail."})
       }else{
        res.render('/registration',{message:"Your registration has been failed"})
       }
    } catch (error) {
     res.send(error.message)        
    }
}

const loadcustomer=async(req,res)=>{
    try {
        const users = await User.find({listed:true});
       
       return res.render('admin/customers',{ users: users }) 
    } catch (error) {
      console.log(error.message);  
    }
}

// const loadproducts = async (req, res) => {
//     try {
//         const products = await Product.find(); // Fetch products from the database
//         return res.render('admin/products', { products }); // Pass products to the view
//     } catch (error) {
//         console.error(error.message);
//         return res.status(500).send('Error loading products'); // Handle error response
//     }
// };

const loadLogin=async(req,res)=>{
    try {
        res.render('users/login')
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin=async(req,res)=>{
    try {
        const email=req.body.email
        const password=req.body.password

        const userData = await User.findOne({email:email})
        if(userData){
          const passwordmatch=  await  bcrypt.compare(password,userData.password)

          if(passwordmatch){
            if(userData.is_admin===0){
                res.render('users/lndexhome')
            }else{
                req.session.user_id=userData._id
                res.redirect("/admin/indexhome")

            }
          }else{
            res.render('users/login',{message:"Email or password is incorrect"})
          }
        }else{
            res.render('users/login',{message:"Email or password is incorrect"})
        }
    } catch (error) {
        console.log(error.message);
    }
}
const loadDashboard=async(req,res)=>{
    try {
       const userData=await User.findById({_id:req.session.user_id})
       res.render('dashboard',{admin:userData}) 
    } catch (error) {
        console.log(error.message);
    }
}
const logout=async(req,res)=>{
    try {
        req.session.destroy()
        res.redirect('/admin')
    } catch (error) {
        console.log(error.message);
    }
}

const admindashboard=async(req,res)=>{
    try {
        const usersData=await User.find({is_admin:0})
        res.render('/dashboard',{users:usersData})
    } catch (error) {
        console.log(error.message);
    }
}

// add new user //
const newuserLoad=async(req,res)=>{
    try {
        res.render('admin/newuser')
    } catch (error) {
        console.log(error.message);
    }
}

const addUser = async (req, res) => {
    try {
        const { name, email, mobile, password, cpassword, country } = req.body;

        const spassword = await securepassword(password);

        const user = new User({
            name: name,
            email: email,
            mobile: mobile,
            password: spassword,
            cpassword: spassword,
            country: country,
            is_admin: 0 // Assuming this is the only required field for user creation
        });

        const userData = await user.save();

        if (userData) {
            res.redirect('/admin/customers');
        } else {
            res.render('admin/newuser', { message: 'Something went wrong' });
        }
    } catch (error) {
        console.log(error.message);
    }
}

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





const newcategoryLoad=async(req,res)=>{
    try {
        res.render('admin/addcategory')
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}


const addcategory = async (req, res) => {
    try {
        const { name, icon } = req.body;

        // Ensure 'name' is present in the request body before creating a new category
        if (!name) {
            return res.status(400).send('Name is required for creating a category');
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
            return res.redirect('/admin/categories?success=Category added successfully');
            
        } else {
            return res.status(500).send('Failed to add category');
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error');
    }
};


// edit user functionality //
const edituserLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await User.findById({ _id: id });

        if (userData) {
            res.render('admin/edit-user', { user: userData });
        } else {
            res.redirect('/admin/customers');
        }
    } catch (error) {
        console.log(error.message);
    }
};

const updateUsers = async (req, res) => {
    try {
        const { id, name, email, mobile } = req.body;
        const updatedUserData = await User.findByIdAndUpdate(
            { _id: id },
            { $set: { name, email, mobile } }
        );

        if (updatedUserData) {
            res.redirect('/admin/customers');
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error updating user details');
    }
};



const editproductLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const productData = await Product.findById({ _id: id });
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
      const productData=  await Product.findByIdAndUpdate({_id:req.body.id},{ $set:{image:req.body.image,name:req.body.name,description:req.body.description,richDescription:req.body.richDescription,brand:req.body.brand,price:req.body.price,category:req.body.category,dateCreated:req.body.dateCreated}})
      res.redirect('/admin/products')
    } catch (error) {
        console.log(error.message);
    }
}

const editcategoryLoad = async (req, res) => {
    try {
      const id = req.query.id;
  
      // Ensure the 'id' parameter is provided and it's a valid ObjectId
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send('Invalid Category ID');
      }
  
      const categoryData = await Category.findById(id);
      if (categoryData) {
        res.render('admin/edit-category', { category: categoryData });
      } else {
        res.redirect('/admin/categories');
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  };
  const updatecategory = async (req, res) => {
    try {
      const categoryId = req.body.id; // Assuming the ID is sent in the request body
  
      // Ensure categoryId is provided and is a valid ObjectId
      if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).send('Invalid Category ID');
      }
  
      // Retrieve category data by ID and update the fields
      const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        { name: req.body.name, icon: req.body.icon },
        { new: true } // To get the updated document after the update
      );
  
      if (updatedCategory) {
        // If the category was updated successfully, redirect to the categories page
        res.redirect('/admin/categories');
      } else {
        // If the category was not found, redirect back to the edit page or handle appropriately
        res.redirect('/admin/edit-category?id=' + categoryId);
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  };
//delete user //
const deleteUser = async (req, res) => {
    try {
        const userId = req.query.id;

        // Update the 'listed' field of the user to mark it as unlisted
        const updatedUser = await User.findByIdAndUpdate(userId, { listed: false }, { new: true });

        if (updatedUser) {
            // If the user was successfully updated, redirect or send a success response
            res.redirect('/admin/customers'); // Redirect to the customers page or any other appropriate action
        } else {
            // Handle if the user wasn't found
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


const unlistCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId; // Retrieve categoryId from URL params

        // Update the 'listed' field of the category to mark it as unlisted
        const updatedCategory = await Category.findByIdAndUpdate(categoryId, { listed: false }, { new: true });

        if (updatedCategory) {
            // If the category was successfully updated, send a success response
            res.status(200).json({ message: 'Category unlisted successfully' });
        } else {
            // Handle if the category wasn't found
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
//delete product //
const unlistProduct  = async (req, res) => {
    try {
        const productId = req.query.id;

        // Update the 'listed' field of the user to mark it as unlisted
        const updatedProduct = await Product.findByIdAndUpdate(productId, { listed: false }, { new: true });

        if (updatedProduct) {
            // If the user was successfully updated, redirect or send a success response
            res.status(200).json({ message: 'Product unlisted successfully' }); // Redirect to the customers page or any other appropriate action
        } else {
            // Handle if the user wasn't found
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

 
const searchUser = async (req, res) => {
    try {
        const searchquery = req.query.search || ''; // Set a default value when searchquery is not provided

        const userData = await User.find({
            is_admin: 0,
            $or: [
                { name: { $regex: searchquery, $options: 'i' } },
                { email: { $regex: searchquery, $options: 'i' } },
            ],
        });

        res.render('admin/customers', { users: userData, searchquery }); // Pass searchquery to the template
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const searchcategory = async (req, res) => {
    try {
        const searchquery = req.query.search || ''; // Set a default value when searchquery is not provided

        const categoryData = await Category.find({
            is_admin: 0,
            $or: [
                { name: { $regex: searchquery, $options: 'i' } },
                 
            ],
        });

        res.render('admin/categories', { categories: categoryData, searchquery }); // Pass searchquery to the template
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const searchproduct = async (req, res) => {
    try {
        const searchquery = req.query.search || ''; // Set a default value when searchquery is not provided

        const productData = await Product.find({
            is_admin: 0,
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
    loadindex,
    loadproducts,
    loadcategory,
    fetchCategories,
    loadcustomer,
    loadregister,
    insertUser,
    addproduct,
    newproductLoad,
    addcategory,
    newcategoryLoad,
    loadLogin,
    verifyLogin,
    loadDashboard,
    logout,
    admindashboard,
    newuserLoad,            
    addUser,
    edituserLoad,
    updateUsers,
    editproductLoad,
    updateproduct,
    editcategoryLoad,
    updatecategory,
    deleteUser,
    unlistCategory,
    unlistProduct,
    searchUser,
    searchcategory,
    searchproduct
}
