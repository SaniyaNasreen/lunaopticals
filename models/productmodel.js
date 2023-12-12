const mongoose=require('mongoose')



const productSchema=mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    richDescription:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    images:[{
        type:String,
        required:true
    }],
    brand:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        default:0
    },
    category:{
         type:String,
         required:true
    },
    countInStock:{
       type:Number,
       required:true,
       min:0,
       max:255
    },
    rating:{
        type:Number,
        default:0,
    },
    numReviews:{
        type:Number,
        default:0,
    },
    isFeatured:{
        type:Boolean,
        default:false
    },
    dateCreated:{
        type:Date,
        default:Date.now
    },
    listed: { 
        type: Boolean,
         default: true,
         }
})
 

// exports.Product=mongoose.model('Product',productSchema)

module.exports=mongoose.model("Product",productSchema)