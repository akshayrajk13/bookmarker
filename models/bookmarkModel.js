const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2')
const bookmarkSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required']
    },
    url: {
        type: String,
        required: [true, 'URL is required']
    },
    time: { 
        type: Date, 
        default: Date.now 
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});
bookmarkSchema.plugin(mongoosePaginate);
const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
module.exports = Bookmark;