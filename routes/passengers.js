const express = require('express')
const router = express.Router()
const Passenger = require('../models/User')

router.get('/all', async(req,res) => {
    try{
        const passengers = await Passenger.find()
        res.json(passengers)
    }
    catch(err){
        res.send('Error : ' + err)
    }
})

router.get('/:id', async(req,res) => {
    try{
        const passenger = await Passenger.findById(req.params.id)
        if(req.body.password === passenger.password){
            res.json(passenger)
            res.send("<h2> Success </h2>")
        }
        else{
            res.send("Incorrect username or password")
        }
    }
    catch(err){
        res.send("<h2 style = 'color : red'>Enter valid id</h2>")
    }
})

router.post('/', async(req,res) => {
    const passenger = new Passenger({
        _id : req.body.username,
        name : req.body.name,
        password : req.body.password
    })
    try{
        const a1 = await passenger.save()
        // res.json(a1)
        res.send('Success')
    }catch(err){
        res.send('Error : ' + err)
    }
})

// router.patch('/:id', async(req,res) => {
//     try{
//         const alien = await Alien.findById(req.params.id)
//         if(req.body.name)
//             alien.name = req.body.name
//         if(req.body.tech)
//             alien.tech = req.body.tech  
//         if(req.body.sub)
//             alien.sub = req.body.sub 
//         const a1 = await alien.save()
//         res.json(a1)
//     }catch(err){
//         res.send('Error : ' + err)
//     }
// })

router.delete('/:id', async(req,res) => {
    try{
        const passenger = await Passenger.findByIdAndDelete(req.params.id)
        const p1 = await passenger.remove()
        res.json(passenger)
    }catch(err){
        res.send('Error : ' + err)
    }
})

module.exports = router;