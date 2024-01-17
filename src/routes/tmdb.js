const express = require('express');
const router = express.Router();
const MovieController = require('../controllers/MovieController');
router.get('/movies/popular', MovieController.getPopularMovies);

router.get('/movies/id/:movieId', MovieController.getMovieById);

router.get('/movies/search', MovieController.searchMovie)

module.exports = router;