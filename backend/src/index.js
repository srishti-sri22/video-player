// require('dotenv').config({path: './env'});
import dotenv from 'dotenv';
dotenv.config({path:'./env'});


//SECOND APPROACH

import connectDB from './db/check.js';
connectDB();



//FIRST APPROACH

// import mongoose from 'mongoose';
// import { DB_NAME } from './constants';
// import express from 'express';
// const app = express()
// //we are making an IIFE over here
// ; (async function connectDB(){
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", (error)=>{
//             console.log("Error: ",error)
//             throw error
//         })

//         app.listen(process.env.PORT,()=>{
//     console.log(`Server is running at ${process.env.PORT}`);
// })
//     }
//     catch(error){
//         console.log("Error: ",error);
//         throw error;
        
//     }
// })();

