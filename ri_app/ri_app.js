var http = require('http');
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8081;        // set our port
var router = express.Router();              // get an instance of the express Router
router.use(function(req, res, next) {
  console.log('Something is happening.');
  next();

});

var student_channel_dict = []

var student_service_ip_addr = '160.39.144.255';
var student_service_port = '8081';
var course_service_ip_addr = '160.39.144.255';
var course_service_port = '8080';

var redis = require("redis");

var pub_sub = redis.createClient();
var publisher = redis.createClient();
var channels = ['ri_channel', 'student_channel', 'course_channel', 'student_channel_1', 'student_channel_2', 'student_channel_3', 'config_channel'];

for (var i = 0; i < channels.length; i++) {

    console.log("Subscribing to " + channels[i]);
    pub_sub.subscribe(channels[i]);

}

pub_sub.on("message", function(channel, message) {

    console.log("Message '" + message+ "' on channel '" + channel + "' arrived!");

    params = JSON.parse(message);

	if (channel === "ri_channel") {
		
		source = params.source;
		if (source === "student") {
		
			//publish to course

			var course_options = {
				
				'course_id' : params.course_id,
				'type' : params.type,
				'student_id': params.student_id,
			};
		
		
			publisher.publish("course_channel", JSON.stringify(course_options));
			console.log("Publish to course completed");
		} 	

		if (source === "course") {

			var student_name = params.student_name;

			var student_options = {
	
				'course_id' : params.course_id,
				'type' : params.type,
				'student_id' : params.student_id,

			};


			
			if (!student_name) {
				
				for (var key in student_channel_dict) {
					channel_name = student_channel_dict[key];
					publisher.publish(channel_name, JSON.stringify(student_options));
					console.log("published when null");
				}

			}

			else {
			student_name_first_letter = student_name.charAt(0);	

			for (var key in student_channel_dict) {
				if (student_name_first_letter >= key.charAt(0) && student_name_first_letter <= key.charAt(1)) {
						channel_name = student_channel_dict[key];
				}
			}

			publisher.publish(channel_name, JSON.stringify(student_options));
			console.log("Publish to student completed");
		
		}

		}
		

	}	


    /*
	if (channel === "student_channel") {

      student_id = message.student_id;
      var course_options = {

        host: course_service_ip_addr,
        port: course_service_port,
        method: 'POST',
        path: '/api/courses/' + params.course_id,
        headers: {  'course_id': params.course_id,
                    'type' : params.type,
                    'student_id' : params.student_id,
                 }  
    };
    //console.log(course_options);
	publisher.publish("course_channel", JSON.stringify(course_options));	   
	console.log("publish completed"); 	
}

    if (channel === "course_channel") {

      params = JSON.parse(message);
      
      var student_options = {

      host: student_service_ip_addr,
      port: student_service_port,
      method: 'POST',
      path: '/api/students/' + params.student_id,
      headers: {
          subtype: params.type,
          course_id: params.course_id,
          student_id: params.student_id
      }

     };

	console.log(student_options);
	publisher.publish("student_channel", JSON.stringify(student_options));
	}

*/
	if (channel == "config_channel") {

			console.log("Need to update student routing table now");
			channel_params = JSON.parse(message);
			student_channel_dict = []

			console.log(channel_params.configuration);

			for (var val in channel_params.configuration) {
				//student_channel_dict[val.key] = val.channel_name;	
				//console.log (val['key'] + ' ' + val['channel_name']);
				console.log(channel_params.configuration[val]['key']);

				student_channel_dict[channel_params.configuration[val]['key']] = channel_params.configuration[val]['channel_name'];
			} 

			console.log(student_channel_dict)
	}
	

});

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
