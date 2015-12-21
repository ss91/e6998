var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config.json');
var aws = require("aws-sdk");
var Q = require ("q");
var router = express.Router();
var Promise = require('bluebird');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
var port = process.env.PORT || 8080;
var router = express.Router();
var chalk = require("chalk");
router.use(function(req, res, next) {
        console.log('Something is happening');
        next();
});

var global_submitted_messages = []


var sqs_response = new aws.SQS({
        region: config.aws.responseQueue.region,
        accessKeyId: config.aws.responseQueue.accessID,
        secretAccessKey: config.aws.responseQueue.secretKey,

        params: {
                QueueUrl: config.aws.responseQueue.queueUrl
        }
});


var sqs_request = new aws.SQS({
        region: config.aws.requestQueue.region,
        accessKeyId: config.aws.requestQueue.accessID,
        secretAccessKey: config.aws.requestQueue.secretKey,

        params: {
                QueueUrl: config.aws.requestQueue.queueUrl
        }
});

var receiveMessage = Q.nbind(sqs_request.receiveMessage, sqs_request);
var deleteMessage = Q.nbind(sqs_request.deleteMessage, sqs_request);

(function pollQueueForMessages() {

    console.log(chalk.yellow("Starting long-poll operation."));

    receiveMessage({
            WaitTimeSeconds: 3, // Enable long-polling (3-seconds).
            VisibilityTimeout: 10
        })
        .then(
            function handleMessageResolve(data) {
                if (!data.Messages) {

                    throw (
                        workflowError(
                            "EmptyQueue",
                            new Error("There are no messages to process.")
                        )
                    );

                }
                
                console.log(chalk.green("Deleting:", data.Messages[0].MessageId));
                console.log(data);

                var response = global_submitted_messages[data.Messages[0].MessageId];

                if (!response) {
                        deleteMessage( {
                                ReceiptHandle: data.Messages[0].ReceiptHandle
                        });
                        throw (
                            workflowError(
                                "UnexpectedMessage",
                                new Error("Message not associated with request")
                                )
                            );
                }
                            

                response.status(200).send("This should work!");
                delete global_submitted_messages[data.Messages[0].MessageId];
                console.log(global_submitted_messages);

                
                return(
                    deleteMessage({
                        ReceiptHandle: data.Messages[0].ReceiptHandle
                    })
                );
                

            }
        )
        .then(
            function handleDeleteResolve(data) {
                console.log(chalk.green("Message Deleted!"));
            }
        )

    // Catch any error (or rejection) that took place during processing.
    .catch(
            function handleError(error) {
                switch (error.type) {
                    case "EmptyQueue":
                        console.log(chalk.cyan("Expected Error:", error.message));
                        break;
                    default:
                        console.log(chalk.red("Unexpected Error:", error.message));
                        break;
                }
            }
        )
        .finally(pollQueueForMessages);
})();

function workflowError(type, error) {
        console.log(error);
        console.log("workflow error");
        error.type = type;
        return(error);
}

var make_sqs_request = function(callback, res){
        
        callback.then(function(ssn, student_details) {
                //console.log("request successfullly submitted");
                //console.log("THIS WORKS!", ssn);//, student_details);
                
                console.log(ssn.MessageId);
                global_submitted_messages[ssn.MessageId] = res;
                
                //get response from function and send here
                //res.status(200).send("Create request successfully submitted");
        });
};

var create_student = function(ssn, student_details) {

        return new Promise(function(fulfill, reject) {
            var sqs_params = {
                MessageBody: JSON.stringify(student_details)
                };
                    
            sqs_request.sendMessage(sqs_params, function(err, data) {
                if (err) {
                        console.log('ERR', err);
                        fulfill('ERR', err);
                }
                //console.log(data);
                //fulfill('OK', data);
                fulfill(data);
            });
            console.log("sending " + ssn + "to request queue");
    });
};

router.get('/', function(req, res) {
        res.json({
                message: 'Welcome to the K-12 service!'
        });
        
});

router.put('/students/:ssn', function(req, res) {
        console.log("Updating student with ID: " + req.params.ssn);
        make_sqs_request(update_student(req.params.ssn, req.body), res);
});

router.post('/students/:ssn', function(req, res) {
        console.log("Creating a new student with ID: " + req.params.ssn);
        //console.log(JSON.stringify(req.body));
        make_sqs_request(create_student(req.params.ssn, req.body), res);
});

router.delete('/students/:ssn', function(req, res) {
        console.log("Deleting student with ID: " + req.params.ssn);
        make_sqs_request(delete_student(req.params.ssn), res);
});
        

app.use('/api', router);
app.listen(port);
