
// courseServer.js
// This is the initial commit for course microservice CRUD operations
// BASE SETUP
// =============================================================================
// call the packages we need
var express = require('express'); // call express
var app = express(); // define our app using express
var bodyParser = require('body-parser');
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
var port = process.env.PORT || 8081; // set our port
var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/mydb'); // connect to
var Student = require('./app/models/student');

var ri_port = '8081';
var ri_ip_addr = '209.2.218.25';
var http = require('http');

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
        message: 'hooray! welcome to our api!'
    });
});

router.route('/students')
    // Create a new student
    .post(function(req, res) {


        var studentId = req.headers.id;
        var studentName = req.headers.studentname;
        console.log(studentId + studentName);
        Student.findOne({
            'id': studentId
        }, function(err, students) {
            if (err)
                console.log("error")

            if (!students) {
                var newstudent = new Student();
                newstudent.id = studentId;
                newstudent.name = studentName;

            } else {
                console.log("Student Already Exists");
                res.json({
                    code: 0,
                    message: "Student Already Exists"
                });
                return;
            }

            newstudent.save(function(err) {
                if (err) {
                    res.json({
                        code: -1,
                        message: "Error"
                    });
                    return;
                }
                console.log("New Student Created");
                res.json({
                    code: 0,
                    message: "New Student Created"
                });
            });
        });
    });

// Add or delete course to/from a student
router.route('/students/:student_id')
    .post(function(req, res) {

        //check if id exists. If it does, replace
        var studentId = req.params.student_id;

        console.log(req.headers);
        console.log(studentId);
        //console.log(req.headers.)
        Student.findOne({
            'id': studentId
        }, function(err, students) {
            if (err) {
                console.log("error")
                res.json({
                    code: -1,
                    message: "Error"
                });
                return;
            }
            //Check if course exists. Do nothing
            if (!students || !req.headers.course_id) {
                console.log("Student Doesnt Exist or New course error");
                res.json({
                    code: -1,
                    message: "Student Doesnt Exist or New course error"
                });
                return;
            }
            //check if ID doesnt exist Do Nothing
            if (req.headers.subtype == 'add') {
                var indexOfCourse = students.course.indexOf(req.headers.course_id);
                if (indexOfCourse !== -1) {
                    console.log("Course Exists");
                    res.json({
                        code: 0,
                        message: "Course exists"
                    });
                    return;
                }

                var arr = students.course;
                arr.push(req.headers.course_id);
                students.course = arr;
                ///////////////////

                //Forward to RI
                var course_options = {
                    host: ri_ip_addr,
                    port: ri_port,
                    path: '/api/students/' + req.params.student_id,
                    method: 'POST',
                    headers: {
                        'type': req.headers.subtype,
                        'course_id': req.headers.course_id,
                        //'name': req.headers.name,
                    }
                };
                console.log(course_options);
                course_response = function(response) {

                    var str = '';
                    response.on('data', function(chunk) {
                        str += chunk;
                    });
                    response.on('end', function() {
                        console.log("str : " + str);
                        res.json({
                            message: "Hello"
                        });
                    });
                    response.on('error', function(error) {
                        res.json({
                            code: '-1'
                        });
                    });
                }

                student_request = http.request(course_options, course_response);
                student_request.on('error', function(error) {

                    console.log("Students POST error");
                    res.json({
                        message: 'request error'
                    });
                });

                student_request.end();
                ////////////////

                students.save(function(err) {
                    if (!err) {
                        console.log("Added course to student");
                        res.json({
                            code: 0,
                            message: "Added course to student"
                        });
                    } else {
                        console.log("ERROR");
                        res.json({
                            code: -1,
                            message: "Error"
                        });
                    }
                });
            } else if (req.headers.subtype == 'remove') {
                var indexOfCourse = students.course.indexOf(req.headers.course_id);
                if (indexOfCourse === -1) {
                    console.log("Course Does Not Exist");
                    res.json({
                        code: 0,
                        message: "Course does not exist"
                    });
                    return;
                }

                students.course.splice(indexOfCourse, 1);

                ///////////////////

                //Forward to RI
                var course_options = {
                    host: ri_ip_addr,
                    port: ri_port,
                    path: '/api/students/' + req.params.student_id,
                    method: 'POST',
                    headers: {
                        'type': req.headers.subtype,
                        'course_id': req.headers.course_id,
                        //'name': req.headers.name,
                    }
                };

                course_response = function(response) {

                    var str = '';
                    response.on('data', function(chunk) {
                        str += chunk;
                    });
                    response.on('end', function() {
                        res.json({
                            message: "Hello"
                        });
                    });
                    response.on('error', function(error) {
                        res.json({
                            code: '-1'
                        });
                    })
                }

                student_request = http.request(course_options, course_response);
                student_request.on('error', function(error) {

                    console.log("Students POST error");
                    res.json({
                        message: 'request error'
                    });
                });

                student_request.end();
                ////////////////


                students.save(function(err) {
                    if (!err) {
                        console.log("DELETED Course from Student");
                        res.json({
                            code: 0,
                            message: "Deleted Course from Student"
                        });
                    } else {
                        console.log("ERROR");
                        res.json({
                            code: -1,
                            message: "Error"
                        });
                    }

                });
            }
        });

    });

