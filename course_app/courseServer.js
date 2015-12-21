
// course micro service
// BASE SETUP
// =============================================================================
// call the packages we need
var express = require('express'); // call express
var app = express(); // define our app using express
var bodyParser = require('body-parser');
var http = require('http');
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
var port = process.env.PORT || 8080; // set our port
var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/C'); // connect to our database
var Course = require('./app/models/course');

//Connect to Redis
var redis_ip_addr = '160.39.134.90'
var redis_port = '6379'
var redis = require("redis"),
    subscriber = redis.createClient(redis_port, redis_ip_addr);
subscriber.subscribe("course_channel");

publisher = redis.createClient(redis_port, redis_ip_addr);

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({
        message: 'Course Service running'
    });
});

//If message received from RI to add/remove courses from students
subscriber.on("message", function(channel, msg) {
    console.log("Received messsage : ", msg);
    message = JSON.parse(msg);
    Course.findOne({
        'course_id': message.course_id
    }, function(err, courses) {
        if (err) {
            console.log("error")
        }

        //Create Course if it doesn't exist
        if (!courses) {
            console.log("Course doesn't exist");
            return;
        }

        if (message.type == 'add') {
            //check if ID already exists Do Nothing
            if (courses.idLists.indexOf(message.student_id) !== -1) {
                console.log("Student Exists");
                return;
            }
            //Append the course if it doesnt exist
            courses.idLists.push(message.student_id);
            courses.save(function(err) {
                if (!err) {
                    console.log("Added student to course " + message.course_id);
                } else {
                    console.log("Error");
                    return;
                }
            });
        } else {
            //check if ID doesnt exist Do Nothing
            var indexOfId = courses.idLists.indexOf(message.student_id);
            if (indexOfId === -1) {
                console.log("Student Doesnt Exist");
                return;
            }
            courses.idLists.splice(indexOfId, 1);
            courses.save(function(err) {
                if (!err) {
                    console.log("DELETED");
                } else {
                    console.log("ERROR");
                }
            });
        }
    });
});


//WORKING
//For courses
router.route('/courses')
    //Add student to course (accessed at POST http://localhost:8080/api/courses)
    //Schema for post: name, course, id
    .post(function(req, res) {
        Course.findOne({
            'course_name': req.headers.course_name
        }, function(err, courses) {
            if (err)
                console.log("error")

            //Create Course if it doesn't exist
            if (!courses) {
                courses = new Course();
                courses.course_name = req.headers.course_name;
                courses.course_id = req.headers.course_id;
            } else {
                console.log("course exists");
                res.json({
                    code: 0
                }); //already exists
                return;
            }

            courses.save(function(err) {
                if (err)
                    res.json({
                        code: -1
                    }); //-1 is error

                //res.json({message: 'Added course ' + req.body.course});      
                console.log("added course");
                res.json({
                    code: 0
                }); //0 for ok
            });

        });
    });


// WORKING
//delete a course
router.route('/courses/:course_id')
    .delete(function(req, res) {
        Course.findOne({
            'course_id': req.params.course_id
        }, function(err, courses) {
            if (err)
                console.log("error")

            //Check if course does not exist. Do nothing
            if (!courses) {
                console.log("Course Doesnt Exist");
                res.json({
                    message: 'Course Doesnt Exist'
                });
                return;
            }

            //get the idlist for this course
            student_list = []
            student_list = courses.idLists;

            Course.remove({
                course_id: req.params.course_id
            }, function(err, courses) {
                if (err)
                    res.send(err);

                ////////// Iteratively remove course from all students
                for (var i = 0; i < student_list.length; i++) {
                    //Forward to RI
                    var student_options = {
                        course_id: req.params.course_id,
                        student_id: student_list[i],
                        type: "remove",
                        source: "course",

                    }

                    publisher.publish("ri_channel", JSON.stringify(student_options));
                }
                /////////////////////////

                //send response to router if all successful deletes
                res.json({
                    message: 'Successfully deleted'
                });
            });
        });
    });

