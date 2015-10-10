// server.js

// BASE SETUP
// =============================================================================
var http = require('http');
var mongoose   = require('mongoose');
mongoose.connect('mongodb://127.0.0.1/mydb', function(err) {
//mongoose.connect('mongodb://node:node@novus.modulusmongo.net:27017/Iganiq8o', function(err) {

	if(err) {
		console.log("error connecting to db");
		throw err;

	}

}); // connect to our database

var routing_table = []
var routing_table_port = []
routing_table['az'] = "http://127.0.0.1/api/student"
routing_table_port['az'] = 8081



// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var Bear = require('./app/models/bear');
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

router.use(function(req, res, next) {
	console.log('Something is happening.');
	next();

});


// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});

/*
router.route('/bears')

    // create a bear (accessed at POST http://localhost:8080/api/bears)
    .post(function(req, res) {
        var bear = new Bear();      // create a new instance of the Bear model
        cur_course = req.body.course_id;
	cur_student_name = req.body.student_name;
	console.log("adding " + cur_student_name + " to " + cur_course);
	bear.name = req.body.name;  // set the bears name (comes from the request)
	// save the bear and check for errors
        bear.save(function(err) {
            if (err)
                res.send(err);

            res.json({ course: cur_course, student: cur_student_name, message: 'Successfully added' });
        });
        
    })

	.get(function(req,res) {

		Bear.find(function(err, bears) {
			if (err)
				res.send(err);

			res.json(bears);

		});

	});	
*/
router.route('/student')

	.get(function(req,res) {

		var student_data = '';
		console.log("Getting student details from student service");	
		console.log("IP Addr: " + routing_table['az']);
		
		var options = {
			host: routing_table['az'],
			port: routing_table_port['az']
		};	
	
		http.get(options, function(resp){
  			resp.on('data', function(chunk){
			    console.log("Received data from student");
			    student_data = chunk;
  			})
			}).on("error", function(e){
				student_data = "error";
				console.log(student_data);
				//res.json({message: student_data});		
		});

		res.json({message: student_data});

	});


router.route('/course')

        .get(function(req,res) {

                console.log(req.course_name);
                res.json({course:req.course_name, message: 'Sending course details'});

        });



// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
