const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const bodyparser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const connectDB = require('./server/database/connection');

const app = express();


dotenv.config({ path: 'config.env' });
const PORT = process.env.PORT || 8080;

// log requests
app.use(morgan('tiny'));
app.use(cookieParser());

// MongoDB connection
connectDB();

// parse - request to body parser
app.use(bodyparser.urlencoded({ extended: true }));

// set view engine
app.set("view engine", "ejs");

// load assets
app.use('/css', express.static(path.resolve(__dirname, "assets/css")));
// use - css/style.css
app.use('/images', express.static(path.resolve(__dirname, "assets/images")));
app.use('/js', express.static(path.resolve(__dirname, "assets/js")));

// Load router
app.use('/', require('./server/routes/router'));

mongoose.connection.once('open', () =>
{
    app.listen(PORT, () =>
    {
        console.log(`server is running on http://localhost:${PORT}`);
    })
});