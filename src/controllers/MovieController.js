const tmdb = require('../api/tmdb');

const getPopularMovies = async (req, res) => {
    tmdb.get('/movie/popular').then((response) => {
        res.json(response.data);
    }).catch((error) => {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    })

};
const getMovieById = async (req, res) => {
    let movieId = req.params.movieId;
    try {
        const response = await tmdb.get(`/movie/${movieId}`);
        res.json(response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching movie with id ${movieId}:`, error);
        throw error;
    }
};

const searchMovie = async (req, res) =>{
    let query = req.query.query;
    tmdb.get('/search/movie', {
        params: {
            query: query,
            include_adult: false,
            language: 'en-US',
            page: 1,
        }
    }).then((response) => {
        res.json(response.data);
    }).catch((error) => {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    })
}
const getGenres = async (req, res) =>{
    tmdb.get('/genre/movie/list').then((response) => {
        res.json(response.data);
    }).catch((error) => {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    })
}

module.exports = {
    getPopularMovies,
    getMovieById,
    searchMovie,
    getGenres
};
