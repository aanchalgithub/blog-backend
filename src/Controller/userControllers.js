const bcrypt = require('bcryptjs')
const User = require('../Models/userModel')
const {v4 : uuid} = require('uuid')
const HttpError = require('../Models/errorModel')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const { log } = require('console')


//---------------------------------Register a New User-------------------------------------------
//POST : api/users/register
//Unprotected
const registerUser = async(req, res, next)=>{
    try {
        const {name, email, password, password2} = req.body
        if(!name || !email || !password){
            return next(new HttpError('Fill in all field'),422)
        }

        const newEmail = email.toLowerCase() 
        
        const emailExists = await User.findOne({email : newEmail})
        if(emailExists){
            return next(new HttpError('Email Already Exist'),422)
        }
        if((password.trim()).length < 6){
            return next(new HttpError('Password should be atleast 6 characters'),422)
        }

        if(password != password2){
            return next(new HttpError("Passwords do not match"),422)
        }

        const salt = await bcrypt.genSalt(10)
        console.log(salt);
        const hashedPass = await bcrypt.hash(password, salt)

        const newUser = await User.create({name, email: newEmail, password: hashedPass, })
        res.status(201).json(`New User ${newUser.email} registered`)
    } catch (error) {
        return next(new HttpError("User Registration failed", 422))
    }
}

//----------------------------------------LoginUser-------------------------------------------
//POST : api/users/login
//Unprotected
const loginUser = async(req, res, next)=>{
    try {
        const {email, password} = req.body
    console.log(email);
    console.log(password);
    console.log(req.body);
    if(!email || !password){
        return next(new HttpError('Fill in all field'),422)
    }

    const newEmail = email.toLowerCase()
    const user = await User.findOne({email : newEmail})

    if(!user){
        return next(new HttpError('Invalid Credentials'),422)
    }

    const comparePass = await bcrypt.compare(password, user.password)

    if(!comparePass){
        return next(new HttpError('Invalid Credentials'),422)
    }

    const {_id: id, name} = user
    const token = jwt.sign({id, name}, process.env.JWT_SECRET, {expiresIn: "1d"})
    res.status(200).json({token, id, name})

    } catch (error) {
        return next(new HttpError('Login Failed, Please check your credentials'),422)
    }
}
//---------------------------------UserProfile-------------------------------------------
//POST : api/users/:id
//Protected
const getUser = async(req, res, next)=>{
    try {
        const id = req.params.id
      
        
        const user = await User.findById(id).select('-password')
       
       
        if(!user){
            return next(new HttpError('User Not Found 404',404))
            
        }
        res.status(200).json(user)
    } catch (error) {
        console.log('JJ');
        return next(new HttpError(error))
       
       
    }
}

//--------------------------------- Change Avtar Profile (Picture)-------------------------------------------
//POST : api/users/change-avtar
//Protected
const changeAvtar = async(req, res, next) => {
    try {
        if(!req.files.avtar){
            return next(new HttpError('Please Choose an image',422))
        }
        
        //User from data base
        const user = await User.findById(req.user.id)
        console.log(req.user.id);
        // delete old photo if exist
        if(user.avtar){
            fs.unlink(path.join((__dirname, '..','uploads', user.avtar), (err) =>{
                if(err){
                    return next(new HttpError(err))
                }
            }
            ))
        }
        const {avtar} = req.files

        let filename;
        filename = avtar.name

         let splittedFilename = filename.split('.')
 
         let newFilename = splittedFilename[0] + uuid() + '.' + splittedFilename[splittedFilename.length -1]
         avtar.mv(path.join(__dirname, '..', 'uploads',newFilename), async (err)=>{
            if(err){
                return next(new HttpError(err))
            }

         

        //checking file size
        if(avtar.size > 500000){
            return next(new HttpError('Profile picture is too big, should be less than 500kb'),422)
        }

        const updatedAvtar = await User.findByIdAndUpdate(req.user.id, {avtar : newFilename}, {new : true})
        if(!updatedAvtar){
            return next(new HttpError('File could not be changed',422))
        }
        res.status(200).json(updatedAvtar)
    })
     } catch (error) {
        return next(new HttpError(error))
    }
}

//--------------------------------- Edit User Details Profile (from Profile)-------------------------------------------
//POST : api/users/edit-user
//Protected
const editUser = async(req, res, next)=> {
   const {name, email, currentPassword, newPassword, newConfirmPassword} = req.body;
   if(!email || !name || !currentPassword || !newPassword){
    return next(new HttpError('Fill in all details',422))
   }
   
   const user = await User.findById(req.user.id)
   if(!user){
    return next(new HttpError("User not Found",403))
   }

// new email doesn't already exist
   const emailExist = await User.findOne({email})
   if(emailExist && (emailExist._id != req.user.id)){
     return (next(new HttpError('Email already exist',422)))
   }

// compare current password  to db password
const validateUserPassword = await bcrypt.compare(currentPassword,newPassword);
if(validateUserPassword){
    return next(new HttpError('Invalid Current Password',422))
}
console.log('kk')
//Compare New Password
if(newPassword != newConfirmPassword){

    return next(new HttpError('New Password do not match',422))
}

//Hashed th new password
const salt = await bcrypt.genSalt(10)
const hash = await bcrypt.hash(newPassword,salt);

//update user info in database
const newInfo = await User.findByIdAndUpdate(req.user.id, {name, email, password:hash},{new : true})
res.status(200).json(newInfo)
}

//--------------------------------------Get Authors------------------------------------------------
//POST : api/users/authors
//Unprotected
const getAuthors = async(req, res, next) =>{
    try {
        const authors = await User.find().select('-password')
        res.json(authors)
    } catch (error) {
        return next(new HttpError(error))
    }
}


module.exports = {registerUser, loginUser, getUser, changeAvtar, editUser, getAuthors}