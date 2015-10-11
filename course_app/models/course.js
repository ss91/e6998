var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var CourseSchema   = new Schema({
    course: String,
    idLists: [Number]
});

module.exports = mongoose.model('Course', CourseSchema);