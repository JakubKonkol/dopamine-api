const tmdb = require('../api/tmdb');

const getTrendingSeries = async (req, res) => {
    tmdb.get('/trending/tv/day').then((response) => {
        res.json(response.data);
    }).catch((error) => {
        res.status(500).json({ error: 'Internal Server Error' });
    })
}
const getSeriesById = async (req, res) => {
    let seriesId = req.params.seriesId;
    tmdb.get(`/tv/${seriesId}`).then((response) => {
        res.json(response.data);
    }).catch((error) => {
        res.status(500).json({ error: 'Internal Server Error' });
    })
}
const getSeriesCast = async (req, res) => {
    let seriesId = req.params.seriesId;
    tmdb.get(`/tv/${seriesId}/credits`).then((response) => {
        res.json(response.data);
    }).catch((error) => {
        res.status(500).json({ error: 'Internal Server Error' });
    })
}
const getWatchProviders = async (req, res) => {
    let seriesId = req.params.seriesId;
    let region = req.query.region;
    tmdb.get(`/tv/${seriesId}/watch/providers`, {
        params: {
            region: region
        }
    }).then((response) => {
        res.json(response.data);
    }).catch((error) => {
        res.status(500).json({ error: 'Internal Server Error' });
    })
}
module.exports = {
    getTrendingSeries,
    getSeriesById,
    getSeriesCast,
    getWatchProviders
}