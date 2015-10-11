// courseServer.js
// This is the initial commit for course microservice CRUD operations

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

var mongoose   = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/mydb'); // connect to our database

var Course     = require('./app/models/course');

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});

//For courses
router.route('/courses')

    //Add student to course (accessed at POST http://localhost:8080/api/courses)
    //Schema for post: name, course, id, type(create, update, delete), newid
    .post(function(req, res) {

        if(req.body.type == 'create')
        {
            var courseName =  req.body.course;  
       	    Course.findOne( {'course' : courseName} ,function(err, courses) 
            {    
                if (err)
                    console.log("error")

                //Create Course if it doesn't exist
                if(!courses)
                {
                    courses = new Course();
                    courses.course = courseName;
                }

                //check if ID already exists Do Nothing
                if(courses.idLists.indexOf(req.body.id) !== -1) 
                {
                    console.log("Student Exists");
                    res.json({ message: 'Student exists' });
                    return;
                }

                //Append the course if it doesnt exist
        	   courses.idLists.push(req.body.id);
        	   console.log(courses.idLists)

                courses.save(function(err) {
                if (err)
                    res.send(err);

                res.json({ message: 'Added student to course' });
                });
            });
        }
        else if(req.body.type == 'update')
        {
            //check if id exists. If it does, replace
            var courseName =  req.body.course;  
            Course.findOne( {'course' : courseName} ,function(err, courses) 
            {
                if (err)
                    console.log("error")

                //Check if course exists. Do nothing
                if(!courses || !req.body.newid)
                {
                    console.log("Course Doesnt Exist or New Id error");
                    res.json({ message: 'Course Doesnt Exist or New Id error' });
                    return;
                }

                //check if ID doesnt exist Do Nothing
                var indexOfId = courses.idLists.indexOf(req.body.id);
                if(indexOfId === -1) 
                {
                    console.log("Student Doesnt Exist");
                    res.json({ message: 'Student Doesnt Exist' });
                    return;
                }

                var arr = courses.idLists;
                arr[indexOfId] = req.body.newid;
                
                Course.findOne( {'course' : courseName} ,function(err, allcourses) 
                {
                    if(!err) {
                        allcourses.idLists = arr;
                        allcourses.save(function(err){
                            if(!err)
                            {
                                console.log("UPDATED");
                                res.send("UPDATED");
                            }
                            else
                            {
                                console.log("ERROR");
                                res.send("error");
                            }
                        });
                    }
                });
            });
        }
        else if(req.body.type == 'delete')
        {
            //check if id exists. If it does, delete
            var courseName =  req.body.course;  
            Course.findOne( {'course' : courseName} ,function(err, courses) 
            {
                if (err)
                    console.log("error")

                //Check if course exists. Do nothing
                if(!courses)
                {
                    console.log("Course Doesnt Exist");
                    res.json({ message: 'Course Doesnt Exist' });
                    return;
                }

                //check if ID doesnt exist Do Nothing
                var indexOfId = courses.idLists.indexOf(req.body.id);
                if(indexOfId === -1) 
                {
                    console.log("Student Doesnt Exist");
                    res.json({ message: 'Student Doesnt Exist' });
                    return;
                }

                var i,j;
                arr = [];
                arr1 = [];
                arr2 = [];
                arr1 = courses.idLists.splice(0,indexOfId);
                arr2 = courses.idLists.splice(indexOfId, courses.idLists.length);
                console.log(arr1);
                console.log(arr2);
                for(var i=0; i<arr1.length; i++)
                    arr.push(arr1[i]);
                for(var i=0; i<arr2.length; i++)
                    arr.push(arr2[i]);
                console.log(arr);
                Course.findOne( {'course' : courseName} ,function(err, allcourses) 
                {
                    if(!err) {
                        allcourses.idLists = arr;
                        allcourses.save(function(err){
                            if(!err)
                            {
                                console.log("DELETED");
                                res.send("DELETED");
                            }
                            else
                            {
                                console.log("ERROR");
                                res.send("error");
                            }
                        });
                    }
                });
            });
        }
        else
        {
            res.json({ message: 'Invalid type: choose (create/update/delete)' });   
            console.log("Invalid type: choose (create/update/delete)");
        }
    })

    //Read ids for particular course (accessed at GET http://localhost:8080/api/courses)
    .get(function(req, res) {
        Course.find(function(err, courses) {
            if (err)
                res.send(err);

            console.log(courses);
            res.json(courses);
        });
    });

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);