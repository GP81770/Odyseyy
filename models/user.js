const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportlocalMongoose =require("passport-local-mongoose"); //simplifies building username and password login with Passport.

const userSchema =new Schema({
    email:{
        type:String,
        required:true,
    }
});

userSchema.plugin(passportlocalMongoose);
module.exports=mongoose.model("User",userSchema);