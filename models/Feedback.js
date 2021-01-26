const mongoose = require('mongoose')
var passportLocalMongoose = require("passport-local-mongoose");

const feedbackSchema = new mongoose.Schema({
    username : String,
    name : String,
    rating : Number,
    comments : String
})

module.exports = mongoose.model('Feedback', feedbackSchema)