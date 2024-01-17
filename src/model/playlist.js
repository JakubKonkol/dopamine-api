const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    movies: [{ type: Number }],
    tvSeries: [{ type: Number }],
})

module.exports = playlistSchema