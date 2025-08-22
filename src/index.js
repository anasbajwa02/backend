// require('dotenv').config({path:"./env"});
import dotenv from "dotenv";
import connectDB from "./db/db.js";
import { app } from "./app.js";

dotenv.config({
    path:"./.env"
})


connectDB()
.then(()=>{
    
    app.listen(process.env.PORT ||  8000,()=>{
    console.log(`server in running at the PORT ${process.env.PORT}`);
    })

    
})
.catch((error)=>{
    console.log("DB connection failer..",error);
    process.exit(1)
    
})


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