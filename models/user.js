// const { string } = require('joi');
const mongoose=require('mongoose');
const passportlocalmongoose=require('passport-local-mongoose');

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        unique:true
    },
    email:{
        type:String,
        require:true,
        unique:true
    },
    product_id:[
        {type:String}
    ],
    quantity:[
        {type:Number}
    ]
});
userSchema.plugin(passportlocalmongoose);

module.exports=mongoose.model('user',userSchema); 