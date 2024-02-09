const {getUserById} = require("../db/users.db");
const addMovieToWatchlist = async (req, res) => {
    try {
        const movieId = req.query.movieId;
        if (!movieId) {
            return res.status(400).json({ error: 'Movie id not provided' });
        }
        if (isNaN(movieId)) {
            return res.status(400).json({ error: 'Movie id should be a number' });
        }
        if(movieId < 0){
            return res.status(400).json({ error: 'Movie id should be a positive number' });
        }
        const userId = req.identity._id;
        const userData = await getUserById(userId).select('+userDetails.watchList');
        const watchList = userData.userDetails.movieWatchList;

        if (watchList.includes(movieId)) {
            return res.status(400).json({ error: 'Movie already exists in watchlist' });
        }
        watchList.push(movieId);
        userData.userDetails.movieWatchList = watchList;
        await userData.save();

        return res.status(200).json({ message: 'Movie added to watchlist successfully'});

    } catch (err) {
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}
const getUserMoviesWatchlist = async (req, res) => {
    try{
     const userId = req.identity._id;
        const userData = await getUserById(userId).select('+userDetails.watchList');
        const watchList = userData.userDetails.movieWatchList;
        return res.status(200).json({movies: watchList});
    }catch (err) {
        res.status(500).json({error: err.message || 'Internal Server Error'});
    }
}
const deleteMovieFromWatchlist = async (req, res) => {
    try{
        const movieId = req.params.movieId;
        const userId = req.identity._id;
        if(isNaN(movieId)){
            return res.status(400).json({error: 'Movie id should be a number'});
        }
        if(movieId < 0){
            return res.status(400).json({error: 'Movie id should be a positive number'});
        }
        let userData = await getUserById(userId).select('+userDetails.watchList');
        let watchList = userData.userDetails.movieWatchList;
        if(!watchList.includes(movieId)){
            return res.status(400).json({error: 'Movie does not exist in watchlist'});
        }
        watchList.splice(watchList.indexOf(movieId), 1);
        userData.userDetails.movieWatchList = watchList;
        await userData.save();
        return res.status(200).json({message: 'Movie deleted from watchlist successfully'});
    }catch (err) {
        res.status(500).json({error: err.message || 'Internal Server Error'});
    }
}
const addTVSeriesToWatchlist = async (req, res) => {
    try {
        const seriesId = req.query.seriesId;
        if (!seriesId) {
            return res.status(400).json({ error: 'Series id not provided' });
        }
        if (isNaN(seriesId)) {
            return res.status(400).json({ error: 'Series id should be a number' });
        }
        if(seriesId < 0){
            return res.status(400).json({ error: 'Series id should be a positive number' });
        }
        const userId = req.identity._id;
        const userData = await getUserById(userId).select('+userDetails.watchList');
        const watchList = userData.userDetails.tvSeriesWatchList;

        if (watchList.includes(seriesId)) {
            return res.status(400).json({ error: 'Series already exists in watchlist' });
        }
        watchList.push(seriesId);
        userData.userDetails.tvSeriesWatchList = watchList;
        await userData.save();

        return res.status(200).json({ message: 'Series added to watchlist successfully'});

    } catch (err) {
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }

}
const getUserTVSeriesWatchlist = async (req, res) => {
    try{
        const userId = req.identity._id;
        const userData = await getUserById(userId).select('+userDetails.watchList');
        const watchList = userData.userDetails.tvSeriesWatchList;
        return res.status(200).json({TVseries: watchList});
    }catch (err) {
        res.status(500).json({error: err.message || 'Internal Server Error'});
    }
}
const deleteTVSeriesFromWatchlist = async (req, res) => {
    try{
        const seriesId = req.params.tvSeriesId;
        const userId = req.identity._id;
        if(isNaN(seriesId)){
            return res.status(400).json({error: 'Series id should be a number'});
        }
        if(seriesId < 0){
            return res.status(400).json({error: 'Series id should be a positive number'});
        }
        let userData = await getUserById(userId).select('+userDetails.watchList');
        let watchList = userData.userDetails.tvSeriesWatchList;
        if(!watchList.includes(seriesId)){
            return res.status(400).json({error: 'Series does not exist in watchlist'});
        }
        watchList.splice(watchList.indexOf(seriesId), 1);
        userData.userDetails.tvSeriesWatchList = watchList;
        await userData.save();
        return res.status(200).json({message: 'Series deleted from watchlist successfully'});
    }catch (err) {
        res.status(500).json({error: err.message || 'Internal Server Error'});
    }

}
module.exports = {
    addMovieToWatchlist,
    getUserWatchlist: getUserMoviesWatchlist,
    deleteMovieFromWatchlist,
    addTVSeriesToWatchlist,
    getUserTVSeriesWatchlist,
    deleteTVSeriesFromWatchlist
}