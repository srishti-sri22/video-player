
import dotenv from 'dotenv';
dotenv.config();

console.log(process.env.MONGODB_URI)
import { app } from './app.js';
import connectDB from './db/check.js';

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at ${process.env.PORT}`);
    });
  })
  .catch(() => {
    console.log("Connection failed !!!!!!");
  });





// require('dotenv').config({path: './env'});
// import dotenv from 'dotenv';
// dotenv.config({path:'./env'});
// import { app } from './app.js'; 


// //SECOND APPROACH

// import connectDB from './db/check.js';
// //the connection is async await and returns a promise so we can put try and then on it
// connectDB().
// then(()=>{
//     app.listen(process.env.PORT || 8000 ,()=>{
//     console.log(`Server is running at ${process.env.PORT}`);})
// }).
// catch((error)=>{
//     console.log("COnnection falied !!!!!!");
    
// });



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

