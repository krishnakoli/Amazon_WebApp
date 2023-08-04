const express=require('express');
const app=express();
const ejsmate=require('ejs-mate');
const Products=require('./models/Product');
const user=require('./models/user');
const mongoose=require('mongoose');
const item=require('./Data/products');
const passport=require('passport'); 
const localstrategy=require('passport-local');
const Mongodbstore=require('connect-mongo');
const session=require('express-session');
const flash=require('connect-flash');
const expresserror=require('./utility/expresserror');
const wrapasync=require('./utility/asyncerror');


mongoose.connect('mongodb://127.0.0.1:27017/Amazon_product',{
    useNewUrlParser:true,
    useUnifiedTopology:true, 
})
.then(()=>
    console.log("Working")
)
.catch((error)=>
    console.error(error))

const db=mongoose.connection;
db.on("error",console.error.bind(console,"connection error:"));
db.once("open",()=>{
    console.log("Database connected");
});


app.set('view engine','ejs');
const path=require('path');
const { Console, error } = require('console');
app.set('views',path.join(__dirname,'/views'));
app.use(express.static(__dirname +'/views' ));
app.engine('ejs',ejsmate);
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended:true}));
app.use(flash());

const sessionconfig={
    store:Mongodbstore.create({
        mongoUrl:'mongodb://127.0.0.1:27017/Amazon_product'
    }),
    secret:'thisshouldbebettersecret',  
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true,
        expires:600000,
    }  
}
app.use(session(sessionconfig));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localstrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());


app.use(wrapasync(async function (req, res, next) {
    if(req.session.passport){
        const User=await user.findByUsername(req.session.passport.user)    
        res.locals.count=User.product_id.length;
    }
    res.locals.total_price;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
}));

const isloggedin=(req,res,next)=>{
    if(!req.isAuthenticated()){
        return res.redirect('/login');
    }
    next();
};


app.get('/home',wrapasync(async (req,res)=>{
    const items=await Products.find({});
    res.render('home',{items});
}));


app.get('/orders',wrapasync(async(req,res)=>{
    if(req.session.passport){
        const items=[];
        const User=await user.findByUsername(req.session.passport.user);
        if(!User.product_id.length){
            console.log(User.quantity);
            while(User.quantity.length){
                User.quantity.pop()
            }
            console.log(User.quantity);
            User.save();
            res.render('empty_cart');
        }
        else{
        for (let i = 0; i <User.product_id.length; i++) {
            const product=await Products.findById(User.product_id[i]);
            items[i]=product;
        }
        const quantity=User.quantity;
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        res.render('cart',{items,quantity,total_price:0,months,weekday});
    }

}
}));

app.get('/register',(req,res)=>{
    res.render('./user/register');
});

app.get('/login',(req,res)=>{
    res.render('./user/login');
});

app.post('/orders/purchase',wrapasync(async(req,res)=>{
    if(req.session.passport){
        const User=await user.findByUsername(req.session.passport.user);
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        res.render('thanks',{User,months,weekday});
    }
}));

app.post('/register',wrapasync(async(req,res)=>{
    const {username,email,password}=req.body;
    const User=new user({username,email});
    await user.register(User,password);
    req.session.user=User;
    User.save();
    req.flash('success',"Register Successfully");
    res.redirect('/home');
}));

app.post('/login',passport.authenticate('local',{failureFlash:true,failureRedirect:'/login'}),(req,res)=>{
    req.flash('success',`Welcome back ${req.session.passport.user}`);
    res.redirect('/home');
});


app.post('/orders/:id',isloggedin,wrapasync(async (req,res,next)=>{    
    const id=req.params.id;
    const {quantity}=req.query;
    const product = await Products.findById(id);
    if(req.session.passport){
        const User=await user.findByUsername(req.session.passport.user)
         User.product_id.push(id);
         User.quantity.push(quantity);
        User.save();    
    }
    req.flash('success','Added Succesfully');
    res.redirect('/home');   
    
}))

app.get('/orders/:id/delete',async(req,res)=>{
    const {id}=req.params;  
        if(req.session.passport){
        const User=await user.findByUsername(req.session.passport.user);
        let j;
        for(let i=0;i<User.product_id.length;i++){
            if(User.product_id[i]==id && i==User.product_id.length-1){
                User.product_id.pop();
                break;
            }
            if(User.product_id[i]==id){
              j=i;
              break;  
            }
        }
        if(j<User.product_id.length-1){
        for(j;j<User.product_id.length-1;j++){
            User.product_id[j]=User.product_id[j+1]
        }
        User.product_id.pop();
    }
    await User.save();
    console.log(User.product_id);
    }
    req.flash('success','Removed Succesfully');
    res.redirect("/orders");
});

app.all('*',(req,res,next)=>{
   throw new expresserror('OHHHHHH something is wrong.......',400);
});

app.use((err,req,res,next)=>{
    const {statuscode= 400,message='Something went wrong'}=err;
    res.status(statuscode).render('Error',{message}); 
})

app.listen(3000,()=>{
    console.log("Server is Set!")
})