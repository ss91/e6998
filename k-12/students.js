// call the packages we need
var express = require('express'); // call express
var app = express(); // define our app using express
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var port = process.env.PORT || 8081; // set our port
var http = require('http');

// Load AWS credentials from local json file
var AWS_credentials_path = "./config2.json";
var config = require( AWS_credentials_path );
var AWS = require('aws-sdk'), AWS_credentials_path
AWS.config.loadFromPath(AWS_credentials_path);

var db = new AWS.DynamoDB({params: {TableName: 'student'}});

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); // get an instance of the express Router
// middleware to use for all requests
router.use(function(req, res, next) {
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

var dyn = require('./dynamohelper.js');

//CRUD REST for students
// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({
        message: 'Router running'
    });
});

//Set parameters for message
function setParams(req, source, success_callback, failure_callback) {
    if(source == 'REST')
    {
        var message_params = {
            ssn : req.params.ssn,
            msg : req,
            source : source,
            callback : { success : success_callback,
                        failure : failure_callback } 
        }
    }
    else
    {
        var message_params = {
            ssn : JSON.parse(req.Body).ssn,
            msg : req,
            source : source,
            callback : { success : success_callback,
                        failure : failure_callback } 
        }
    }
    return message_params;
}

//Config REST API
router.route('/config/')
    .post(function(req, res) {
        dyn.setConfig(Object.keys(req.body));
        res.send("Config updated");
    });

// Students REST API
router.route('/students/:ssn')
    .post(function(req, res) {
        var message_params = setParams(req, 'REST', success_callback_rest, failure_callback_rest);
        dyn.postStudent(message_params, res);
    });

router.route('/students/:ssn')
    .get(function(req, res) {
        var message_params = setParams(req, 'REST', success_callback_rest, failure_callback_rest);
        dyn.getStudent(message_params, res);
    });

router.route('/students/:ssn')
    .put(function(req,res) {
        var message_params = setParams(req, 'REST', success_callback_rest, failure_callback_rest);
        dyn.putStudent(message_params, res);
    });

router.route('/students/:ssn')
    .delete(function(req,res) {
        var message_params = setParams(req, 'REST', success_callback_rest, failure_callback_rest);
        dyn.deleteStudent(message_params, res);
    });


//Queueing API
// Require libraries.
var Q = require( "q" );
var chalk = require( "chalk" );

// Create an instance of our SQS Request Queue
var sqs_request = new AWS.SQS({
    region: config.aws.requestQueue.region,
    accessKeyId: config.aws.requestQueue.accessID,
    secretAccessKey: config.aws.requestQueue.secretKey,
    params: {
        QueueUrl: config.aws.requestQueue.queueUrl
    }
});

// Create an instance of our SQS Response Queue
var sqs_response = new AWS.SQS({
    region: config.aws.responseQueue.region,
    accessKeyId: config.aws.responseQueue.accessID,
    secretAccessKey: config.aws.responseQueue.secretKey,
    params: {
        QueueUrl: config.aws.responseQueue.queueUrl
    }
});

var receiveMessage = Q.nbind( sqs_request.receiveMessage, sqs_request );
var deleteMessage = Q.nbind( sqs_request.deleteMessage, sqs_request );

(function pollQueueForMessages() {

    console.log( chalk.yellow( "Starting long-poll operation." ) );

    receiveMessage({
        WaitTimeSeconds: 3, // Enable long-polling (3-seconds).
        VisibilityTimeout: 10
    })
    .then(
        function handleMessageResolve( data ) {
            if ( ! data.Messages ) {

                throw(
                    workflowError(
                        "EmptyQueue",
                        new Error( "There are no messages to process." )
                    )
                );
            }
            console.log( chalk.green( "Deleting:", data.Messages[ 0 ].MessageId ) );
            var result = JSON.parse(data.Messages[0].Body);

            //check queue message for valid ssn.
            if(result.ssn === undefined)
            {
                console.log("error No SSN");
                return;
            }

            var ssn = result.ssn;
            delete result.ssn;

            var msgId = data.Messages[0].MessageId;
            console.log("message id : " + msgId);

            var message_params = setParams(data.Messages[0], 'SQS', success_callback_sqs, failure_callback_sqs);
            if(result.method == 'POST')
            {
                console.log("POST to Dynamo")
                dyn.postStudent(message_params, sqs_response);
            }
            else if(result.method == 'PUT')
            {
                console.log("PUT to Dynamo");
                dyn.putStudent(message_params, sqs_response); 
            }
            else if (result.method == 'GET')
            {
                console.log("GET from dynamo");
                var result = dyn.getStudent(message_params, sqs_response);
            }
            else if( result.method == 'DELETE')
            {
                console.log("DEL from Dynamo");
                dyn.deleteStudent(message_params, sqs_response);
            }

            return(
                deleteMessage({
                    ReceiptHandle: data.Messages[ 0 ].ReceiptHandle
                })
            );

        }
    )
    .then(
        function handleDeleteResolve( data ) {
            console.log( chalk.green( "Message Deleted!" ) );
        }
    )

    // Catch any error (or rejection) that took place during processing.
    .catch(
        function handleError( error ) {
            switch ( error.type ) {
                case "EmptyQueue":
                    console.log( chalk.cyan( "Expected Error:", error.message ) );
                break;
                default:
                    console.log( chalk.red( "Unexpected Error:", error.message ) );
                break;
            }
        }
    )
    .finally( pollQueueForMessages );
})();

function workflowError( type, error ) {
    error.type = type;
    return( error );
}

//Callback function for asynchronous success/failure response
function success_callback_rest(res, msg) {
    res.send(msg.code);
}

function failure_callback_rest(res, msg) {
    res.send("Fail : " + msg.code);
}   

function success_callback_sqs(sqs_response, msg) {                
    var resultMsg = {"Code" : msg.code, "MessageID" : msg.msgId};
    var sqs_params = {
        MessageBody: JSON.stringify(resultMsg)
    };

    sqs_response.sendMessage(sqs_params, function(err,data) {
    if(err)
    {
        console.log("error" + err);
    }
    else
        console.log("Posted on Queue");
    });
}

function failure_callback_sqs(sqs_response, msg) {
    var resultMsg = {"Code" :"Fail", "MessageID" : msg.msgId};
    var sqs_params = {
    MessageBody: JSON.stringify(resultMsg)
    };

    sqs_response.sendMessage(sqs_params, function(err,data) {
    if(err)
    {
        console.log("error" + err);
    }
    else
        console.log("Posted on Queue");
    });
}

app.use('/api', router);
// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
