const express = require('express');
const router = express.Router();
const {isAuthenticated} = require("../helpers/auth");
const MovieController = require('../controllers/movie.controller');

router.post('/:movieId/reviews', isAuthenticated, MovieController.addReviewForMovie)
router.get('/:movieId/reviews', isAuthenticated, MovieController.getReviewsForMovie);
router.delete('/:movieId/reviews/:reviewId', isAuthenticated, MovieController.removeReviewForMovieWithId);

module.exports = router;