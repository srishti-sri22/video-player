 import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

 const registerUser = asyncHandler(async (req,res)=>{

    //data lenge from frontend 
    const {fullName, email, username, password} = req.body
    console.log(req.body);
    console.log("email:",email);

    //validations lagana pdega - not empty
    // if (fullName === ""){
    //     throw new ApiError(400, "FUllname is required")
    // }
    if([fullName,email,username,password].some((field)=>
        field?.trim()===""
    )) {
        return new ApiError(400, "All fileds are required");
    }
    //saare values ka array bana dia hai and then keh rhe hai ki agar the value after trimming for any of the above is === "" empty string , tb new ApiError raise kr do

    //check if user already exists: with username and email
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists");
    }

    //check for images , check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;

    let coverLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
         coverLocalPath = req.files.coverImage[0].path;}

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    //upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
    }

    //create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url ,
        coverImage: coverImage?.url || "", 
        email,
        password,
        username: username.toLowerCase()
    })

    //remove password and refresh token filed from response
    const createdUser = await User.findById(user._id)
    .select("-password -refreshToken")
    
    //check for user creation
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while user creation");
    }

    //return response
    return res.status(201).json(
        new ApiResponse(200,createdUser, "User Registered successfully")
    )

 })

 export {registerUser};