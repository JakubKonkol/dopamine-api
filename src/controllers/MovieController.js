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
    try{
        console.log('searching for movie with query: '+ query)
        const response = await tmdb.get('/search/movie', {
            params: {
                query: query,
                include_adult: false,
                language: 'en-US',
                page: 1,
            }
        })
        if(response.status === 200){
            res.json(response.data);
        }
    }catch (error){
        console.log('searchMovie failed')
        throw error
    }
}

module.exports = {
    getPopularMovies,
    getMovieById,
    searchMovie
};
