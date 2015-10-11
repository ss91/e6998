var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var StudentSchema   = new Schema({
    name: String,
    course: String,
    id: Number
});

module.exports = mongoose.model('Student', StudentSchema);