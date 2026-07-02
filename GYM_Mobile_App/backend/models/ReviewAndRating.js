const mongoose = require('mongoose');

const reviewAndRatingSchema = new mongoose.Schema({
    PersonID: {
        type: String,
        required: true,
    },
    Review: {
        type: String,
        required: true,
    },
    Rating: {
        type: Number,
        required: true,
    },

}, { timestamps: true });

module.exports = mongoose.model('ReviewAndRating', reviewAndRatingSchema);