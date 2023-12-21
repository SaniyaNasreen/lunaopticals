const mongoose = require("mongoose");

mongoose.connect(process.env.CONNECTION_STRING)
.then(()=>{
console.log('Database Connection is ready...');
})  
.catch((err)=>{
    console.log(err);
})