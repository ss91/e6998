var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var CourseSchema   = new Schema({
    course_name: String,
    course_id: Number,
    idLists: [Number]
});

module.exports = mongoose.model('Course', CourseSchema);