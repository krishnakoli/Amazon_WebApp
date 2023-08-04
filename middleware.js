isloggedin=(req,res,next)=>{
    if(!req.isAuthenticated()){
        return res.redirect('/register')
    }
    next();
}