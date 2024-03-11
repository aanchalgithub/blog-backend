const mongoose = require('mongoose')

async function getConnect(){
    try {
        var data = await mongoose.connect('mongodb+srv://ibyte_user:smR4wnQJCZumlju3@cluster0.1g33s5t.mongodb.net/iByte_blogDB')
        await data.save
        console.log('DataBase is connected');
    } catch (error) {
        console.log(error);
    }
}

module.exports = getConnect