//Read ids for particular course (accessed at GEThttp://localhost:8080/api/courses)
router.route('/students/:student_id')
    .get(function(req, res) {
        var studentId = req.params.student_id;
        Student.findOne({
            'id': studentId
        }, function(err, students) {
            if (err) {
                console.log("error")
                res.json({
                    code: -1,
                    message: "Error"
                });
                return;
            }
            //Check if course exists. Do nothing
            if (!students) {
                console.log("Student Doesnt Exist");
                res.json({
                    code: 0,
                    message: "Student Does Not Exist"
                });
                return;
            } else {
                console.log("Student Exists");
                res.json({
                    code: 0,
                    Student: students,
                    message: "Returned student"
                });
                return;
            }

        });
    });

router.route('/students/:student_id')
    .delete(function(req, res) {
        var studentId = req.params.student_id;
        Student.findOne({
            'id': studentId
        }, function(err, students) {
            if (err) {
                console.log("error")
                res.json({
                    code: -1,
                    message: "Error"
                });
                return;
            }
            //Check if course exists. Do nothing
            if (!students) {
                console.log("Student Doesnt Exist");
                res.json({
                    code: -1,
                    message: "Student does not exist"
                });
                return;
            }

            ///// For deletion

            course_list = []
            course_list = students.course;
            //////////

            Student.remove({
                id: req.params.student_id
            }, function(err, students) {
                if (err) {
                    res.json({
                        code: -1,
                        message: "Error"
                    });
                    return;
                }
                console.log("Successfully deleted")

                ///////// DELETE student from all courses
                for (var i = 0; i < course_list.length; i++) {

                    var course_options = {
                        host: ri_ip_addr,
                        port: ri_port,
                        path: '/api/students/' + req.params.student_id,
                        method: 'POST',
                        headers: {
                            'type': "remove",
                            'course_id': course_list[i],
                            //'name': req.headers.name,
                        }
                    };

                    course_response = function(response) {

                        var str = '';
                        response.on('data', function(chunk) {
                            str += chunk;
                        });
                        response.on('end', function() {
                            res.json({
                                message: "Hello"
                            });
                        });
                        response.on('error', function(error) {
                            res.json({
                                code: '-1'
                            });
                        })
                    }

                    student_request = http.request(course_options, course_response);
                    student_request.on('error', function(error) {

                        console.log("Students POST error");
                        res.json({
                            message: 'request error'
                        });
                    });
                    student_request.end();
                }
                //////////////

            });

            res.json({
                code: 0,
                message: "Successfully Deleted"
            });
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