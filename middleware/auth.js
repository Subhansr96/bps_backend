const jwt=require('jsonwebtoken');
const {User} = require('../models/userModel')

const auth=async(req,res,next)=>{
    // console.log("dfgfdgdf",req.headers["_token"])
    let _secrate = req.headers["_token"];
    try{
        // const token=req.cookies.attend;
        // // console.log("token",token)
        const proof=jwt.verify(_secrate,process.env.SECRET, { algorithm: 'HS512' });
       
        // console.log("prrof",proof)
        const userData=await User.findOne({_id:proof.id});
        // console.log("userdata",userData)
        if(!userData){
            throw new Error("User not found")
        }
        // req.token=token;
        req.userData=userData;
        req.id=userData._id;
        next();
       }catch(err){
            console.log(err)
           return res.status(401).send("unauthorised user");   
       }
}

module.exports=auth;