import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req,res)=>{
     
    const{username,email,fullName,password} = req.body
    console.log("email",email)


    if(
        [username,email,fullName,password].some((field)=>field?.trim() === "" )
    ){
        throw new ApiError(400,"All field are required")
    }

    
   const existedUser =  User.findOne({
        $or:[{email},{username}]
    })
  if(existedUser){
    throw new ApiError(409,"User Aleadry Exist")
  }

const avatarLocalPath =   req.files?.avatar[0]?.path;
const coverImageLocalPath = req.files?.coverImage[0]?.path;

if(!avatarLocalPath){
    throw new ApiError(400,"Avtar file is required")
}

const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath);

if(!avatar){
     throw new ApiError(400,"Avtar file is required")
}

const user = await  User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase(),
})

const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)


if(!createdUser){
    throw new ApiError(500,"something went wrong while registring user")
}
    // for email validations
   if(!email.includes("@") || email.startsWith("@") || email.endsWith("@")){
    throw new ApiError(400, "Email not valid");
}
return res.status(201).json(
    new ApiResponse(200,createdUser,"user registerd seccfuly")
)
   
}) 


export {registerUser};