import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler( async(req, res ,next)=>{
    try {
        console.log("Cookies:", req.cookies);

        console.log("VERify JWT :", req.cookies.accessToken);
        const token = req.cookies?.accessToken;
    
        if(!token){
            throw new ApiError(401, "unauthorized User");
        }
    
        const decodedToekn = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToekn?._id).select("-password -refreshToken");
        if(!user){
            throw new ApiError(401,"Invalid access token");
        }
    
        req.user =user;
        next()
    } catch (error) {
        throw new  ApiError(401,"invalid access token");
    }
})