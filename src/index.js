// require('dotenv').config({path:"./env"});
import dotenv from "dotenv";
import connectDB from "./db/db.js";


dotenv.config({
    path:"./env"
})


connectDB();


























//  connect DB 


// ( async ()=>{
//    try{
//    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//    app.on("error",(error)=>{
//     console.log("ERROE",error)
//     throw error

//    })

//    app.listen(process.env.MONGODB_URI,()=>{
//     console.log(`APP is listing on port ${process.env.MONGODB_URI} `)
//    })

//    }catch(error){
//     console.log(`erroe , ${error}`)
//     throw error
//    }
// })()