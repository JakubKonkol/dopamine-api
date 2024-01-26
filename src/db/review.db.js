const ReviewModel = require('../model/review');

const getAllReviews = () => ReviewModel.find();
const getReviewByMovieId = (movieId) => ReviewModel.find({movieId})
const getReviewById = (id) => ReviewModel.findById(id)
const getReviewByUserId = (userId) => ReviewModel.find({userId})
const createReview = (review) => new ReviewModel(review).save().then((review)=> review.toObject());
const deleteReviewById = (id) => ReviewModel.findByIdAndDelete(id);
const deleteReviewByMovieAndReviewId = (movieId, reviewId) => ReviewModel.findOneAndDelete({movieId, _id: reviewId});
//add mongo aggregate methods
module.exports = {
    getAllReviews,
    getReviewByMovieId,
    getReviewById,
    createReview,
    deleteReviewById,
    getReviewByUserId,
    deleteReviewByMovieAndReviewId
}