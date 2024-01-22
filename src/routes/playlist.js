const express = require('express');
const router = express.Router();
const PlaylistController = require('../controllers/playlist.controller');
const {isAuthenticated} = require("../helpers/auth");

router.post('/', isAuthenticated, PlaylistController.createPlaylist)
router.get('/', isAuthenticated, PlaylistController.getPlaylists)
router.delete('/remove/:playlistID', isAuthenticated, PlaylistController.removePlaylist)
router.put('/update/:playlistID', isAuthenticated, PlaylistController.updatePlaylist)

module.exports = router;