const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const config = require('config');
const methodOverride = require("method-override");
const flash = require("connect-flash");

const app = express();

//API
// const apiRoute = require('./routes').route

//Getting the DB
const connectDB = require('./data/db');

//Trains
// const {initialiseTrains} = require("./utils/Trains")

//Set Time of Start
// const { SetSystemTime } = require('./utils/SystemTime')

//PassportJS
const passport = require("passport");
const LocalStrategy = require("passport-local");

//Models
const User = require("./models/User");
var Trains = require("./models/Trains");
var Feedback = require("./models/Feedback");
var Admin = require("./models/Admin");

// database connect
connectDB();


// let d = new Date();
// let init = d.getTime();
// SetSystemTime(init);

//app setup
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname+"/public"));
app.use(express.json())
app.use(methodOverride('_method'));
app.use(flash());
//auth config
app.use(session({
	secret:"HackFinity",
	resave:false,
	saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
})
//middleware
function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next()
	}else{
		req.flash("error", "You need to be logged in to do that.")
		res.redirect('/login');
	}
}
//Base Display Route
app.get("/", (req,res) => {
	res.render("home",{currentUser:req.user});
})

//Register Routes
app.get("/show/:username",isLoggedIn,(req,res) => {
	User.findOne({username : req.params.username},function(err,user){
		if(err){
			console.log(err);
			req.flash("error", "Sorry.User not found.")
			res.redirect("/");
		}else{
            Trains.find({}, function(err, data) {
                req.flash("success", "Welcome to Railway Reservation Portal, "+ user.username);
                res.render('profile', {
                    user : user,
                    trains : data
                });
            });
			
			// res.render("profile",{user:user});
		}
	})
});
// Need to add IsAdminLoggedIn later
app.get("/admin", (req,res) => {
	Trains.find({}, function(err, trainData) {
		User.find({}, function(err, userData) {
			Feedback.find({}, function(err, feedbackData) {
				req.flash("success", "Welcome to Railway Reservation Portal, "+ "admin");
				res.render('admin', {
					feedbacks : feedbackData,
					users : userData,
					trains : trainData
				});
			});
		});
	});
});

app.post("/admin", (req,res) => {
	if(req.body.username !== "admin" || req.body.password !== "dtu@admin"){
		console.log(req.body.username);
		console.log(req.body.password);
		req.flash("error", "Couldn't authenticate!");
		res.redirect("/");
	}
	else{
		Trains.find({}, function(err, trainData) {
			User.find({}, function(err, userData) {
				Feedback.find({}, function(err, feedbackData) {
					req.flash("success", "Welcome to Railway Reservation Portal, "+ req.body.username);
					res.render('admin', {
						feedbacks : feedbackData,
						users : userData,
						trains : trainData
					});
				});
			});
		});
	}
});
app.post("/register",(req,res) => {
    if(req.body.username === ""){
        req.flash("error", "You need to fill the username.");
        return res.redirect("/");
	}
	else if(req.body.password === ""){
        req.flash("error", "You need to fill the password.");
        return res.redirect("/");
	}
	else if(req.body.email === ""){
        req.flash("error", "You need to fill the email ID.");
        return res.redirect("/");
	}
	else if(req.body.username === ""){
        req.flash("error", "You need to fill the mobile number.");
        return res.redirect("/");
	}
    else{
        let newUser = new User({username:req.body.username, password:req.body.password, name:req.body.name || "NA", age:req.body.age || 0, gender : req.body.gender || "NA", email : req.body.email || "NA", mobile : req.body.mobile || 0, balance : req.body.balance});
        User.register(newUser, req.body.password, (err,user) => {
            if(err){
                console.log(err);
                if(err.message=="A user with the given username is already registered"){
                    req.flash("error", "A user with the given username is already registered");
                }else{
                    req.flash("error", err.message);
                }
                return res.redirect("/")
            }
            passport.authenticate("local")(req,res,() => {
                req.flash("success", "Successfully registered");
                res.redirect("/show/"+user.username);
            })
        })
    }
})

// Reservation Route