//WORKING
//Read ids for particular course (accessed at GET http://localhost:8080/api/courses)
router.route('/courses/:course_id')
    .get(function(req, res) {
        console.log(req.params.course_id);
        Course.findOne({
            'course_id': req.params.course_id
        }, function(err, courses) {
            if (err)
                res.json({
                    code: -1,
                    message: "Error"
                });

            if (!courses) {
                console.log("Course Doesnt Exist");
                res.json({
                    code: -1,
                    message: 'Course Doesnt Exist'
                });
                return;
            }
            console.log(courses);

            student_list = [];
            var arr1 = courses.idLists;
            for (var i = 0; i < arr1.length; i++)
                student_list.push(arr1[i]);
            res.json({
                code: 0,
                students: student_list
            });
        });
    });

//Update course - add or delete student from course
router.route('/courses/:course_id')
    .post(function(req, res) {
        //WORKING
        //add student to course
        if (req.headers.type == 'add') {
            Course.findOne({
                'course_id': req.params.course_id
            }, function(err, courses) {
                if (err) {
                    console.log("error")
                    res.json({
                        code: -1,
                        message: "error"
                    });
                }

                //Create Course if it doesn't exist
                if (!courses) {
                    console.log("Course doesn't exist");
                    res.json({
                        code: -1,
                        message: "Course doesn't exist"
                    });
                    return;
                }

                //check if ID already exists Do Nothing
                if (courses.idLists.indexOf(req.headers.student_id) !== -1) {
                    console.log("Student Exists");
                    res.json({
                        code: 0,
                        message: "Student exists"
                    });
                    return;
                }

                //Append the course if it doesnt exist
                courses.idLists.push(req.headers.student_id);
                console.log(courses.idLists)
                console.log(req.headers.type + req.headers.student_id);
                ///////////
                //Forward to RI
                var student_options = {
                    student_id: req.headers.student_id,
                    course_id: req.params.course_id,
                    type: req.headers.type,
                    source: "course",
                    student_name: req.headers.student_name
                };

                publisher.publish("ri_channel", JSON.stringify(student_options));
                /////////////

                courses.save(function(err) {
                    if (err)
                        res.json({
                            code: -1,
                            message: "error saving"
                        });

                    console.log("Added student to course " + req.params.course_id);
                    res.json({
                        code: 0,
                        message: "Added student to course " + req.params.course_id
                    });
                });
            });
        }

        //WORKING
        //delete student from course
        else if (req.headers.type == 'remove') {
            //check if id exists. If it does, delete
            Course.findOne({
                'course_id': req.params.course_id
            }, function(err, courses) {
                if (err)
                    console.log("error")

                //Check if course exists. Do nothing
                if (!courses) {
                    console.log("Course Doesnt Exist");
                    res.json({
                        code: -1,
                        message: 'Course Doesnt Exist'
                    });
                    return;
                }

                //check if ID doesnt exist Do Nothing
                var indexOfId = courses.idLists.indexOf(req.headers.student_id);
                if (indexOfId === -1) {
                    console.log("Student Doesnt Exist");
                    res.json({
                        code: -1,
                        message: 'Student Doesnt Exist'
                    });
                    return;
                }

                courses.idLists.splice(indexOfId, 1);

                ///////////
                //Forward to RI
                var student_options = {
                    type: req.headers.type,
                    student_id: req.headers.student_id,
                    course_id: req.params.course_id,
                    source: "course",
                    student_name: req.headers.student_name
                };

                publisher.publish("ri_channel", JSON.stringify(student_options));
                /////////////

                courses.save(function(err) {
                    if (!err) {
                        console.log("DELETED");
                        res.json({
                            code: 0,
                            message: 'Deleted'
                        });
                    } else {
                        console.log("ERROR");
                        res.json({
                            code: -1,
                            message: 'Error'
                        });
                    }
                });
            });
        }
    });

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);