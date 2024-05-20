const express = require('express');

const api = require("../routes")

const app = express();

app.get("/", (req, res) => {

    try {
        res.status(200).send({
            message: "APP Funcionando",
        })
    } catch(err) {
        res.status(500).send("Server error")
    }

})

app.use("/api/v1", api)

module.exports = app;