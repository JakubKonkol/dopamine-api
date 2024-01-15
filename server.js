const express = require('express');
const app = express();
const port = 8080;

app.get('/', (req, res) =>{
    res.send('Hello World!');
})

const userRouter = require('./routes/users');
const tmdbRouter = require('./routes/tmdb');
app.use('/api/users', userRouter);
app.use('/api/tmdb', tmdbRouter);
app.listen(port, () =>{
    console.log(`Server is running on port ${port}`);
})