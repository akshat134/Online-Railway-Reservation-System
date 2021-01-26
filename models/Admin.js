const mongoose = require('mongoose')
var passportLocalMongoose = require("passport-local-mongoose");

const adminSchema = new mongoose.Schema({
    username : {
        type : String
    },
    password : {
        type : String
    }
})

adminSchema.plugin(passportLocalMongoose,{usernameField:'username'});
module.exports = mongoose.model('Admin', adminSchema)