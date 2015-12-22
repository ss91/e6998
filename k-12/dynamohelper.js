
//dynamohelper
// call the packages we need
var express = require('express'); // call express
var app = express(); // define our app using express
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// Load credentials from local json file
var AWS_credentials_path = "./config2.json";
var config = require( AWS_credentials_path );
var AWS = require('aws-sdk'), AWS_credentials_path
AWS.config.loadFromPath(AWS_credentials_path);

var db = new AWS.DynamoDB({
    params: {
        TableName: 'student'
    }
});
config_params = []

var postStudent = function(msg_params, res) {
    var return_msg = {};
    if (msg_params.msg != undefined)
        return_msg['msgId'] = msg_params.msg.MessageId;
    var ssn = msg_params.ssn;
    var itemParams = {
        Key: {
            ssn: {
                S: ssn
            }
        }
    };
    db.getItem(itemParams, function(err, data) {
        if (!err) {
            console.log(JSON.stringify(data));
            if (JSON.stringify(data) === '{}') {
                console.log("Entry doesn't exist: Proceeding to save");

                var string_vals = {}
                for (var i = 0; i < config_params.length; i++) {
                    var key = config_params[i];
                    console.log(key);
                    if (msg_params.source == 'REST') {
                        //console.log(msg_params.msg.body[key]);
                        string_vals[key] = msg_params.msg.body[key];
                    } else
                        string_vals[key] = JSON.parse(msg_params.msg.Body)[key];
                }

                //console.log(JSON.stringify(string_vals));
                var itemParams = {
                    Item: {
                        ssn: {
                            S: ssn
                        },
                        values: {
                            S: JSON.stringify(string_vals)
                        }
                    }
                };
                var result = db.putItem(itemParams, function(err, data) {
                    if (!err) {
                        return_msg['code'] = "Saved to DB";
                        console.log(return_msg);
                        msg_params.callback.success(res, return_msg);
                    } else {
                        return_msg['code'] = "Error Saving to DB";
                        console.log(return_msg);
                        msg_params.callback.failure(res, return_msg);
                    }
                });
            } else {
                return_msg['code'] = "Entry Exists."
                console.log(return_msg);
                msg_params.callback.failure(res, return_msg);
            }
        } else {
            return_msg['code'] = "DB Access unavailable";
            msg_params.callback.failure(res, return_msg);
        }
    });
}

var putStudent = function(msg_params, res) {
    var return_msg = {};
    var ssn = msg_params.ssn;
    var itemParams = {
        Key: {
            ssn: {
                S: ssn
            }
        }
    };
    db.getItem(itemParams, function(err, data) {
        if (!err) {
            if (JSON.stringify(data) === '{}') {
                console.log("Entry Doesnt exist");
                return_msg['code'] = "Entry Doesnt exist";
                msg_params.callback.failure(res, return_msg);
            } else {
                var existing = {};
                existing = JSON.parse(data["Item"]["values"].S)

                var string_vals = {}
                for (var i = 0; i < config_params.length; i++) {
                    var key = config_params[i];
                    string_vals[key] = existing[key];
                    if (msg_params.source == 'REST') {
                        if (msg_params.msg.body[key] != null) {
                            string_vals[key] = msg_params.msg.body[key];
                        }
                    } else {
                        return_msg['msgId'] = msg_params.msg.MessageId;
                        if (JSON.parse(msg_params.msg.Body)[key] != null) {
                            string_vals[key] = JSON.parse(msg_params.msg.Body)[key];
                        }
                    }
                }

                console.log(JSON.stringify(string_vals));
                var itemParams = {
                    Item: {
                        ssn: {
                            S: ssn
                        },
                        values: {
                            S: JSON.stringify(string_vals)
                        }
                    }
                };
                var result = db.putItem(itemParams, function(err, data) {
                    if (!err) {
                        return_msg['code'] = "Saved to DB";
                        console.log(return_msg);
                        msg_params.callback.success(res, return_msg);
                    } else {
                        return_msg['code'] = "Error Saving to DB";
                        return_msg['msgId'] = msg_params.msg.MessageId;
                        console.log(return_msg);
                        msg_params.callback.failure(res, return_msg);
                    }
                });
            }
        }
    });
}

var getStudent = function(msg_params, res) {
    var return_msg = {};
    if (msg_params.source != 'REST')
        return_msg['msgId'] = msg_params.msg.MessageId;
    var ssn = msg_params.ssn;
    var itemParams = {
        Key: {
            ssn: {
                S: ssn
            }
        }
    };
    db.getItem(itemParams, function(err, data) {
        if (!err) {
            var existing = {};
            existing = JSON.parse(data["Item"]["values"].S);

            var string_vals = {}
            for (var i = 0; i < config_params.length; i++) {
                var key = config_params[i];
                string_vals[key] = 'NULL';
                if (existing[key] != undefined || existing[key] != null)
                    string_vals[key] = existing[key];
            }

            return_msg['code'] = JSON.stringify(string_vals);
            msg_params.callback.success(res, return_msg);
        } else {
            return_msg['code'] = "Error fetching entry";
            msg_params.callback.failure(res, return_msg);
        }
    });
}

var deleteStudent = function(msg_params, res) {
    var return_msg = {};
    if (msg_params.source != 'REST')
        return_msg['msgId'] = msg_params.msg.MessageId;
    var ssn = msg_params.ssn;
    var itemParams = {
        Key: {
            ssn: {
                S: ssn
            }
        }
    };
    db.deleteItem(itemParams, function(err, data) {
        if (err) {
            console.log(err);
            return_msg['code'] = "Error deleting " + ssn;
            msg_params.callback.failure(res, return_msg);
        } else {
            console.log("Successfully deleted :" + ssn);
            return_msg['code'] = "Successfully deleted :" + ssn;
            msg_params.callback.success(res, return_msg);
        }
    });
}

var setConfig = function(config) {

    config_params = config;
    console.log("New config params : " + config_params);
}

module.exports = {
    postStudent: postStudent,
    putStudent: putStudent,
    getStudent: getStudent,
    deleteStudent: deleteStudent,
    setConfig: setConfig
}