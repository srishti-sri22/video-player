 import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {generateAccessToken,generateRefreshToken} from "../models/user.models.js";

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500);
    }
}

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


 const loginUser = asyncHandler(async (req,res)=>{
    //request body se data le aao
    const {email, username, password} = req.body;
    //username or email based access
    if(!username || !email){
        throw new ApiError(400, "username or passowrd is required");
    }
    //find the user
    const user = await User.findOne({
        $or:[{username}, {email}]
    })
    if(!user){
        throw new ApiError(404, "User does not exist");
    }
    //passowrd check
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "password is npot valid")
    }
    //access the refresh token 
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
    //send the cookies to user

    const loggenInUser = await User.findById(user._id).select("-password -refreshToken");

    const options={
        httpOnly : true,
        secure:true
    }

    return res.status(200).
    cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options 
    ).json(
        new ApiResponse(200, {
            user: loggedInUser, accessToken, refreshToken
        },
    "USer logged in succesfully")
    )
 })


 const logoutUser = asyncHandler(async (req,_)=>{
    //remove access and refresh token
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined
        }
    },
    {
        new: true
    }
)
    //remove refrehs token from the user field

    const options={
        httpOnly : true,
        secure:true
    }

    return res.status(200).
    clearCookie("accessToken", options).
    clearCookie("refreshToken", options).json(
        new ApiResponse(200,{}, "User logged out successfully")
    )
 })

 export {registerUser, loginUser, logoutUser};