const asyncHandler = (requestHandler)=>{
    return (req,res,next) =>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

export {asyncHandler}

//using try catch block
//both return a new function
// const asyncHandler = (fn) =>{
//     async  (req,res,next) => {
//         try {
        //yaha hm apne function ko await krke try mei rkhte hai
        //upar hm apne function ko primise sse resolve krte hai
//             await fn(req,res,next)
//         } catch (error) {
//             res.status(error.code || 500).json({
//                 success:false,
//                 message:error.message
//             })
//         }
//     }
// }