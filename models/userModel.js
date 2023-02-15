const mongoose=require('mongoose');
const bcrypt=require("bcrypt")



const validateEmail = (email) => {
    // console.log(email)
    const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    // console.log(res.test(email))
    return re.test(email);
};
const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    email:{
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: "Email address is required",
        validate: [validateEmail, "Please fill a valid email address"],
        match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
        ],
    },
    password:{
        type:String,
        required:true
    },
    confirmPassword:{
        type:String,
        required:true
    },
    mobileNumber:{
        type:Number,
        unique:true
        // required:true
    },
    address:{
        type:String,
        // required:true
    },
    profile:{
        type:String,
        // required:true
    },
    country:{
        type:String,
    },
    gender:{
        type:String,
    },
    tokens:[
        {
            token:{
                type:String,
                required:true
            }
        }
    ]
})
userSchema.pre('save',async function(next){
    if(this.isModified('password')){
        this.password=await bcrypt.hash(this.password,12)
        this.confirmPassword=await bcrypt.hash(this.confirmPassword,12)
    }
    next()
})
const User=mongoose.model('data',userSchema);
module.exports={User};