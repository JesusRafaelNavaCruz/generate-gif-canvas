const express = require("express");

const images = require("./images");

const router = express.Router();

router.get("/", (req, res) => {

    try {
        res.status(200).send({
            message: "API Funcionando",
        })
    } catch(err) {
        res.status(500).send("Server error")
    }
})

router.use("/images", images);

module.exports = router;