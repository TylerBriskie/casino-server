const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        index: {
            unique: true,
            dropDups: true
        }
    },
    display_name: String,
    password: String,
    credits: Number,
    date_created: Date,
    date_updated: Date
    
});

module.exports = mongoose.model('user', userSchema, 'users');