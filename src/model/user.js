const mongoose = require('mongoose');
const playlistSchema = require('./playlist');
const userSchema = new mongoose.Schema({
    email: { type: String, required: true },
    username: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    creationDate: { type: Date, default: Date.now },
    authentication: {
        password: { type: String, required: true, select: false },
        salt: { type: String, select: false },
        sessionToken: { type: String, select: false },
    },
    userDetails: {
        movieWatchList: [{ type: Number }],
        tvSeriesWatchList: [{ type: Number }],
        movieHistory: [{ type: Number }],
        tvSeriesHistory: [{ type: Number }],
        playlists: [playlistSchema],
    },
});
userSchema.index({ email: 1 }, { unique: true });
const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;