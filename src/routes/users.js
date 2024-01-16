const express = require('express');
const {createUser} = require("../../db/usersDB");
const router = express.Router();

router.get('/', (req, res) =>{
    res.send('Hello users route!');
})
router.post('/register', (req, res) => {
    try {
        const {username, email, password} = req.body;
        const newUser = createUser({username, email, password});
        res.status(201).json(newUser);
    } catch (error) {
        console.error(`Error while creating user`, error.message);
        res.status(500).json({error: 'Internal Server Error'});
    }
});
module.exports = router;