const express = require('express');
const UserController = require('../controllers/UserController');
const {isAuthenticated, isOwner} = require("../helpers/auth");
const router = express.Router();


router.post('/register', UserController.register)
router.post('/login', UserController.login)
router.get('/profile', isAuthenticated, UserController.getProfile)
router.post('/logout', isAuthenticated, UserController.logout)
router.delete('/delete/:userId', isAuthenticated, UserController.deleteUser)
router.patch('/update', isAuthenticated, UserController.updateUsernameAndEmail);
module.exports = router;