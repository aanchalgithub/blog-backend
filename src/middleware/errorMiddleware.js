//Unsupported (404) routes
const notFound = (req, res, next) =>{
    const error = new Error(`Not Found - ${req.orignalUrl}`)
    res.status(400)
    next(error)
}

//Middle ware to handle errors
const errorHandler = (error, req, res, next)=> {
    if(res.headerSent){
        return next(error)
    }
    res.status(error.code || 500).json({message : error.message || 'An unknown Error Occured'})
}

module.exports = {notFound, errorHandler }