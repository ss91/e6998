// server.js

// BASE SETUP
// =============================================================================
var http = require('http');
var mongoose   = require('mongoose');

/*mongoose.connect('mongodb://127.0.0.1/mydb', function(err) {
//mongoose.connect('mongodb://node:node@novus.modulusmongo.net:27017/Iganiq8o', function(err) {

	if(err) {
		console.log("error connecting to db");
		throw err;

	}

});*/ // connect to our database

var routing_table = []
var routing_table_port = []
var routing_table_channel = []
var course_service_ip_addr = ''
var course_service_port = 0

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var Bear = require('./app/models/bear');
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var redis = require("redis");
var publisher = redis.createClient();




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
    res.json({ message: 'Welcome to the Student/Course Service API. If you see this message, you are ready to go!' });   
});

router.route('/students/:student_name')

	.get(function(req,res){

		student_id = req.headers.student_id;
		student_name = String(req.params.student_name);

		student_name_first_letter = student_name.charAt(0);	

		for (var key in routing_table) {

			if (student_name_first_letter >= key.charAt(0) && student_name_first_letter <= key.charAt(1)) {
				cur_ip_addr = routing_table[key];
				cur_port = routing_table_port[key];	
				cur_key = key;
			}

		}

		var student_options = {
			host: routing_table[cur_key],
			port: routing_table_port[cur_key],
			method: 'GET',
			path: '/api/students/' + student_id
		};

		console.log(student_options.host);
		console.log(student_options.port);

		student_response = function(response) {

			var str = '';
			response.on('data', function(chunk){
				str += chunk;
			});
			response.on('end', function(){

				console.log("end get request");
				temp = JSON.parse(str);
				
				if (!temp.Student) {
					res.json({code: '-1', message: 'Student doesn\'t exist'});		
					return;
				}


				else if (temp.Student.name == student_name) {
					console.log("details match");	
					res.json(JSON.parse(str));
					return;
				}
				else
					res.json({code: '-1', message: 'ID name mismatch'});		
			});
			response.on('error', function(error){
				res.json({code: '-1'});
			})

		}

		student_request = http.request(student_options, student_response);
		student_request.on('error', function(error){

			console.log("Students get error");
			res.json({message: 'request error'});
		});

		student_request.end();

	})

	.post(function(req, res){

		student_name = req.params.student_name;
		student_id = req.headers.student_id;
		student_name_first_letter = student_name.charAt(0);	

		for (var key in routing_table) {

			if (student_name_first_letter >= key.charAt(0) && student_name_first_letter <= key.charAt(1)) {
				cur_ip_addr = routing_table[key];
				cur_port = routing_table_port[key];	
				cur_key = key;
			}

		}

		var student_options = {
			host: routing_table[cur_key],
			port: routing_table_port[cur_key],
			method: 'POST',
			path: '/api/students/' + student_id,
			headers: {
				subtype: req.headers.type,
				course_id: req.headers.course_id,
			}

		};

		console.log(student_options.host);
		console.log(student_options.path);
		console.log(student_options.headers);

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
			})

		}

		student_request = http.request(student_options, student_response);
		student_request.on('error', function(error){

			console.log("Students get error");
			res.json({message: 'request error'});
		});

		student_request.end();

	});

