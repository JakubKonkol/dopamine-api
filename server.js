const express = require('express');
const app = express();
const port = 8080;
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const mongoose = require('mongoose');
const credentials = require('./src/db/credentials.json');
const bodyParser = require('body-parser');
const cors = require('cors')
const cookieParser = require("cookie-parser");

app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser())

// SETUP ROUTES
const userRouter = require('./src/routes/users');
const tmdbRouter = require('./src/routes/tmdb');
const watchlistRouter = require('./src/routes/watchlist');
const playlistRouter = require('./src/routes/playlist');
const movieRouter = require('./src/routes/movie');

app.use('/api/user', userRouter);
app.use('/api/tmdb', tmdbRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/playlist', playlistRouter);
app.use('/api/movie', movieRouter);


// SETUP MONGODB
mongoose.connect(credentials.mongo.connectionString);
const db = mongoose.connection;
db.on('error', err => {
    console.error('MongoDB error: ' + err.message)
    process.exit(1)
})
db.once('open', () => console.log('MongoDB connection established'))

// SETUP SWAGGER
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerJsdoc(require("./swagger.json")))
);
app.listen(port, () =>{
    console.log(`Server is running on port ${port}`);
})