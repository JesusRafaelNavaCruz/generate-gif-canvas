const express = require('express');
const app = express();
const images = require("./api/images")

require('dotenv').config();

app.use(express.static("public"))
app.use(express.json({ extended: false }))


app.use("/api/images", images);


// Puerto en el que escucha el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Express escuchando en el puerto ${PORT}`);
});
