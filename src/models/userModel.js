const mongoose = require("mongoose");
const { Schema, model } = mongoose;


const UserSchema = new Schema({
    email: String,
    password: String,
    emailCode: String,
    emailCodeExpires: Date,
    isEmailVerified: Boolean,
    secret: Object,
    is2FAEnabled: Boolean,
},{timestamps:true,versionKey:false});


const userModel = model("users",UserSchema);


module.exports = userModel;