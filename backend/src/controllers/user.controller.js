 import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        console.log("Access token:", accessToken);
        console.log("Refresh token:", refreshToken);


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
    if(!password && !(email||username)){
        throw new ApiError(400, "password and username or email is required");
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

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

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


 const logoutUser = asyncHandler(async (req,res)=>{
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


 const refreshAccessToken = asyncHandler(async (req,res)=>{
    //refresh token cookies se access kr skte hai
    const incomingRefreshTOken = req.cookies.refreshToken ||  req.body.refreshToken;

    if(!incomingRefreshTOken){
        throw new ApiError(401,"Unauthorised request: as Refresh TOken is not found");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshTOken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401, "Unauthorised request: Invlaid request token");
        }
    
        if(incomingRefreshTOken!== user?.refreshToken){
            throw new ApiError(401,"refresh token is expired or used");
        }
    
        const options ={
            httpOnly:true,
            secure:true
        }
        //agar refresh token valid hai
        //and vo decode bhi ho kr value de rhi hai
        //and jo value a rhi hai use hm 
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id);
        return res.status(200)
        .cookie("accessToken", accessToken,options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(
            200, {
                accessToken, refreshToken: newRefreshToken},
                "Access Token refreshed successfully"
        ))
    } catch (error) {
        throw new ApiError(401, error?.message ||"invalid refresh token")
    }

 })


 const changeCurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword, newPassword, confirmPassword} = req.body;
    if(newPassword!==confirmPassword){
        throw new ApiError(401, "passwords entered do not match");
    }
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password");
    }
    user.password = newPassword;
    await user.save({validateBeforeSave:false});

    return res.status(200).json(new ApiResponse(200, "password changed successfully"));
 })

 const getCurrentUser = asyncHandler(async (req,res)=>{
    return res.status(200)
    .json(200, req.user, "Current user fetched successfully");
 })

 const updateAccountDetails = asyncHandler(async (req,res)=>{
    const {fullName, email} = req.body;
    if(!fullName || !email){
        throw new ApiError(400, "All fileds are required");
    }


    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullName,
                email: email
            }
        },
        {
            new:true //new true , mtlb update hone ke bad wali value return hoti hai
        }
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, "accoutn details updated successfully."));
 })

 const updateUserAvatar = asyncHandler(async (req,res)=>{
    const avatarlocalPath = req.file?.path;
    if(!avatarlocalPath){
        throw new ApiError(400, "Avatar file is missing");   
    }
    const avatar = await uploadOnCloudinary(avatarlocalPath);
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on cloudinary"); 
    }

    //we can add to delete the avatar and the cover image from the CLoudinary after the new one has been uplaoded, since we have the url to it

     const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            avatar: avatar.url
        }
     },{
        new:true
     }).select("-password");

     return res.status(200).json(new ApiResponse(200, "Avatar updated successfully."));
 })

 const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverLocalPath = req.file?.path;
    if(!coverLocalPath){
        throw new ApiError(401,"Cover image missing");
    }

    const coverImage = await uploadOnCloudinary(coverLocalPath);

    if(!coverImage.url){
        throw new ApiError(401, "COver Image uploadation on CLoddinary failed");
    }

    const user = User.findByIdAndUpdate(req.user._id, {
        $set: {
            coverImage : coverImage.url
        }
        }, {
        new:true //taaki updated wala hme return kre
        }).select("-password");

    return res.status(200).json(new ApiResponse(200, "Cover Image updated successfully."));
 })

 export {registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser, changeCurrentPassword, updateAccountDetails, updateUserAvatar, updateUserCoverImage};