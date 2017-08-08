var mongoose = require('mongoose');

var TodoSchema = mongoose.Schema({
    
                creator: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
                todo: String,
                isDone: Boolean
});

module.exports = mongoose.model('Todo', TodoSchema);