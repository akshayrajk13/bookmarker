const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name field is required']
    },
    email: {
        type: String,
        required: [true, 'E-mail field is required']
    },
    password: {
        type: String,
        required: [true, 'Password field is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    }
});
const User = mongoose.model('User', userSchema);
module.exports = User;