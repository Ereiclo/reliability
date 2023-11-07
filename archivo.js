const express = require('express')
const app = express();
const axios = require('axios');

app.get('/list', (req,res) => {
    const name = req.query.name;
    axios.get(`https://api.jikan.moe/v4/anime?q=${name}`)
})