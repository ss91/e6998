// app/models/student.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var StudentSchema   = new Schema({
    id: Number,
	name: String,
	courses: String
});

module.exports = mongoose.model('Student', StudentSchema);

