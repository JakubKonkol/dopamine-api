const axios = require('axios');
const environment = require('../environments/environment.js');

const tmdb = axios.create({
    baseURL: 'https://api.themoviedb.org/3',
    headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + environment.TMDB_API_KEY,
    },
});

module.exports = tmdb;
