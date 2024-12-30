var express = require('express');
const { check, validationResult } = require('express-validator');
const User = require('../models/userModel.js');
const bcrypt = require('bcrypt');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Bookmarker' });
});

/* GET signup page. */
router.get('/signup', function(req, res, next) {
  res.render('signup', { title: 'Sign Up', errors: [], message: null });
});

/* POST signup page. */
router.post('/signup',[
  check('email').isEmail().withMessage('Invalid E-mail address'),
  check('password').isLength({ min: 8}).withMessage('Password must be at least 8 characters long')
], function(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.render('signup', { errors: errors.array(), message: null, title: 'Sign Up' });
  }
  const { name, email, password, confirmpassword } = req.body;
  if (password !== confirmpassword) {
    return res.render('signup', { message: 'Passwords does not match', errors: [], title: 'Sign Up' });
  }
  User.findOne({ email })
    .then((existingUser) => {
      if (existingUser) {
        return res.render('signup', { message: 'E-mail is already registered', errors: [], title: 'Sign Up' });
      }
      return bcrypt.hash(password, 10);
    }).then((hashedPassword) => {
      const newUser = new User({ name, email, password: hashedPassword});
      return newUser.save();
    }).then(() => {
      res.redirect('/login');
    }).catch(error => {
      console.error(error);
    });
});

/* GET login page. */
router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Log In', errors: [], message: null });
});

/* POST login page. */
router.post('/login',[
  check('email').isEmail().withMessage('Invalid E-mail address'),
  check('password').isLength({ min: 8}).withMessage('Password must be at least 8 characters long')
], function(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.render('login', { errors: errors.array(), message: null, title: 'Log In' });
  }
  const { email, password } = req.body;
  let foundUser;
  User.findOne({ email })
  .then(user => {
    if (!user) {
      return res.render('login',{ message: 'E-mail not found', errors: [], title: 'Log In' });
    }
    foundUser = user;
    return bcrypt.compare(password, user.password);
  }).then(isPasswordValid => {
    if (!isPasswordValid) {
      return res.render('login', { message: 'Incorrect Password', errors: [], title: 'Log In'});
    }
    req.session.userId = foundUser._id;
    req.session.userName = foundUser.name;
    req.session.userEmail = foundUser.email;
    res.redirect('/users');
  }).catch(error => {
    console.error(error);
  });
});

/* GET home page. */
router.get('/about', function(req, res, next) {
  res.render('about', { title: 'About' });
});

/* GET home page. */
router.get('/contact', function(req, res, next) {
  res.render('contact', { title: 'Contact' });
});

module.exports = router;
