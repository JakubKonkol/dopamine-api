const express = require('express');
const router = express.Router();
const WatchlistController = require('../controllers/watchlist.controller');
const {isAuthenticated} = require("../helpers/auth");

router.post('/movies', isAuthenticated, WatchlistController.addMovieToWatchlist);
router.get('/movies', isAuthenticated, WatchlistController.getUserWatchlist);
router.delete('/movies/:movieId', isAuthenticated, WatchlistController.deleteMovieFromWatchlist);

router.post('/tv', isAuthenticated, WatchlistController.addTVSeriesToWatchlist);
router.get('/tv', isAuthenticated, WatchlistController.getUserTVSeriesWatchlist);
router.delete('/tv/:tvSeriesId', isAuthenticated, WatchlistController.deleteTVSeriesFromWatchlist);

module.exports = router;