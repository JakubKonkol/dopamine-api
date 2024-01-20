const mongoose = require('mongoose');
const playlistSchema = require('./playlist');
const userSchema = new mongoose.Schema({
    email: { type: String, required: true },
    username: { type: String, required: true },
    authentication: {
        password: { type: String, required: true, select: false },
        salt: { type: String, select: false },
        sessionToken: { type: String, select: false },
    },
    userDetails: {
        watchList: [{ type: Number }],
        playlists: [playlistSchema],
    },
});
userSchema.index({ email: 1 }, { unique: true });
const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;