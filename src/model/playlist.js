const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    name: { type: String, required: true },
    movies: [{ type: Number }],
    tvSeries: [{ type: Number }],
})

module.exports = playlistSchema