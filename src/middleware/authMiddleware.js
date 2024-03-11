const jwt = require('jsonwebtoken')
const HttpError = require('../Models/errorModel')

const authMiddleware = async (req, res, next)=>{
    const Authorization = req.headers.Authorization || req.headers.authorization


if(Authorization && Authorization.startsWith('Bearer')){
    const token = Authorization.split(' ')[1]

    jwt.verify(token, process.env.JWT_SECRET, (err,info) => {
        if(err){
        return next (new HttpError('Unauthorized ! Invalid Token',403))
        }
        req.user = info;
        next()
    })
}else{
    console.log('dajdjdsjdjdfjjfdhjdjff')
    return next (new HttpError('Unauthorized ! Invalid Token',403))

}
}
module.exports = authMiddleware