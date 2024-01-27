const { getUserById } = require('../db/users.db');

const createPlaylist = async (req, res) => {
    const name = req.query.name;
    try{
        const currentUserID = req.identity._id;
        const user = await getUserById(currentUserID).select('-authentication.password -authentication.salt -authentication.sessionToken');
        const playlist = {
            name: name,
            movies: [],
            tvSeries: []
        }
        user.userDetails.playlists.push(playlist);
        await user.save();
        return res.status(200).json({message: 'Playlist created successfully'});
    }catch (err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
}
const getPlaylists = async (req, res) => {
    try{
        const currentUserID = req.identity._id;
        const user = await getUserById(currentUserID).select('-authentication.password -authentication.salt -authentication.sessionToken');
        return res.status(200).json(user.userDetails.playlists);
    }catch (err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
}
const updatePlaylist = async (req, res) => {
    const playlistID = req.params.playlistID;
    const updatedPlaylist = req.body;
    try{
        const currentUserID = req.identity._id;
        const user = await getUserById(currentUserID).select('-authentication.password -authentication.salt -authentication.sessionToken');
        const playlist = user.userDetails.playlists.id(playlistID);
        if(!playlist) return res.status(400).json({error: 'Playlist does not exist'})
        playlist.name = updatedPlaylist.name;
        playlist.movies = updatedPlaylist.movies;
        playlist.tvSeries = updatedPlaylist.tvSeries;
        await user.save();
        return res.status(200).json({message: 'Playlist updated successfully'});
    }catch (err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
}
//check if exists
const removePlaylist = async (req, res) => {
    const playlistID = req.params.playlistID;
    try{
        const currentUserID = req.identity._id;
        const user = await getUserById(currentUserID).select('-authentication.password -authentication.salt -authentication.sessionToken');
        const playlist = user.userDetails.playlists.id(playlistID);
        if(!playlist) return res.status(400).json({error: 'Playlist does not exist'})
        user.userDetails.playlists.splice(user.userDetails.playlists.indexOf(playlist), 1);
        await user.save();
        return res.status(200).json({message: 'Playlist removed successfully'});
    }catch (err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
}
module.exports = {
    createPlaylist,
    getPlaylists,
    removePlaylist,
    updatePlaylist
}