const tmdb = require('../api/tmdb');
const {createReview, getReviewByMovieId, deleteReviewByMovieAndReviewId, getReviewById} = require("../db/review.db");

const getPopularMovies = async (req, res) => {
    tmdb.get('/movie/popular').then((response) => {
        res.json(response.data);
    }).catch((error) => {
        res.status(500).json({ error: 'Internal Server Error' });
    })

};
const getTopRatedMovies = async (req, res) => {
    tmdb.get('/movie/top_rated').then((response) => {
        res.json(response.data);
    }).catch((error) => {
        res.status(500).json({ error: 'Internal Server Error' });
    })
}
const getUpcomingMovies = async (req, res) => {
    tmdb.get('/movie/upcoming').then((response) => {
        res.json(response.data);
    }).catch((error) => {
        res.status(500).json({ error: 'Internal Server Error' });
    })
}
const getSimilarMovies = async (req, res) => {
    let movieId = req.params.movieId;
    tmdb.get(`/movie/${movieId}/similar`).then((response) => {
        res.json(response.data);
    }).catch((error) => {
        res.status(500).json({ error: 'Internal Server Error' });
    })
}
const getMovieImages = async (req, res) => {
    let movieId = req.params.movieId;
    tmdb.get(`/movie/${movieId}/images`).then((response) => {
        res.json(response.data);
    }).catch((error) => {
        res.status(500).json({ error: 'Internal Server Error' });
    })
}
const getTrendingMovies = async (req, res) => {
    tmdb.get('/trending/movie/day').then((response) => {
        res.json(response.data);
    }).catch((error) => {
        res.status(500).json({ error: 'Internal Server Error' });
    })
}
const getMovieCast = async (req, res) => {
    let movieId = req.params.movieId;
    tmdb.get(`/movie/${movieId}/credits`).then((response) => {
        res.json(response.data);
    }).catch((error) => {
        res.status(500).json({ error: 'Internal Server Error' });
    })
}
const getWatchProviders = async (req, res) => {
    let movieId = req.params.movieId;
    let region = req.query.region;
    tmdb.get(`/movie/${movieId}/watch/providers`, {
        params: {
            region: region
        }
    }).then((response) => {
        res.json(response.data);
    }).catch((error) => {
        res.status(500).json({ error: 'Internal Server Error' });
    })
}
const getMovieById = async (req, res) => {
    let movieId = req.params.movieId;
    try {
        tmdb.get(`/movie/${movieId}`).then((response) => {
           return res.json(response.data);
        }).catch((error) => {
            res.status(404).json({ error: 'Invalid id or movie not found.' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
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
        res.status(500).json({ error: 'Internal Server Error' });
    })
}
const getGenres = async (req, res) =>{
    tmdb.get('/genre/movie/list?language=en').then((response) => {
        res.json(response.data);
    }).catch((error) => {
        res.status(500).json({ error: 'Internal Server Error' });
    })
}
const addReviewForMovie = async (req, res) => {
    const movieId = req.params.movieId;
    const userId = req.identity._id;
    const { review } = req.body;
    const reviewObj = {
        movieId: movieId,
        userId: userId,
        review: review
    }
    try{
        const review = await createReview(reviewObj);
        return res.status(200).json(review);
    }catch (err){
        res.status(500).json({error: 'Internal Server Error'});
    }
 }

const getReviewsForMovie = async (req, res) => {
    const movieId = req.params.movieId;
    if(isNaN(movieId)) return res.status(400).json({error: 'Movie id should be a number'});
    try{
        const reviews = await getReviewByMovieId(movieId);
        return res.status(200).json(reviews);
    }catch (err){
        res.status(500).json({error: 'Internal Server Error'});
    }
}
const removeReviewForMovieWithId = async (req, res) => {
    const movieId = req.params.movieId;
    if(isNaN(movieId)) return res.status(400).json({error: 'Movie id should be a number'});
    const reviewId = req.params.reviewId;
    try{
        const existingReview = await getReviewById(reviewId);
        if(!existingReview) return res.status(400).json({error: 'Review does not exist'});
        await deleteReviewByMovieAndReviewId(movieId, reviewId);
        res.status(200).json({message: 'Review deleted successfully'});
    }catch (err){
        res.status(500).json({error: 'Internal Server Error, Please enter valid movie id and review id'});
    }
}
module.exports = {
    getPopularMovies,
    getMovieById,
    searchMovie,
    getGenres,
    addReviewForMovie,
    getReviewsForMovie,
    removeReviewForMovieWithId,
    getTopRatedMovies,
    getUpcomingMovies,
    getSimilarMovies,
    getMovieImages,
    getTrendingMovies,
    getMovieCast,
    getWatchProviders
};
