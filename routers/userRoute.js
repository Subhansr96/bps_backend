const express=require('express');
const router = express.Router();
const dotenv=require('dotenv');
const Joi = require("joi");
const bcrypt=require('bcrypt');
const nodemailer=require('nodemailer');
const auth = require('../middleware/auth');
const jwt=require("jsonwebtoken")
const multer=require("multer");
const { User } = require('../models/userModel');
const { OtpModel } = require('../models/otpModel');
dotenv.config();


const options = {
    abortEarly: false,
    allowUnknown: true, 
    stripUnknown: true,
};

let transporter=nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.AUTHEMAIL,
        pass: process.env.AUTHPASSWORD,
    }
})


transporter.verify((error,success)=>{
    if(error){
        console.log("error",error)
    }else{
        console.log("Ready for mesaages")
        console.log(success)
    }
})

const storage = multer.diskStorage({   
    destination: function(req, file, cb) { 
       cb(null, './uploadsprofile');    
    }, 
    filename: function (req, file, cb) { 
       cb(null ,Date.now() + file.originalname);   
    }
 });


const upload=multer({storage:storage})
router.get('/',(req,res)=>{
    res.send("Hello from bps")
})

router.post('/register',upload.single('myFile'),async(req,res)=>{
    try {
        const profile= req.file?req.file.filename:null;
        // console.log("---------------",req.body,profile)
        const schema = Joi.object({
            username: Joi.string().min(3).max(25).required().label('UserName'),
            email: Joi.string().email({ tlds: { allow: false } }).required().label('Email-id'),
            password: Joi.string().min(4).max(25).required().label('Password'),
            cpassword: Joi.string().min(4).max(25).required().label('Confirm Password'),
            mobile:  Joi.number().integer().min(1000000000).max(9999999999).allow('', null).label('Mobile'),
            address:Joi.string().allow('', null).label("Address")
        });
        const { error, value } = schema.validate(req.body, options);
        // console.log("error,value",error,value)
        
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });
        const {username,email,password,cpassword,mobile,address}=value;

        const userExist= await User.findOne({email})
        if(userExist){
            return res.status(400).json({error:"Email Already exist"})
        }
        if(password!=cpassword){
            return res.status(400).json({error:"Password Mismatch"})
        }
        const user=new User({username,email,password,confirmPassword:cpassword,mobileNumber:mobile,address,profile})
        await user.save();
        sendSuccessfulRegister(value,res,user)
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({success:false,message:"Request failed with status code 500"})
    }
})

const sendSuccessfulRegister=async(value,res,user)=>{
    // console.log("jjjjjjjjjjj",value,res)
    try {
        const {email,username}=value
        const mailOptions={
            from:process.env.AUTHEMAIL,
            to:email,
            subject:"Successfull Registration",
            html:`Hello ${username},you've registered successfully into BPS.`
        }
       
        await transporter.sendMail(mailOptions);
        return res.status(200).json({status:true,message:"User registered successfully",data:user})
    } catch (error) {
        console.log(error)
        return res.json({
            status:"Failed",
            message:error.message
        })
    }
    
}
router.post('/login',async(req,res)=>{
    // console.log("---------------ppppppppppp",req.body)
    try{
        const schema = Joi.object({
            email: Joi.string().email({ tlds: { allow: false } }).required().label('Email id'),
            password: Joi.string().min(1).max(35).required().label('Password'),
        });
        const { error, value } = schema.validate(req.body, options);
        const {email,password}=value;
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });
        
        const userLogin=await User.findOne({email})
        if(userLogin){
            const isMatch=await bcrypt.compare(password , userLogin.password);
            
            if(!isMatch){
                res.status(400).json({error:"Invalid Details"});
            }else{
               console.log("Successful login")
               let tokenData =await jwt.sign({id:userLogin._id},process.env.SECRET,{ expiresIn: '1d', algorithm: 'HS512' });
                // console.log("dddddddddd",tokenData,userLogin)
                    
                return res.status(200).json({message:"user login",data:{name:userLogin.username,email:userLogin.email,token:tokenData,mobile:userLogin.mobileNumber,address:userLogin.address,profile:userLogin.profile}});
            }
        }
        else{
            res.status(400).json({error:"Again signin plz"});
        }     
    }catch(error){
        console.log(error)
        return res.status(500).json({success:false,message:"Request failed with status code 500"})
    }
})

