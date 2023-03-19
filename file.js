
const cors = require("cors")
const fs  = require('fs')
const mongoose = require('mongoose')
const express = require('express')
const multer = require("multer")
const {GridFsStorage} = require("multer-gridfs-storage")
const crypto = require("crypto")
const path = require("path")
const stream = require("stream")
const {GridFSBucket} = require("mongodb")
const bodyParser = require("body-parser")
const {paper}= require('./model')

const app = express()
app.use(cors())
app.use(bodyParser.json())
const mongoURI = "mongodb+srv://ankit:1234@cluster0.oq9rmd8.mongodb.net/papers?retryWrites=true&w=majority"


const storage =  GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      console.log("this")
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({ storage });
let bucket
let chunks
let files
  mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async()=>{
  console.log('database connected')
  db= mongoose.connection.db

  bucket = new GridFSBucket(db, { bucketName: 'uploads' });
  })
.catch(err=>console.error(err))


app.post('/delete_file',async(req,res)=>{
  const id=req.body.id
  bucket.delete(new mongoose.Types.ObjectId(id)).then(r=>{
    console.log(`file with id ${id} is deleted`)
    paper.deleteOne({paper_id:id}).then(result=>{console.log("paper section is also deleted")
    res.send({deleted:true})
  }).catch(err=>console.error(err))
  }).catch(err=>console.error(err))

})
 
app.post('/upload',upload.single('paper'),async(req,res)=>{
  const{sem,branch,subject,exam} = req.body
  const{id} = req.file
  const newPaper = new paper({
    sem:sem,
    branch:branch,
    subject:subject,
    exam:exam,
    paper_id:id
  })

  await newPaper.save().then(res=>console.log(res))
  res.send("file uploaded")

})




app.get('/find_file',async(req,res)=>{
   
   const toFilter={}
 
   if(req.body.sem) toFilter.sem = req.body.sem
   if(req.body.branch)toFilter.branch = req.body.branch
   if(req.body.subject) toFilter.subject = req.body.subject
   if(req.body.exam) toFilter.exam = req.body.exam

   console.log(toFilter)

    let ids=[]
    await paper.find().then(result=>
      {
        result.forEach(paper=> {
          let insert =true
          if(toFilter.sem && paper.sem!=toFilter.sem) insert=false
          if(toFilter.branch && paper.branch!=toFilter.branch) insert=false
          if(toFilter.subject && paper.subject!=toFilter.subject) insert=false
          if(toFilter.exam && paper.exam!=toFilter.exam) insert=false
        
          if(insert) ids.push(paper.paper_id)

        });
        console.log(ids)
      })  
      let op=[]
      for(let i=0;i<ids.length;i++)
      {
        await bufsend(ids[i]).then(result=>op.push(result))
      }
      res.send(op)
   
    console.log("file found")  
})



function bufsend(id){
  return new Promise((resolve,reject)=>{
   const downloadStream = bucket.openDownloadStream( id)
    chunks=[]
   downloadStream.on('data',(chunk)=>
    {
    chunks.push(chunk) 
  })
 downloadStream.on('end',()=>{
    const buffer = Buffer.concat(chunks)
    
      const img ={
        data:buffer.toString("base64"),
        paper_id:id
      }
     resolve(img)
    
  }) 

 } 
  )
}


app.listen(5000,()=>{
  console.log("server started")
})  