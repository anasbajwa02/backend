
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
  


const connectDB = async ()=>{
try{
const connectionIstance =   await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`)
   console.log(`\n MOngoDb connected Seccessfully!! and DB host is ${connectionIstance.connection.host}`)
  

}catch(error){
    console.log(`this is an error ${ error}`)

}
}
export default connectDB;