const {getUserById} = require("../db/users.db");

const addMovieToWatchlist = async (req, res) => {
    try {
        const movieId = req.query.movieId;
        if (!movieId) {
            return res.status(400).json({ error: 'Movie id not provided' });
        }
        if(typeof movieId !== 'number'){
            return res.status(400).json({ error: 'Movie id should be a number' });
        }
        const userId = req.identity._id;
        const userData = await getUserById(userId).select('+userDetails.watchList');
        const watchList = userData.userDetails.watchList;

        if (watchList.includes(movieId)) {
            return res.status(400).json({ error: 'Movie already exists in watchlist' });
        }
        watchList.push(movieId);
        userData.userDetails.watchList = watchList;
        await userData.save();

        return res.status(200).json({ message: 'Movie added to watchlist successfully'});

    } catch (err) {
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}
const getUserWatchlist = async (req, res) => {
    try{
     const userId = req.identity._id;
        const userData = await getUserById(userId).select('+userDetails.watchList');
        const watchList = userData.userDetails.watchList;
        return res.status(200).json(watchList);
    }catch (err) {
        res.status(500).json({error: err.message || 'Internal Server Error'});
    }
}
const deleteMovieFromWatchlist = async (req, res) => {
    try{
        const movieId = req.params.movieId;
        const userId = req.identity._id;
        const userData = await getUserById(userId).select('+userDetails.watchList');
        const watchList = userData.userDetails.watchList;
        watchList.splice(watchList.indexOf(movieId), 1);
        userData.userDetails.watchList = watchList;
        await userData.save();
        return res.status(200).json({message: 'Movie deleted from watchlist successfully', watchList});
    }catch (err) {
        res.status(500).json({error: err.message || 'Internal Server Error'});
    }
}
module.exports = {
    addMovieToWatchlist,
    getUserWatchlist,
    deleteMovieFromWatchlist
}