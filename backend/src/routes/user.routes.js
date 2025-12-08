import { Router } from "express";
import { logoutUser, registerUser, loginUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

console.log("User router loaded");

router.route("/register").
post(upload.fields([
    {
        name:"avatar",
        maxCount: 1
    },
    {
        name:"coverImage",
        maxCount: 1
    }]), registerUser)


router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/update-details").post(verifyJWT, updateAccountDetails);

export default router;