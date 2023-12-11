    const mongoose=require("mongoose")



    // .......................user schema for address........................... //
    const userSchema= new mongoose.Schema({
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
        street:{
            type:String,
            required:false
        },
        appartment:{
            type:String,
           required:false
        },
        zip:{
          type:String,
          required:false
        },
        city:{
            type:String,
            required:false
        },
        state:{
            type:String,
            required:false
        },
        country:{
         type:String,
         required:true
        },
        is_admin:{
            type:Number,
            required:true
        },
        is_varified:{
            type:Number,
            default:0
        },
        token:{
            type:String,
            default:''
        },
        listed:{
            type:Boolean,
            default:true
        },
        is_blocked: {
            type: Boolean,
            default: false,
          },

    })


    userSchema.virtual('id').get(function(){
        return this._id. toHexString()
    })

    userSchema.set('toJSON',{
        virtuals:true
    })


    // const User = mongoose.model('User', userSchema);
 
   module.exports=mongoose.model("User",userSchema)

    