router.route('/students')

	.get(function(req,res) {

		student_id = (req.headers.student_id);
		student_name = String(req.headers.student_name);
			
		student_name_first_letter = student_name.charAt(0);	

		for (var key in routing_table) {

			if (student_name_first_letter >= key.charAt(0) && student_name_first_letter <= key.charAt(1)) {
				cur_ip_addr = routing_table[key];
				cur_port = routing_table_port[key];	
				cur_key = key;
			}

		}

		console.log("using " + cur_key);

		console.log("Getting student details from student service");	
		console.log("IP Addr: " + routing_table[cur_key]);
		
		var options = {
			host: routing_table[cur_key],
			port: routing_table_port[cur_key],
			method: 'GET'
			 
		};

		student_response = function(response) {

			var str = '';
			response.on('data', function(chunk){
				str+= chunk;
			});
			
			response.on('end', function(){
				console.log("end: " + str);
			})
		}

		var get_request = http.request(options, student_response);
		get_request.on('error', function(error){
			console.log(error);
		});
		get_request.end();


		res.json({message: "return"});

	})


	//Creating a new student
	.post(function(req, res){
		student_id = req.headers.student_id;
		student_name = String(req.headers.student_name);
			
		student_name_first_letter = student_name.charAt(0);	

		for (var key in routing_table) {

			if (student_name_first_letter >= key.charAt(0) && student_name_first_letter <= key.charAt(1)) {
				cur_ip_addr = routing_table[key];
				cur_port = routing_table_port[key];	
				cur_key = key;
			}

		}

		console.log("using " + cur_key);

		console.log("Getting student details from student service");	
		console.log("IP Addr: " + routing_table[cur_key]);
		
		var student_options = {
			host: routing_table[cur_key],
			port: routing_table_port[cur_key],
			path: '/api/students',
			method: 'POST',
			headers: {
				'id': req.headers.student_id,
				'studentname': req.headers.student_name, 
			}

			 
		};

		console.log(student_options.host);
		console.log(student_options.port);
		student_response = function(response) {

			var str = '';
			response.on('data', function(chunk){

				str = str+chunk;
			});
			response.on('end', function() {
				//console.log("Response code: " + )
				if(str !== '')
					res.json(JSON.parse(str));
				else
					res.json({message: 'failed'});
			});
			response.on('error', function(){
				res.json({code: '-1'})
			});
		}

		var create_request = http.request(student_options, student_response);
		create_request.on('error', function(error){

			res.json({request_error: error.message});
		});
		create_request.end();

	})

	.delete(function(req, res){

		console.log("Deleting a student");

		student_id = req.headers.student_id;
		student_name = String(req.headers.student_name);
			
		student_name_first_letter = student_name.charAt(0);	

		for (var key in routing_table) {

			if (student_name_first_letter >= key.charAt(0) && student_name_first_letter <= key.charAt(1)) {
				cur_ip_addr = routing_table[key];
				cur_port = routing_table_port[key];	
				cur_key = key;
			}

		}

		console.log("using " + cur_key);

		var student_options = {

			host: cur_ip_addr,
			port: cur_port,
			path: '/api/students/' + req.headers.student_id,
			method: 'DELETE',
			
		}
		console.log(student_options.host);
		console.log(student_options.port);

		student_response = function(response) {

			var str = '';
			response.on('data', function(chunk){

				str = str+chunk;
			});
			response.on('end', function() {
				//console.log("Response code: " + )
				res.json(JSON.parse(str));
			});
			response.on('error', function(){
				res.json({code: '-1'})
			});
		}

		var delete_request = http.request(student_options, student_response);
		delete_request.on('error', function(error){

			res.json({request_error: error.message});
		});
		delete_request.end();
	});	

router.route('/courses')

	.post(function(req,res){

		console.log("Creating a course")
		var course_options = {

			host: course_service_ip_addr,
			port: course_service_port,
			path: '/api/courses',
			method: 'POST',
			headers: {'course_id': req.headers.course_id,
					  'course_name' : req.headers.course_name,
					 }
		}
		console.log(course_options.host);
		console.log(course_options.port);

		course_response = function(response) {

			var str = '';
			response.on('data', function(chunk){

				str = str+chunk;
			});
			response.on('end', function() {
				//console.log("Response code: " + )
				res.json(JSON.parse(str));
			});
			response.on('error', function(){
				res.json({code: '-1'})
			});
		}

		var create_request = http.request(course_options, course_response);
		create_request.on('error', function(error){

			res.json({request_error: error.message});
		});
		create_request.end();
	})

	.delete(function(req, res){

		console.log("Deleting a course");
		var course_options = {

			host: course_service_ip_addr,
			port: course_service_port,
			path: '/api/courses/' + req.headers.course_id,
			method: 'DELETE',
			headers: {'course_id': req.headers.course_id,
					  'course_name' : req.headers.course_name,
					 }
		}
		console.log(course_options.host);
		console.log(course_options.port);

		course_response = function(response) {

			var str = '';
			response.on('data', function(chunk){

				str = str+chunk;
			});
			response.on('end', function() {
				//console.log("Response code: " + )
				res.json(JSON.parse(str));
			});
			response.on('error', function(){
				res.json({code: '-1'})
			});
		}

		var delete_request = http.request(course_options, course_response);
		delete_request.on('error', function(error){

			res.json({request_error: error.message});
		});
		delete_request.end();


	});
	
