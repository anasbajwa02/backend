import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


// genrate access and refresh tokens

const genrateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while genrating access and refresh tokens"
    );
  }
};


// register the user

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;
  console.log("email", email);

  // Check required fields
  if ([username, email, fullName, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // Simple email validation (better to use validator.js)
  if (!email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
    throw new ApiError(400, "Email not valid");
  }

  // Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  // Files from multer
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Upload to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar) {
    throw new ApiError(400, "Failed to upload avatar to Cloudinary");
  }

  // Create user
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});


// login user

const LoginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  console.log(email, " in log");

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(400, "User not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is not valid");
  }

  const { accessToken, refreshToken } = await genrateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user loggedin successfully"
      )
    );
});


// logout user

const LogoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized requesst");
  }
  try {
    const decodedToken = jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }

    const options = {
      http: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await genrateAccessAndRefreshTokens(user._id);
    return res
      .status(200)
      .cookie("access token", accessToken, options)
      .cookie("refresh token", newRefreshToken, options)
      .json(
        ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Accessed Token is Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid referesh token");
  }
});


// change the user password (update)

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully"));
});

// get current user 

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current user fetched successfully!");
});


// updated user information (update)


const updateAccountDetails = asyncHandler(async(req,res)=>{

  const {fullName,email} = req.body

  if(!fullName || !email){
    throw new ApiError(400,"All fields are required")

  }

  const user = User.findByIdAndUpdate(req.user?._id,{
    $set:{
      fullName,
      email
    }
  },{new:true}).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"Account details updated successfully"))
})


// update user avatar image (update)


const updateuserAvtar = asyncHandler(async(req,res)=>{
  const avatarLocalPath = req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is require")

  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)
   
   if(!avatar.url){
    throw new ApiError(400,"Error while uploading on avatar")

   }
   const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    }
    ,{
         new:true
    }
   ).select("-password")
   return res
   .status(200)
   .json(
    new ApiResponse(200,user,"Avatar image updated successfully ")
   )
})
 
// update user cover image (update)

const updateuserCoverIamge = asyncHandler(async(req,res)=>{
  const coverImageLocalPath = req.file?.path
  if(!coverImageLocalPath){
    throw new ApiError(400,"cover file is require")

  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
   
   if(!coverImage.url){
    throw new ApiError(400,"Error while uploading  Cover image")

   }
   const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
        coverImage:coverImage.url
      }
    }
    ,{
         new:true
    }
   ).select("-password")
   return res
   .status(200)
   .json(
    new ApiResponse(200,user,"cover image updated successfully ")
   )
})

//mongodb aggregate pipeline use

const getUserChannelProfile = asyncHandler(async(req,res)=>{
  const {username} = req.params

  if(!username?.trim()){
       throw new ApiError(400,"username is missing")
  }

const channel =  await User.aggregate([
  {
    $match:{
      username:username?.toLowerCase()
    }
  },
  {
    $lookup:{
      from:"subscriptions",
      localField:"_id",
      foreignField:"channel",
      as:"subscribers"
    }
  },
  {
    $lookup:{
       from:"subscriptions",
      localField:"_id",
      foreignField:"subscriber",
      as:"subscribeTo"
    }
  },
  {
    $addFields:{
      subscribersCount:{
        $size: "$subscribers"
      },
      channelsSubscribedToCount:{
        $size: "$subscribeTo"
      },
      isSubcribed:{
        $cond:{
          if:{$in:[req.user?._id,"$subscribers.subscriber"]},
          then:true,
          else:false,
        }
      }
    }
  },
  {
    $project:{
      fullName:1,
      username:1,
      subscribersCount:1,
      channelsSubscribedToCount:1,
      isSubcribed:1,
      avatar:1,
      coverImage:1,
      email:1,
    }
  }
])

if(!channel?.length){
  throw new ApiError(404,"channel does not exist")
}
return res 
.status(200)
.json(
  new ApiResponse(200,channel[0],"User channel fetched successfully")
)
})


export {
  registerUser,
  LoginUser,
  LogoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateuserCoverIamge,
  updateuserAvtar,
  getUserChannelProfile
};
