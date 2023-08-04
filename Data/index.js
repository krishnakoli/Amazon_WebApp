const mongoose=require('mongoose');
const item=require('./products');
const products=require('../models/Product');

mongoose.connect('mongodb://127.0.0.1:27017/Amazon_product',{
});

const db =mongoose.connection;

db.on("error",console.error.bind(console,"Connection error"));
db.once("open",()=>{
    console.log("Database Connected");
});

const func=(async()=>{
    await products.deleteMany();
    for(let i=0;i<40;i++){
        const items=new products({
            name:item[i].name,
            image:item[i].image,
            priceCents:item[i].priceCents,
            rating:{
                stars:item[i].rating.stars,
                count:item[i].rating.count
            },
            keywords:item[i].keywords
        });
        await items.save();
    }
});

func().then(()=>{
    mongoose.connection.close();
});