router.post('/emailsend',async(req,res)=>{

    try {
     const schema = Joi.object({
        email:  Joi.string().min(4).max(35).required().label('Email')
     });
     const { error, value } = schema.validate(req.body, options);

     const {email}= value;
     if (error) return res.status(400).json({ success: false, message: error.details[0].message });
 
     const userLogin=await User.findOne({email})
     if(userLogin){
        // console.log("userlogin",userLogin,email,value,res)
        sendOTPVerificationEmail(userLogin.email,value,res)
     }
 
    } catch (error) {
     console.log(error)
     return res.status(400).json({success:false,message:"Problem Occurs"})
    }
 })
 
 
const sendOTPVerificationEmail=async(email,value,res)=>{
    // console.log(".....",email,value,res)
    try {
        const otp=`${Math.floor(1000 + Math.random() * 9000)}`;
        const mailOptions={
            from:process.env.AUTHEMAIL,
            to:email,
            subject:"Verify your Email",
            html:`<p>Enter <b>${otp}</b>in the app to verify your email address and complete the signup and login into your account.</p>
            <p>This Code <b>expires in 1 hours</b>.</p>`
        }
        const saltRounds=10;
        const hashedOTP=await bcrypt.hash(otp,saltRounds);
      
        let d1=new Date();
        let d2 = new Date ( d1 );
        await OtpModel.deleteMany({email});
        const newOTPVerication=await new OtpModel({
            email:value.email,
            code:hashedOTP,
            expiresIn:d2.setMinutes ( d1.getMinutes() + 10 )
        })
        await newOTPVerication.save();
        await transporter.sendMail(mailOptions);
        return res.json({
            status:"Pending",
            message:"Verification otp email sent",
            data:{
                email
            }
        })
    } catch (error) {
        console.log(error)
        return res.json({
            status:"Failed",
            message:error.message
        })
    }
}
router.post('/verifyotp',async(req,res)=>{
   
    try {
        const schema = Joi.object({
            email:  Joi.string().min(4).max(35).label('Email'),
            otp:  Joi.string().min(4).max(35).required().label('OtpCode'),
            password:  Joi.string().min(4).max(35).required().label('Password'),
            confirmPassword:  Joi.string().min(4).max(35).required().label('ConfirmPassword'),
          });
        const { error, value } = schema.validate(req.body, options);
    
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });
        const {email}=value;
        const data=await OtpModel.findOne({email})
      
  
        if(data){
            if(data.expiresIn<Date.now()){
        
                return res.status(400).json({status:false,message:"Token Expire"})
            }else{
                
                const validOTP=await bcrypt.compare(value.otp,data.code);
                
                if(!validOTP){
                    return res.status(400).json({status:false,message:"Invalid OTP"})
                }else{
                    let user=await User.findOne({email})
                    if(user){
                        if(value.password!=value.confirmPassword){
                            return res.status(200).json({status:false,message:"Password Mismatch"})
                        }
                        let pass_ = await bcrypt.hash(value.password, 12);
                        let cpass_ = await bcrypt.hash(value.confirmPassword, 12);
                        
                        user.password=pass_;
                        user.confirmPassword=cpass_;
                        await User.findOneAndUpdate({email},{password:pass_,confirmPassword:cpass_});
                       
                        return res.status(200).json({status:true,message:"Password Changed Successfully"})
                    }else{
                        return res.status(400).json({status:false,message:"Something went wrong"})
                    }
                }
            }
            
        }
    } catch (error) {
        console.log(error)
        return res.status(400).json({success:false,message:"Invalid Otp"})
    }
})

module.exports=router