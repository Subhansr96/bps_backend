const express=require('express');
const dotenv=require('dotenv')
const app=express();
const router=require('./routers/userRoute')
const cors=require('cors')
const cookieParser=require('cookie-parser')

// const passport = require('passport');  
// const cookieSession = require('cookie-session');
// const passportSetup=require("./passport")
// const authRoute=require("./routers/auth")

dotenv.config()
require('./db/connection.js')
// var Holidays = require('date-holidays')
// const hd = new Holidays()
// console.log(hd.getHolidays(2021))
// app.use('/uploads',express.static('uploads'))
// app.use('/uploadsprofile',express.static('uploadsprofile'))
// app.use('/uploadcitiespictures',express.static('uploadcitiespictures'))
app.use(cookieParser())
app.use(express.json());
// app.use(bodyParser);
app.get('/',(req,res)=>{
    res.send(
        "hello"
    )
})

// app.use(
//     cookieSession({
//         name:"session",
//         keys:["lama"],
//         maxAge:24*60*60*100
//     })
// )

// app.use(passport.initialize())
// app.use(passport.session())

// app.use(cors({
//     origin:"http://localhost:3000",
//     methods:"GET,POST,PUT,DELETE",
//     credentials:true
// }))
app.use(cors('*'))
// app.set('trust proxy', true)
app.use('/user',router)
// app.use("/auth",authRoute)
const port=process.env.PORT


app.listen(port,()=>{
    console.log(`App is listening on ${port}`)
})