app.post("/reservation", (req,res) => {	
    User.findOne({username : req.body.username},function(err,user){
		if(err){
			console.log(err);
			req.flash("error", "Sorry.User not found.")
			res.redirect("/show/" + username);
			return;
		}else{
			var fare = req.body.fare;
			var oldSeats = req.body.seats;
			if(oldSeats == 0){
				req.flash("error", "Sorry. All seats are already booked.")
				res.redirect("/show/"+user.username);
				return;
			}
			else{
				var newSeats = oldSeats - 1;
				if(fare > user.balance){
					req.flash("error", "Sorry. Not enough balance.")
					res.redirect("/show/"+user.username);
					return;
				}
				var object = {
					name : req.body.name,
					number : req.body.number,
					source : req.body.source,
					destination : req.body.destination,
					date : req.body.date,
					time : req.body.time,
					duration : req.body.duration
				}
				console.log(object);
				user.bookings.push(object);
				console.log(user);
				var newBal = user.balance - fare;
				User.findOneAndUpdate({username : req.body.username}, {bookings: user.bookings, balance : newBal}, {returnOriginal: false}, function(err,newUser) {
					if (err) { throw err; }
					else { 
						Trains.findOneAndUpdate({number : req.body.number}, {seats : newSeats}, {returnOriginal: false}, function(err,train) {
							if(err){throw err;}
							else{
								Trains.find({}, function(err, data) {
									req.flash("success", "Reservation Successful");
									res.redirect("/show/"+req.body.username);
								});	
							}
						})
					}
				});
			}
			  			
		}
	})
})

// Add Money User

app.post("/addMoney", (req,res) => {
	User.findOne({username : req.body.username}, function(err,user){
		if(err){
			console.log(err);
			req.flash("error", "Error!");
			res.redirect("/show/" + req.body.username);
		}
		else{
			var bal = parseInt(user.balance);
			var add = parseInt(req.body.money);
			var newBal = bal + add;
			User.findOneAndUpdate({username : req.body.username}, {balance: newBal}, {returnOriginal: false}, function(err,newUser) {
				if (err) { throw err; }
				else { 
					console.log(newUser);
					Trains.find({}, function(err, data) {
						req.flash("success", "Successfully added money for "+ newUser.username);
						res.redirect("/show/"+req.body.username);
					});	
				}
			});
		}
	})
})

// Edit User Details

app.post("/editDetails", (req,res) => {
	// User.findOne({username : req.body.username},function(err,user){
	// 	if(err){
	// 		console.log(err);
	// 		req.flash("error", "Sorry.User not found.")
	// 		res.redirect("/");
	// 	}else{
	// 		user.setPassword(req.body.password, function(){
	// 			if(err){
	// 				console.log(err);
	// 				req.flash("error", err);
	// 			}
	// 		})	
	// 		user.save(function(err){
	// 			if(err){
	// 				console.log(err);
	// 				req.flash("error", err);
	// 			}
	// 			req.login(user, function (err) {
	// 				if (err) return res.status(200).json({success: false});
	// 				return res.status(200).json({success: true});
	// 			});

	// 		})		
	// 	}
	// })
	User.findOneAndUpdate({username : req.body.username}, {name: req.body.name, password: req.body.password, email: req.body.email, mobile: req.body.mobile, age: req.body.age, gender: req.body.gender}, {returnOriginal: false}, function(err,newUser) {
		if (err) { throw err; }
		else { 
			console.log(newUser);
			Trains.find({}, function(err, data) {
				req.flash("success", "Successfully updated details for "+ newUser.username);
				res.redirect("/show/"+req.body.username);
			});	
		}
	});
})

// Cancel Reservation
app.post("/cancelReservation", (req,res) => {
	User.findOne({username : req.body.username}, function(err,user){
		if(err){
			req.flash("error", "User not found");
			res.redirect("/");
		}
		else{
			Trains.findOne({number : req.body.number}, function(err,train){
				if(err){
					req.flash("error", "Train not found");
					res.redirect("/");
				}
				else{
					var oldBal = user.balance;
					var fare = train.fare;
					var oldSeats = train.seats;
					var newSeats = oldSeats + 1;
					var newBal = oldBal + fare;
					var bookingsArr = user.bookings;
					User.updateOne({username : req.body.username}, {$pull : {bookings : {number : req.body.number}}}, {new:true, multi:false}, function(err,updatedUser){
						if(err){
							console.log(err);
						}
						else{
							console.log(updatedUser);
						}
					});
					User.findOneAndUpdate({username : req.body.username}, {balance : newBal}, {returnOriginal: false}, function(err,newUser) {
						if (err) { throw err; }
						else { 
							console.log(newUser);
							Trains.findOneAndUpdate({number : req.body.number}, {seats : newSeats}, {returnOriginal: false}, function(err,train) {
								if (err) { throw err; }
								else { 
									req.flash("success", "Reservation cancelled and refund processed.");
									res.redirect("/show/"+req.body.username);										
								}
							});							
						}
					});
				}
			})
		}
	})
})

// Admin Update User
app.post("/adminUpdateUser", (req,res) => {
	User.findOneAndUpdate({username : req.body.oldusername}, {username : req.body.username, name: req.body.name, password: req.body.password, email: req.body.email, mobile: req.body.mobile, age: req.body.age, gender: req.body.gender}, {returnOriginal: false}, function(err,newUser) {
		if (err) { throw err; }
		else { 
			console.log(newUser);
			Trains.find({}, function(err, trainData) {
				User.find({}, function(err, userData) {
					Feedback.find({}, function(err, feedbackData) {
						req.flash("success", "Updated the details of "+ req.body.username);
						res.redirect("/admin");
					});
				});
			});
		}
	});
})

