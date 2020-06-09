var express = require('express');
var router = express.Router();

// LOCAL IMPORTS
const User = require('../models/User');




/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


router.get('/player-info', function(req, res, next) {
  console.log('retrieving info for player ' + req.query.id)
  User.findOne({_id:  req.query.id}, (err, user) => {
    if (err){
      console.log('error: code 7278s98c, couldnt find requested user')
    } else {
      const resBody = {
        email: user.email,
        credits: user.credits,
        display_name: user.display_name
      }
      res.status(200).send(resBody)      
    }
  })
});

router.post('/create', function(req, res, next) {
  res.send('hi lets create you');
});



module.exports = router;
