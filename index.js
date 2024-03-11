const express = require('express')
const getConnect = require('./src/utils/getConnect')
const cors = require('cors')
const userRoutes = require('./src/Route/userRoutes')
const postRoutes = require('./src/Route/postRoutes')
const  {notFound, errorHandler}  = require('./src/middleware/errorMiddleware')
require('dotenv/config')
const upload= require('express-fileupload')

const app = express()

app.use(express.json({extended : true}))
app.use(express.urlencoded({extended : true}))
app.use(cors({Credentials : true, origin : 'http://localhost:3000'}))
app.use(upload())

// app.get('/',(req,res)=>{
//     res.send('kkk')
// })
app.use('/api/users',userRoutes)
app.use('/api/posts',postRoutes)

app.use(notFound)
app.use(errorHandler)
app.use('/uploads',express.static(__dirname + '/uploads'))

app.listen(5000,()=>{
    console.log('Server is running at post 5000')
    getConnect()
})