const mongoose=require("mongoose")



    // .......................user schema for address........................... //
    const adminSchema= mongoose.Schema({
        name:{
            type:String,
            required:true
        },
        email:{
            type:String,
            required:true
        },
        mobile:{
            type:Number,
            required:true
        },
        password:{
            type:String,
            required:true
        },
        cpassword:{
            type:String,
            required:true
        },
        country:{
         type:String,
         required:true
        },
        is_admin:{
            type:Number,
            default:1
        },
        is_varified:{
            type:Number,
            default:0
        },
        token:{
            type:String,
            default:''
        } 

    })

 

    // const User = mongoose.model('User', userSchema);
 
   module.exports=mongoose.model("Admin",adminSchema)

    