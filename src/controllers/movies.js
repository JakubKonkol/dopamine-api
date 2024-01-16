const tmdb = require('../api/tmdb');

const getPopularMovies = async (req, res) => {
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

const getMovieById = async (movieId) => {
    try {
        const response = await tmdb.get(`/movie/${movieId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching movie with id ${movieId}:`, error);
        throw error;
    }
};

const searchMovie = async (query) =>{
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
            return response.data;
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
