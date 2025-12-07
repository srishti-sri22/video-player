import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

console.log("User router loaded");

router.route("/register").post(registerUser)
// router.route("/login").post(loginUser)

export default router;