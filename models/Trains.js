const mongoose = require('mongoose')
var passportLocalMongoose = require("passport-local-mongoose");

const trainSchema = new mongoose.Schema({
    name : String,
    number : Number,
    source : String,
    destination : String,
    seats : Number,
    date : String,
    time : String,
    fare : Number,
    duration : String
})

// userSchema.plugin(passportLocalMongoose,{usernameField:'username'});
module.exports = mongoose.model('Trains', trainSchema)