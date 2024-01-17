const express = require('express');
const router = express.Router();
const WatchlistController = require('../controllers/WatchlistController');
const {isAuthenticated} = require("../helpers/auth");

router.post('/', isAuthenticated, WatchlistController.addMovieToWatchlist);
router.get('/', isAuthenticated, WatchlistController.getUserWatchlist);
router.delete('/:movieId', isAuthenticated, WatchlistController.deleteMovieFromWatchlist);

module.exports = router;