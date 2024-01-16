const express = require('express');
const app = express();
const port = 8080;
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
app.get('/', (req, res) =>{
    res.send('Hello World!');
})

const userRouter = require('./src/routes/users');
const tmdbRouter = require('./src/routes/tmdb');
app.use('/api/users', userRouter);
app.use('/api/tmdb', tmdbRouter);


app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerJsdoc(require("./swagger.json")))
);
app.listen(port, () =>{
    console.log(`Server is running on port ${port}`);
})