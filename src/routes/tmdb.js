const express = require('express');
const router = express.Router();
const MovieController = require('../controllers/movie.controller');
const TVSeriesController = require('../controllers/tvseries.controller');
router.get('/movie/popular', MovieController.getPopularMovies);

router.get('/movie/:movieId', MovieController.getMovieById);

router.get('/search/movie', MovieController.searchMovie)

router.get('/genres/movie', MovieController.getGenres)

router.get('/movie/:movieId/cast', MovieController.getMovieCast);

router.get('/movie/:movieId/watch/providers', MovieController.getWatchProviders);

router.get('/movie/:movieId/similar', MovieController.getSimilarMovies);

router.get('/movie/:movieId/images', MovieController.getMovieImages);

router.get('/trending/movie', MovieController.getTrendingMovies);

router.get('tv/popular', TVSeriesController.getTrendingSeries);

router.get('/tv/:seriesId', TVSeriesController.getSeriesById);

router.get('/tv/:seriesId/cast', TVSeriesController.getSeriesCast);

router.get('/tv/:seriesId/watch/providers', TVSeriesController.getWatchProviders);
module.exports = router;