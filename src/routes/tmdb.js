const express = require('express');
const { getPopularMovies, getMovieById, searchMovie} = require('../services/movies');
const router = express.Router();
router.get('/movies/popular', getPopularMovies);
router.get('/movies/id/:movieId', async (req, res) => {
    try {
        const movie = await getMovieById(req.params.movieId);
        res.json(movie);
    } catch (error) {
        console.error(`Error while getting movie details`, error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.get('/movies/search', async (req, res) => {
  try{
      searchMovie(req.query.query).then((response) => {
            res.json(response.data);
      });

  }catch (error) {
      console.error(`Error while searching movie`, error.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
})

module.exports = router;