import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.models";

export const verifyJWT = asyncHandler( async(req, res ,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
    
        if(!token){
            throw new ApiError(401, "unauthorized User");
        }
    
        const decodedToekn = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToekn?._id).select("-password -refreshToken");
        if(!user){
            throw new ApiError(401,"Invalid access token");
        }
    
        req.user =user;
    } catch (error) {
        throw new  ApiError(401,"invalid access token");
    }
})