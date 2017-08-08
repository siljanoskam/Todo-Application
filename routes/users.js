var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');
var Todo = require('../models/todo');    

router.get('/home', function(req, res) {
    res.render('home');
})

// Register
router.get('/register', function(req, res){
	res.render('register');
});

// Login
router.get('/login', function(req, res){
	res.render('login');
});

// Register User
router.post('/register', function(req, res){
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	// Validation
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();  // Returns synchronous errors in the form of an array, or an object that maps parameter to error in case mapped is passed as true. If there are no errors, the returned value is false.

	if(errors){
		res.render('register', {
			                     errors:errors   // gi pushtame errors vo view-to
		                       });
	} 
    
    else {
		var newUser = new User({
			name: name,
			email:email,
			username: username,
			password: password
		});

		User.createUser(newUser, function(err, user) {
			if(err) throw err;
			console.log(user);
		});

		req.flash('success_msg', 'You are registered and can now login');

		res.redirect('/users/login');
	}
});

passport.use(new LocalStrategy(function(username, password, done) {
    
   User.getUserByUsername(username, function(err, user){
       
   	if(err) throw err;
       
   	if(!user) {
   		return done(null, false, {message: 'Unknown User'});
   	}

   	User.comparePassword(password, user.password, function(err, isMatch) {
   		if(err) throw err;
        
   		if(isMatch) {
   			return done(null, user);
   		} 
        
        else {
   			return done(null, false, {message: 'Invalid password'});
   		}
   	});
   });
  }));

//Determines, which data of the user object should be stored in the session
passport.serializeUser(function(user, done) {  
  done(null, user.id);  // saved to session req.session.passport.user
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {  // user object attaches to the request as req.user
    done(err, user);
  });
});

// LOGIN
router.post('/login', 
  passport.authenticate('local', {successRedirect:'/', failureRedirect:'/users/login', failureFlash: true}),
  function(req, res) {
    console.log(req.passport.session.id);
    res.redirect('/');
  });

//GET addTodo VIEW
router.get('/addTodo', function(req, res) {

    res.render('addTodo');
        
});

// CREATE TODO
router.post('/addTodo', function(req, res) {
    
    var todo = req.body.todo;
    userId = req.session.passport.user;
    todo = req.body.todo;
    isDone = req.body.isDone;
    
    //Validation
    req.checkBody('todo', 'Todo is required').notEmpty();
    
    var errors = req.validationErrors();
    
    if(errors){
        
		res.render('addTodo',{
			errors: errors   // gi pushtame errors vo view-to
		});
        
	} 
    
    else {
        
        // kreirame nov objekt od Todo modelot
        var item = new Todo({
            creator: userId,
            todo: todo,
            isDone: isDone
        });
    
        // proverka za checkbox-ot isDone
        if(req.body.isDone == undefined) {
            item['isDone'] = false;
        }

         item.save(function(err) {
            if(err) throw err;
            });
        
         req.flash('success_msg', 'Todo was successfully added.');
    
         res.redirect('/users/todos');
        
    }
     
});

//READ TODOS FOR CURRENT USER
router.get('/todos', function(req, res) {
   
    userId = req.session.passport.user;
    
    Todo.find().populate('creator', '_id', null, {sort: {_id: -1}}).exec(function(err, todos) {
        
        var items = [];
        
        for (var i = 0; i < todos.length; i++) {
            
            if(todos[i].creator._id == userId) {
             
               items.push({"id": todos[i]._id, "todo": todos[i].todo, "isDone": todos[i].isDone});
            }
        }
        
        res.render('listTodos', {items});
        
    });
});

// DELETE TODO
router.post('/todos', function(req, res, next) {
    
    Todo.findByIdAndRemove(req.body.id, function(err) {
        
        if(err) throw err;
        
        req.flash('success_msg', 'Todo was successfully deleted!');
        res.redirect('/users/todos');
    });
});

//GET TODO BY ID
router.get('/todo/:id', function(req, res) {
    
    Todo.findById({_id: req.params.id}, function(err, todo) {
        if(err) throw err;
        
        res.render('updateTodo', {
                                    id: todo['_id'],
                                    todo : todo['todo'],
                                    isDone : todo['isDone']                                    
                                 });
    });
});

//UPDATE TODO
router.post('/todo/update', function(req, res) {
    
    Todo.findByIdAndUpdate(req.body.id, { 
                todo: req.body.todo, 
                isDone: req.body.isDone
            }, function(err, todos) {
                
                if (err) throw err;
                
                req.flash('success_msg', 'Todo was successfully updated.')
                res.redirect('/users/todos');
            });
});

// LOGOUT
router.get('/logout', function(req, res){
	req.logout();  // ovde vo req imame user i avtomatski logout se primenva na user-ot sho e zacuvan vo tekovnata sesija

	req.flash('success_msg', 'You are logged out');

	res.redirect('/users/home');
});

module.exports = router;