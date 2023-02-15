
const mongoose=require('mongoose');


const otpModel=new mongoose.Schema({
    email:{
        type:String,
        // required:true
    },
    code:{
        type:String,
        required:true
    },
    expiresIn:{
        type:String,
        required:true
    }

})

const OtpModel=mongoose.model('otpModel',otpModel);

module.exports={OtpModel};