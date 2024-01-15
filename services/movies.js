const tmdb = require('../api/tmdb');

exports.getPopularMovies = async (req, res) => {
    try {
        const response = await tmdb.get('/movie/popular');
        const movies = [];

        for (const item of response.data.results) {
            const detailedMovie = await getMovieById(item.id);
            movies.push(detailedMovie);
        }

        res.json(movies);
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

async function getMovieById(movieId) {
    try {
        const response = await tmdb.get(`/movie/${movieId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching movie with id ${movieId}:`, error);
        throw error; // Rethrow the error to be caught by the caller
    }
}