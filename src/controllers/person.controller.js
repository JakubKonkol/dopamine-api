const tmdb = require('../api/tmdb');

const getPopularPersons = async (req, res) => {
    tmdb.get('/trending/person/week').then((response) => {
        res.json(response.data);
    }).catch((error) => {
        res.status(500).json({ error: 'Internal Server Error' });
    })
}
const getPersonById = async (req, res) => {
    let personId = req.params.personId;
    tmdb.get(`/person/${personId}`).then((response) => {
        res.json(response.data);
    }).catch((error) => {
        res.status(500).json({ error: 'Internal Server Error' });
    })
}
module.exports = {
    getPopularPersons,
    getPersonById
}