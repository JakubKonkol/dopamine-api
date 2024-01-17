const express = require('express');
const router = express.Router();

router.get('/', (req, res) =>{
    res.send('Hello users route!');
})

module.exports = router;