const mongoose=require('mongoose');

const productSchema=new mongoose.Schema({
    name:String,
    image:String,
    rating:
        {
            stars:Number,
            count:Number
        },
        priceCents:Number,
    KeyWords: [{
        type: String
    }]
})
module.exports=mongoose.model('Product',productSchema);