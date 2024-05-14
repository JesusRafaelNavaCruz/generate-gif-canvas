const express = require('express');
const { generarGIF } = require('./generadorgif');
const AWS = require('aws-sdk');
require('dotenv').config();


const app = express();

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

app.get("/", async (req, res) => {
    const htmlResponse = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Viva Aerobus</title>
</head>
<body>
    <h1>Email CountDown for Email Viva Aerobus</h1>
    <small>Created by Jesus Rafael Nava Cruz</small>
</body>
</html>
    `
    res.status(200).send(htmlResponse)
});

// Ruta para generar y servir el GIF animado
app.get('/generar-gif', async (req, res) => {
    try {
        const now = new Date()
        const target_date_time = req.query.expirationDate || now.setDate(now.getDate() + 1)
        const nameImage = `${req.query.name}.gif` || "new_image.gif";
        const gifBuffer = await generarGIF(target_date_time); // Llama a la función para generar el GIF

        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: nameImage,
            Body: gifBuffer, 
            ContentType: "image/gif",
            ACL: "public-read",
        }

        const uploadResult = await s3.upload(uploadParams).promise();

        const gifUrl = uploadResult.Location;

        res.set('Content-Type', 'image/gif');
        // res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")

        res.json({ gifUrl })

    } catch (error) {
        console.error('Error al generar el GIF:', error);
        res.status(500).send('Error interno del servidor');
    }
});

// Puerto en el que escucha el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Express escuchando en el puerto ${PORT}`);
});
