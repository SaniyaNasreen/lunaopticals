    const express=require("express")
    const  Product  = require("../models/productmodel")
    const { Category } = require("../models/categorymodel")
    const router =express.Router()
    const multer=require("multer")



    const FILE_TYPE_MAP ={
        '/image/png':'png',
        '/image/jpeg':'jpeg',
        '/image/jpg':'jpg',
    }


    const storage=multer.diskStorage({
        destination:function(req,file,cb){
            const isValid=FILE_TYPE_MAP[file.mimetype]
            let uploadError=new Error('invalid image type')
            if(isValid){
                uploadError=null
            }
            cb(uploadError,'public/uploads')
        },
        filename:function(req,file,cb){
            const fileName=file.originalname.split(' ').join('_')
            const extension= FILE_TYPE_MAP[file.mimetype]
            cb(null,`${fileName}-${Date.now()},${extension}`)
        }
    })


    const uploadOptions=multer({storage:storage})

    

    router.post("/", uploadOptions.single('image'), async (req,res)=>{
        const category=await Category.findById(req.body.category)
        if(!category)
        return res.status(400).send('Invalid Category')

        const file= req.file;
        if(!file)
        return res.status(400).send('No image in the request')

        const fileName=req.file.filename
        const basePath=`${req.protocol}://${req.get('host')}/public/upload/`

        const product= new Product({
        name: req.body.name,
        description: req.body.description,
        richDescripton: req.body.richDescripton,
        image:`${basePath}${fileName}`,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock:req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
        })
        product=await product.save()
        
        if(!product)
        return res.status(500).send('The product cannot be created')

        res.send(product)
    })



//     router.post("/multiple-images", uploadOptions.array('images', 10), async (req, res) => {
//         try {
//         const files = req.files; // This will contain an array of uploaded files
    
//         if (!files || files.length === 0) {
//             return res.status(400).json({ message: 'No files were uploaded' });
//         }

//         let imagesPaths = [];
//         const basePath = `${req.protocol}://${req.get('host')}/public/upload/`;

//         // Process each uploaded file
//         for (let i = 0; i < files.length; i++) {
//             const file = files[i];
//             const fileName = file.filename;

//             // Manipulate or store the file path as needed (for example, saving to the database)
//             const imagePath = `${basePath}${fileName}`;
//             imagesPaths.push(imagePath);

//             // You can perform database operations or any other file manipulation here
//         }

