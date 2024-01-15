const express = require('express');
const { getPopularMovies } = require('../services/movies');
const router = express.Router();

router.get('/popular', getPopularMovies);

module.exports = router;