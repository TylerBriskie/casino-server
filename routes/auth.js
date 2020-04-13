var express = require('express');
const bcrypt = require ('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();
const { check, validationResult } = require('express-validator');

// LOCAL IMPORTS
const User = require('../models/User');




// ROUTES ***************************************************************************************************************************************************

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.render('login', {
        title: 'Login',
    });
});


/* USER LOGIN */
router.post('/login', (req, res, next)=> {

    let userData = req.body;
    console.log('looking up email - "'+userData.username + '"');


    User.findOne({email: userData.username}, (err, user) => {
        if (err){
            console.log("error!  Code 72ne82n90w, error logging in: ", err)
        } else {
            console.log(user);
            if (!user){
                res.status(401).send("Email Not Found");
            } else {
                bcrypt.compare(userData.password, user.password, (err, login) => {
                    if (login){
                        let payload = { subject: user._id};
                        let token = jwt.sign(payload, process.env.JWT_SECRET);
                        res.cookie('token', token);
                        res.redirect('/form');
                    } else {
                        res.status(403).send('password incorrect');
                    }
                })
            }
        }
    })
});

router.post('/signup',
    // VALIDATION / MIDDLEWARE
    [
        check('email', 'Email is Required').isEmail(),
        check('display_name')
            .not()
            .isEmpty()
            .withMessage('Display Name is required'),
        check('password', 'Password is requried')
            .isLength({ min: 6 })
            .custom((val, { req, loc, path }) => {
                if (val !== req.body.confirm_password) {
                    throw new Error("Passwords don't match");
                } else {
                    return val;
                }
            })
    ], 
    // ACTION CALLBACK
    (req, res, next) => {

        const errors = validationResult(req).array();


        // IF THERE ARE ERRORS, SEND THEM
        if (errors.length > 0){
            console.log('Error!');
            res.status(500).send(errors);

        // VALIDATION PASSED ...
        } else {
            // CHECK TO MAKE SURE USER WITH THAT EMAIL DOESNT ARLEADY EXIST
            let userData = req.body;

            console.log('looking up email - "'+userData.email + '"');
    
            User.findOne({email: userData.email}, (err, user) => {
                if (err){
    
                    console.log("error creating new user: ", err)
                    res.send(err);
                } else {
                    if (!user){
                        // CREATE NEW USER

                        bcrypt.hash(userData.password, 10, function(err, hash) {
                            // Store hash in your password DB.
                            if (err){
                                res.status(500).send(err);
                            } else {
                                console.log('user created');
                                User.create({
                                    email: userData.email,
                                    password: hash,
                                    display_name: userData.display_name,
                                    credits: 5000,
                                    date_created: new Date(),
                                    date_updated: new Date()
                                })
                                res.status(201).send('New User Created');
                            }

                       

                        });

                        // User.create({

                        // })
    
    
                    } else {
                        console.log('A user with email address ' + user.email + ' already exists');
                        res.send('A user with email address ' + user.email + ' already exists');
                    }
    
    
                }
            })
        }
    })

module.exports = router;
