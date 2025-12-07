import express from 'express';
const app = express()
let port = 4000;

app.get("/", (req,res)=>{
    res.send("Hello World!");
})

app.listen(port,()=>{
    console.log(`Server is running at ${port}`);
})