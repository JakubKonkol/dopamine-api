const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    movieId: { type: Number, required: true },
    userId: { type: String, required: true },
    review: { type: String, required: true },
})
const ReviewModel = mongoose.model('Review', reviewSchema);

module.exports = ReviewModel;