//         // After processing, you can send a response indicating successful file uploads
//         res.status(200).json({ message: 'Images uploaded successfully', images: imagesPaths });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });



    router.get("/",async(req,res)=>{

        let filter={}

        if(req.params.categoryroute){
            filter={category:req.query.categoryroute.split(',')}
        }
        const productList=await Product.find({filter}).populate('category')

        if(!productList){
            res.status(500).json({success:false})
        }

        res.send(productList)
        })




    router.get("/:id",async(req,res)=>{
            const product=await Product.findById(req.params.id).populate('category')
        
            if(!product){
                res.status(500).json({success:false})
            }
        
            res.send(product)
            })




        


        router.put('/:id',async(req,res)=>{
        if(!mongoose.isValidObjectId(req.params.id)){
            return res.status(400).send('Invalid Product Id')
        }
            const category=await Category.findById(req.body.category)
            if(!category)
            return res.status(400).send('Invalid Category')

            const product=await Product.findByIdAndUpdate(
                req.params.id,
                {
                    name: req.body.name,
                    description: req.body.description,
                    richDescripton: req.body.richDescripton,
                    image:req.body.image,
                    brand: req.body.brand,
                    price: req.body.price,
                    category: req.body.category,
                    countInStock:req.body.countInStock,
                    rating: req.body.rating,
                    numReviews: req.body.numReviews,
                    isFeatured: req.body.isFeatured,
                },
                {new:true}
        
            )
            if(!product)
                return res.status(500).send('the product cannot be updated!')
        
                res.send(product);
            
        })

       


        // router.put('/admin/products/:productId/unlist', async (req, res) => {
        //     console.log(productId);
        //     try {
        //         const productId = req.params.productId;
        
        //         // Update the 'listed' field of the product to mark it as unlisted
        //         const updatedProduct = await Product.findByIdAndUpdate(productId, { listed: false }, { new: true });
        
        //         if (updatedProduct) {
        //             // If the product was successfully updated, send a success response
        //             res.status(200).json({ message: 'Product unlisted successfully' });
        //         } else {
        //             // Handle if the product wasn't found
        //             res.status(404).json({ message: 'Product not found' });
        //         }
        //     } catch (error) {
        //         res.status(500).json({ error: error.message });
        //     }
        // });

        // router.put('/products/:productId/unlist', async (req, res) => {
        //     try {
        //         const productId = req.params.productId;
        
        //         // Find the product by its ID and update the 'listed' field to false
        //         const updatedProduct = await Product.findByIdAndUpdate(productId, { listed: false }, { new: true });
        
        //         if (updatedProduct) {
        //             res.status(200).json({ message: 'Product unlisted successfully' });
        //         } else {
        //             res.status(404).json({ message: 'Product not found' });
        //         }
        //     } catch (error) {
        //         res.status(500).json({ error: error.message });
        //     }
        // });
        

        router.get('/product/:productName', async (req, res) => {
            try {
                const productName = req.params.productName;
        
                // Fetch product details based on the product name
                const product = await Product.findOne({ name: productName });
        
                if (!product) {
                    // Handle case when the product is not found
                    return res.status(404).send('Product not found');
                }
        
                // Render a view with the product details
                return res.render('product-details', { product });
            } catch (error) {
                console.error(error.message);
                return res.status(500).send('Error fetching product details');
            }
        });

        



        router.delete('/:categoryId',(req,res)=>{
            Product.findByIdAndRemove(req.params.id).then(product=>{
                if(product){
                    return res.status(200).json({success:true,message: 'the product is deleted'})
                }else{
                    return res.status(404).json({success: false, message:"product not found"})
                }
            }).catch(err=>{
                return res.status(500).json({success:false,error:err})
            })
        })

        router.get("/get/count",async(req,res)=>{
            const productCount=await Product.countDocuments((count)=>count)
        
            if(!productCount){
                res.status(500).json({success:false})
            }
        
            res.send({
                productCount:productCount
            })
            })



            router.get("/get/featured/:count",async(req,res)=>{
                const count=req.params.count? req.params.count:0
                const products =await Product.find({isFeatured:true}).limit(+count)
            
                if(!products){
                    res.status(500).json({success:false})
                }
            
                res.send(products)
                })

 

                router.get('/admin/products', async (req, res) => {
                    try {
                    // Fetch products from the database (or any other source)
                    const products = await Product.find(); // Assuming Product is your Mongoose model
                
                    // Render the 'admin/products' view and pass the 'products' variable to it
                    res.render('admin/products', { products: products });
                    } catch (error) {
                    console.error(error);
                    res.status(500).send('Error retrieving products');
                    }
                });

 
                // router.get('/products', async (req, res) => {
                //     try {
                //     const products = await Product.find(); // Fetch all products from the database
                //     res.render('your_ejs_template', { products }); // Pass products data to your EJS template
                //     } catch (err) {
                //     res.status(500).json({ message: err.message });
                //     }
                // });
    

                // Example route handler in Express.js
                router.get('/admin/edit-product', (req, res) => {
                    try {
                    // Retrieve product data or perform necessary operations
                    
                    // Render the EJS template and send the response
                    res.render('edit-product', { /* some data */ });
                    } catch (error) {
                    console.error(error);
                    res.status(500).send('Internal Server Error');
                    }
                });

                router.get('/admin/edit-user', (req, res) => {
                    try {
                    // Retrieve product data or perform necessary operations
                    
                    // Render the EJS template and send the response
                    res.render('edit-user', { /* some data */ });
                    } catch (error) {
                    console.error(error);
                    res.status(500).send('Internal Server Error');
                    }
                });

        module.exports=router;