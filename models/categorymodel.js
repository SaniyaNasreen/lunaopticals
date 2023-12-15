const mongoose=require("mongoose")


const categorySchema= mongoose.Schema({
name:{
    type:String,
    required:true,
    unique: true
},
image:{
    type:String,
    required:true,
    unique:true
},

listed: { 
    type: Boolean,
     default: true,
     }
})

 


const Category = mongoose.model('Category', categorySchema);

 


module.exports = Category;
 