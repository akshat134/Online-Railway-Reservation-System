const mongoose = require('mongoose')
var passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    username : {
        type : String
    },
    name : {
        type : String
    },
    password : {
        type : String
    },
    email : {
        type : String,
    },
    mobile : {
        type : Number,
    },
    age : {
        type : Number
    },
    gender : {
        type : String
    },
    balance : {
        type : Number
    },
    bookings:[new mongoose.Schema(
		{
            name : String,
            number : Number,
            source : String,
            destination : String,
            date : String,
            time : String,
            duration : String
		},
        { _id: false })]
})

userSchema.plugin(passportLocalMongoose,{usernameField:'username'});
module.exports = mongoose.model('User', userSchema)