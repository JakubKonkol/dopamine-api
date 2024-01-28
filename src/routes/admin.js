const express = require('express');
const {getAllUsers, makeUserAdmin, removeAdmin} = require("../controllers/admin.controller");
const {isAuthenticated, isAdmin} = require("../helpers/auth");
const router = express.Router();

router.get('/users', isAuthenticated, isAdmin, getAllUsers)
router.put('/makeAdmin/:userId', isAuthenticated, isAdmin, makeUserAdmin)
router.put('/removeAdmin/:userId', isAuthenticated, isAdmin, removeAdmin)

module.exports = router;