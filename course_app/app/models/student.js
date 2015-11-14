var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var StudentSchema   = new Schema({
    name: String,
    course: [Number],
    id: Number
});

module.exports = mongoose.model('Student', StudentSchema);