const express = require('express');
const router = express.Router();
const MovieController = require('../controllers/movie.controller');
router.get('/movie/popular', MovieController.getPopularMovies);

router.get('/movie/:movieId', MovieController.getMovieById);

router.get('/search/movie', MovieController.searchMovie)

router.get('/movie/genres', MovieController.getGenres)

module.exports = router;