router.route('/courses/:course_id')
		
        .get(function(req,res) {
        		console.log(req.params.course_id);
        		var course_options = {

        				host: course_service_ip_addr, 
        				//host: 'www.google.com',
        				path:'/api/courses/'+req.params.course_id,
        				port: course_service_port,
        				method: 'GET',
        			};
        		
        		course_response = function(response) {

        			var str = '';
        			response.on('data', function(chunk){
        				str = str + chunk;
        				//console.log(JSON.parse(str));
        				//console.log(response.statusCode);

        			});
        			response.on('end', function(){
        				//console.log(final_message);
        				//final_message = final_message + JSON.parse(str);
        				console.log("end");
        				res.json(JSON.parse(str));

        			});
        			response.on('error', function(error){
        				console.log("Response error");
        			});

        		}
        		
        		var get_request = http.request(course_options, course_response);
        		//console.log(course_response);
        		get_request.on('error', function(error){
        				console.log("request error: " + error);

        		});
        		//var final_message = "hello";
        		get_request.end();
                //console.log(str);
                //res.json();

        })
		.post(function(req, res) {

				var course_options = {
					host: course_service_ip_addr, 
        			//host: 'www.google.com',
        			path:'/api/courses/'+req.params.course_id,
        			port: course_service_port,
        			method: 'POST',
        			headers: {'cousrse_id': req.params.course_id,
        						'type' : req.headers.type,
        						'student_id' : req.headers.student_id,
        						'student_name': req.headers.student_name,
        					 }	
				}

				course_response = function(response) {

        			var str = '';
        			response.on('data', function(chunk){
        				str = str + chunk;
        				//console.log(JSON.parse(str));
        				//console.log(response.statusCode);

        			});
        			response.on('end', function(){
        				//console.log(final_message);
        				//final_message = final_message + JSON.parse(str);
        				console.log("end");
        				res.json(JSON.parse(str));

        			});
        			response.on('error', function(error){
        				console.log("Response error");
        			});

        		}
        		
        		var post_request = http.request(course_options, course_response);
        		//console.log(course_response);
        		post_request.on('error', function(error){
        				console.log("request error: " + error);

        		});
        		//var final_message = "hello";
        		post_request.end();
                //console.log(str);
                //res.json();

		});


router.route('/config')

	.get(function(req, res) {

		if (req.headers.config_type == "student") {	

		var response_message = { configuration: []};
		console.log("sending student service details");

		for (var key in routing_table) {

			console.log (key + " " + routing_table[key] + " " + routing_table_port[key]);
			response_message.configuration.push({"begin_range" : key.charAt(0),
												  "end_range" : key.charAt(1), 
												"ip_addr" : routing_table[key], 
												"end_port" : routing_table_port[key]});
		}

		res.json(response_message);
		}
		

		else if (req.headers.config_type == "course") {

			var response_message = {configuration: []};
			console.log("sending course service details");

			response_message.configuration.push({
					"ip_addr": course_service_ip_addr,
					"end_port" : course_service_port

			});

		res.json(response_message);
		}	

		else {

			res.json({message: "invalid configuration directive"});
		}
	})

	.post(function(req, res){

		var update_type = req.body.config_type;
		
		if (update_type == "student") {


			var begin_range = req.body.begin_range;
			var end_range = req.body.end_range;
			var ip_addr = req.body.ip_addr;
			var end_port = req.body.end_port;
			var channel_name = req.body.channel_name;

			var key = begin_range+end_range;
			console.log("updating " + key);

			routing_table[key] = ip_addr;
			routing_table_port[key] = end_port;	
			routing_table_channel[key] = channel_name;

			var channel_options = {configuration: []}

			for (var key in routing_table_channel) {

				console.log(key + ' ' + routing_table_channel[key]);
				channel_options.configuration.push({

					"key" : key,
					"channel_name": routing_table_channel[key],

				});

			}

			console.log(channel_options);
			publisher.publish("config_channel", JSON.stringify(channel_options));

			res.json({
				message: "student service updated",
				begin_range: begin_range, 
				end_range: end_range, 
				ip_addr: routing_table[key],
				end_port: routing_table_port[key]
			});

		}

		else if (update_type == "course") {

			var ip_addr = req.body.ip_addr;
			var end_port = req.body.end_port;

			course_service_ip_addr = ip_addr;
			course_service_port = end_port;	
		
			console.log("course updated");
			res.json({
				message: "course service updated",
				ip_addr: course_service_ip_addr,
				end_port: course_service_port
			});
		}

		else {

			res.json({message: "invalid configuration directive"});

		}

	})

	.delete(function(req, res) {

		var update_type = req.body.config_type;

		if (update_type == "student") {

			var begin_range = req.body.begin_range;
			var end_range = req.body.end_range;
			var cur_key = begin_range+end_range;
			//routing_table.remove(cur_key);
			//routing_table_port.remove(cur_key);
			console.log(cur_key + " deleting");
			delete routing_table[cur_key];
			delete routing_table_port[cur_key];
			delete routing_table_channel[cur_key];

		}

		var channel_options = {configuration: []}

			for (var key in routing_table_channel) {

				console.log(key + ' ' + routing_table_channel[key]);
				channel_options.configuration.push({

					"key" : key,
					"channel_name": routing_table_channel[key],

				});

			}

			console.log(channel_options);
			publisher.publish("config_channel", JSON.stringify(channel_options));

		res.json({message: "deleted"});

	});




app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
