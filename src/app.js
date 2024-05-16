const express = require('express');

const api = require("./api")

const app = express();

app.get("/", (req, res) => {
    res.json({
        message: "Hola 🌎"
    })
})

app.use("/api/v1", api)

module.exports = app;