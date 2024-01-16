const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    userDetails: {
        watchList: [{
            movieId: Number,
        }],
        playlists: [{
            playlist: [Number],
        }],
    },
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;