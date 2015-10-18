var http = require('http');
// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8081;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

router.use(function(req, res, next) {
	console.log('Something is happening.');
	next();

});

var student_service_ip_addr = '160.39.145.138';
var student_service_port = '8081';
var course_service_ip_addr = '160.39.145.138';
var course_service_port = '8080';

router.route('/courses/:course_id')
  .post(function(req, res){

    course_id = req.params.course_id;

    var student_options = {

      host: student_service_ip_addr,
      port: student_service_port,
      method: 'POST',
      path: '/api/students/' + req.headers.student_id,
      headers: {
          subtype: req.headers.type,
          course_id: req.params.course_id
      }

     };

     console.log(student_options);

     student_response = function(response) {

        var str = '';
        response.on('data', function(chunk){
        str += chunk;
        });
        
        response.on('end', function(){

        res.json(JSON.parse(str));
        });
        
        response.on('error', function(error){
        res.json({code: '-1'});
      });
     }

     var student_request =  http.request(student_options, student_response);
     student_request.on('error', function(error){

      console.log("Students get error");
      res.json({message: 'request error'});
    });

     student_request.end();

    });


router.route('/students/:student_id')
  .post(function(req, res){

    student_id = req.params.student_id;

    var course_options = {

        host: course_service_ip_addr,
        port: course_service_port,
        method: 'POST',
        path: '/api/courses/' + req.headers.course_id,
        headers: {  'course_id': req.headers.course_id,
                    'type' : req.headers.type,
                    'student_id' : req.params.student_id,
                   }  
    };

    console.log(course_options);

    course_response = function(response) {


       var str = '';
        response.on('data', function(chunk){
        str += chunk;
        });
        
        response.on('end', function(){

        res.json(JSON.parse(str));
        });
        
        response.on('error', function(error){
        res.json({code: '-1'});
      });
     }

     var student_request =  http.request(course_options, course_response);
     student_request.on('error', function(error){

      console.log("Students get error");
      res.json({message: 'request error'});
    });

     student_request.end();
  });  

app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);