// Update Train
app.post("/adminUpdateTrain", (req,res) => {
	Trains.findOneAndUpdate({number : req.body.oldtrainnumber}, {number : req.body.number, name: req.body.name, source: req.body.source, destination: req.body.destination, seats: req.body.seats, date: req.body.date, time: req.body.time, fare: req.body.fare, duration: req.body.duration}, {returnOriginal: false}, function(err,newTrain) {
		if (err) { throw err; }
		else { 
			console.log(newTrain);
			Trains.find({}, function(err, trainData) {
				User.find({}, function(err, userData) {
					Feedback.find({}, function(err, feedbackData) {
						req.flash("success", "Updated the details of "+ req.body.name + " with train number : " + req.body.number);
						res.redirect("/admin");
					});
				});
			});
		}
	});
})

// Admin Add Train
app.post("/addTrain", (req,res) => {
	if(req.body.name === "" || req.body.number === "" || req.body.source === "" || req.body.destination === "" || req.body.seats === "" || req.body.date === "" || req.body.time === "" || req.body.fare === "" || req.body.duration === ""){
		req.flash("error", "Please fill all details correctly!");
		res.redirect("/admin");
		return;
	}
	Trains.findOne({number : req.body.number}, function(err,train){
		if(train){
			console.log(train);
			req.flash("error", "Train with number : " + req.body.number + " already exists!");
			res.redirect("/admin");
			return;
		}
		else{
			let newTrain = new Trains();
			newTrain.name = req.body.name;
			newTrain.number = req.body.number;
			newTrain.source = req.body.source;
			newTrain.destination = req.body.destination;
			newTrain.seats = req.body.seats;
			newTrain.date = req.body.date;
			newTrain.time = req.body.time;
			newTrain.fare = req.body.fare;
			newTrain.duration = req.body.duration;

			newTrain.save(function(err){
				if(err){
					console.log(err);
					res.redirect('/');
				}
				else{
					console.log(newTrain);
					Trains.find({}, function(err, trainData) {
						User.find({}, function(err, userData) {
							Feedback.find({}, function(err, feedbackData) {
								req.flash("success", "Added new train, "+ req.body.name + " with train number : " + req.body.number);
								res.redirect("/admin");
							});
						});
					});
				}
			})
		}
	})
	
})

//Admin Delete Train
app.post("/deleteTrain", (req,res) => {
	Trains.deleteOne({number : req.body.number}, function(err, result){
		if(err){
			console.log(err);
			req.flash("error", "Couldn't delete train.");
			res.redirect("/admin");
		}
		else{
			console.log(result);
			Trains.find({}, function(err, trainData) {
				User.find({}, function(err, userData) {
					Feedback.find({}, function(err, feedbackData) {
						req.flash("success", "Deleted train, "+ req.body.name + " with train number : " + req.body.number);
						res.redirect("/admin");
					});
				});
			});
		}
	})
})

// Feedback
app.post("/feedback", (req,res) => {
	var newFeedback = new Feedback();
	newFeedback.username = req.body.username;
	newFeedback.name = req.body.name;
	newFeedback.rating = req.body.rating;
	newFeedback.comments = req.body.comments;

	newFeedback.save(function(err){
		if(err){
			console.log(err);
			res.redirect('/');
		}
		else{
			console.log(newFeedback);
			Trains.find({}, function(err, data) {
				req.flash("success", "Feedback submitted, "+ req.body.username);
				res.redirect("/show/"+req.body.username);
			});	
		}
	})
})

//LOGIN ROUTES
app.get("/login",(req,res) => {
	req.flash("success", "Welcome to Railway Reservation Portal.");
	res.render("home")
});
app.post("/login",passport.authenticate("local",{
	failureFlash : "Oops..Authentication failed",
	failureRedirect:"/"
	}),(req,res) => {
    
    req.flash("success", "Successfully logged in.");
	res.redirect("/show/"+req.user.username);
	});
// app.get("/profile",(req,res)=>{
// 	res.render("profile");
// });
//LOGOUT ROUTES
app.get("/logout",(req,res) => {
	req.logout();
	req.flash("success", "Successfully logged out.");
	res.redirect("/");
})

//debugging routes
// app.get("/secret",(req,res) => {
// 	res.render("secret");
// })

//API routes
// app.use('/api', apiRoute)

const PORT = process.env.PORT || 5555 ||3000;

app.listen(PORT, process.env.IP, () => {
	console.log(`App Started at http://localhost:${PORT}`);
})