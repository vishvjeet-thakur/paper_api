
const mongoose = require("mongoose")

const papers = new mongoose.Schema({
    branch:{
        type:String
    },
    sem:{
        type:String
    },
    subject:{
       type:String
    },
   exam:{
    type:String
   },
   paper_id:{
    type:mongoose.Types.ObjectId
   }
})

const paper = new mongoose.model('paper',papers)

module.exports = {paper}