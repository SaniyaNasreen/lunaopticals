    const isLogin= async(req,res,next)=>{
    try {
        if(req.session.user_id){
            
        }else{
            return res.redirect('/')
        }
        next()
    } catch (error) {
        console.log(error.message);
    }
    }
    // const isAdminLogin = async (req, res, next) => {
    //     try {
    //         if (req.session.admin_id) {
    //             return res.redirect('/admin/indexhome');
    //         } else {
    //             return res.redirect('/admin/login');
    //         }
    //     } catch (error) {
    //         console.log(error.message);
    //     }
    //     next();
    // };
    

    const isLogout= async(req,res,next)=>{
        try {
            if(req.session.user_id){
            return res.redirect('/admin')
            }   
            next()
        } catch (error) {
            console.log(error.message);
        }
        }

        module.exports={
            isLogin,
            isLogout,
            // isAdminLogin
        }