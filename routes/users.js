var express = require('express');
const { check, validationResult } = require('express-validator');
const User = require('../models/userModel.js');
const Bookmark = require('../models/bookmarkModel.js');
var router = express.Router();

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userEmail) {
    return next();
  }
  res.redirect('/login');
};

router.get('/', isAuthenticated, function(req, res, next) {
  const name = req.session.userName || null;
  res.render('users/index', { title: 'User Area', name: name, errors: [], message: null, layout: 'layouts/userlayout' });
});

/* GET add bookmark */
router.get('/addbookmark', isAuthenticated, function(req, res, next) {
  const name = req.session.userName || null;
  res.render('users/index', { title: 'User Area', name: name, errors: [], message: null, layout: 'layouts/userlayout' });

});

/* POST add bookmark */
router.post('/addbookmark', [
  isAuthenticated,
  check('title').notEmpty().withMessage('Title cannot be empty'),
  check('url').notEmpty().withMessage('URL cannot be empty')
], function(req, res, next) {
  const name = req.session.userName || null;
  const id = req.session.userId || null;
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.render('users/index', { errors: errors.array(), message: null, title: 'User Area', name: name, layout: 'layouts/userlayout' });
  }
  const { title, url } = req.body;
  Bookmark.countDocuments({ user: id })
    .then(bookmarkCount => {
      if (bookmarkCount >= 5) {
        return res.render('users/index', { title: 'User Area', errors: [], message: 'Bookmark limit exceeded. Only 5 Bookmarks are allowed.', name: name, layout: 'layouts/userlayout' });
      }
      const newBookmark = new Bookmark({ title, url, time: Date.now(), user: id });
      newBookmark.save();
      return res.render('users/index', { title: 'User Area', errors: [], message: 'Bookmark added successfully', name: name, layout: 'layouts/userlayout' });
    }).catch((error) => {
      console.error(error);
    });
});

/* GET view bookmarks */
// router.get('/viewbookmarks', isAuthenticated, function(req, res, next) {
//   const name = req.session.userName || null;
//   const id = req.session.userId || null;
//   Bookmark.find({ user: id }).then(data => {
//     res.render('users/viewbookmarks', { title: 'User Area', data: data, name: name, layout: 'layouts/userlayout' })
//   }).catch((error) => {
//     console.error(error);
//   });
// });

/* GET view bookmarks in pagination */
router.get('/viewbookmarks', isAuthenticated, function(req, res, next) {
  const name = req.session.userName || null;
  const id = req.session.userId || null;
  const { page = 1, limit = 2 } = req.query;
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
  Bookmark.paginate({ user: id }, options).then(data => {
    res.render('users/viewbookmarks', { title: 'User Area', data: data.docs, pagination: data, name: name, layout: 'layouts/userlayout' })
  }).catch((error) => {
    console.error(error);
  });
});

/* GET edit bookmark */
router.get('/editbookmark/:id', isAuthenticated, function(req, res, next) {
  const name = req.session.userName || null;
  const bookmarkId = req.params.id;
  Bookmark.findById(bookmarkId)
    .then(data => {
      res.render('users/edit', { title: 'User Area', data: data, name: name, errors: [], message: null, layout: 'layouts/userlayout'});
    }).catch((error) => {
      console.error(error);
    });
});

/* POST edit bookmark */
router.post('/editbookmark/:id', [
  isAuthenticated,
  check('titleedit').notEmpty().withMessage('Title cannot be empty'),
  check('urledit').notEmpty().withMessage('URL cannot be empty')
], function(req, res, next) {
  const name = req.session.userName || null;
  const id = req.session.userId || null;
  const bookmarkId = req.params.id;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    Bookmark.findById(bookmarkId)
      .then(data => {
        return res.render('users/edit', { errors: errors.array(), message: null, title: 'User Area', name: name, data: data, layout: 'layouts/userlayout' });
      }).catch((error) => {
        console.error(error);
      });
      return;
  }
  const { titleedit, urledit } = req.body;
  Bookmark.findByIdAndUpdate(bookmarkId, { title: titleedit, url: urledit })
    .then(() => {
      res.redirect('/users/viewbookmarks');
    })
    .catch((error) => {
      console.error(error);
    });
});

/* GET delete bookmark */
router.get('/deletebookmark/:id', isAuthenticated, function(req, res, next) {
  const name = req.session.userName || null;
  const bookmarkId = req.params.id;
  Bookmark.findByIdAndDelete(bookmarkId)
    .then(data => {
      res.redirect('/users/viewbookmarks');
    }).catch((error) => {
      console.error(error);
    });
});

/* Search */
router.get('/search', isAuthenticated, function(req, res, next) {
  const name = req.session.userName || null;
  const id = req.session.userId || null;
  const searchQuery = req.query.searchQuery ? String(req.query.searchQuery).trim() : '';
  if (!searchQuery) {
    if (req.xhr || req.headers.accept.includes('application/json')) {
      return res.json({ bookmarks: [] });
    }
    return res.render('users/search', { 
      bookmarks: [], 
      name: name, 
      title: 'Search',
      layout: 'layouts/userlayout' 
    });
  }
  Bookmark.find({
    user: id,
    $or: [
      { title: { $regex: searchQuery, $options: 'i' } },
      { url: { $regex: searchQuery, $options: 'i' } } 
    ]
  })
    .then(bookmarks => {
      if (req.xhr || req.headers.accept.includes('application/json')) {
        return res.json({ bookmarks: bookmarks });
      }
      res.render('users/search', { 
        bookmarks: bookmarks,
        name: name, 
        title: 'Search',
        layout: 'layouts/userlayout' 
      });
    })
    .catch((error) => {
      console.error('Search error:', error);
      if (req.xhr || req.headers.accept.includes('application/json')) {
        return res.status(500).json({ error: 'Search failed' });
      }
      res.render('users/search', { 
        bookmarks: [],
        name: name, 
        title: 'Search',
        layout: 'layouts/userlayout' 
      });
    });
});

/* GET view profile */
router.get('/profile', isAuthenticated, function(req, res, next) {
  const name = req.session.userName || null;
  const email = req.session.userEmail || null;
  res.render('users/profile', { title: 'Profile', name: name, email: email, layout: 'layouts/userlayout' })
});

/* GET logout */
router.get('/logout', function(req, res, next) {
  req.session.destroy((error) => {
    if (error) {
      console.log(error);
    }
    else {
      res.redirect('/login');
    }
  })
});

/* GET view about */
router.get('/about', isAuthenticated, function(req, res, next) {
  const name = req.session.userName || null;
  res.render('users/about', { title: 'About', layout:'layouts/userlayout', name: name })
});

/* GET view contact */
router.get('/contact', isAuthenticated, function(req, res, next) {
  const name = req.session.userName || null;
  res.render('users/contact', { title: 'Contact', layout:'layouts/userlayout', name: name })
});

module.exports = router;
