const express = require("express");
const api = express.Router();
const AWS = require("aws-sdk");
const { generarGIF } = require("../api/generadorgif");
const redis = require("redis");
const { promisify } = require("util");
const request = require('request');

// CRON
const schedule = require('node-schedule');

const CountdownTimer = require("../api/gifgenerator");

const redisClient = redis.createClient();
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);

require("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

/**
 * GET
 * @return GIF generated
 */
api.get("/", async (req, res) => {
  try {
    const now = new Date();
    const settings = {
      targetDateTime:
        req.query.expirationDate || now.setDate(now.getDate() + 1),
      fileName: req.query.fileName,
      width: parseInt(req.query.width) || 600,
      height: parseInt(req.query.height) || 200,
      backgroundColor: req.query.backgroundColor,
      numbersFontColor: req.query.numbersFontColor,
      labelsFontColor: req.query.labelsFontColor,
      labelFontSize: parseInt(req.query.labelFontSize),
      numberFontSize: parseInt(req.query.numberFontSize),
      numbersYoffset: parseInt(req.query.numbersYoffset),
      labelsYoffset: parseInt(req.query.labelsYoffset),
    };

    console.log("Generando imagen...");
    const countdownTimer = new CountdownTimer(settings);
    const gif = await countdownTimer.createGif();
    console.log("Imagen generada!");

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${req.query.fileName}.gif`,
      Body: gif,
      ContentType: "image/gif",
      ACL: "public-read",
    };

    await s3.upload(uploadParams).promise();

    res.setHeader("Content-Type", "image/gif");
    res.status(200).send(gif);

  } catch (error) {
    res.status(500).send({message: `Error al generar GIF: ${error}`})
  }
});

/**
 * GET
 * @return generated GIF
 */
api.get("/generar-gif", async (req, res) => {
  try {
    const now = new Date();
    const target_date_time =
      req.query.expirationDate || now.setDate(now.getDate() + 1);
    const nameImage = `${req.query.name}.gif` || "new_image.gif";
    const gifBuffer = await generarGIF(target_date_time); // Llama a la función para generar el GIF

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: nameImage,
      Body: gifBuffer,
      ContentType: "image/gif",
      ACL: "public-read",
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    const gifUrl = uploadResult.Location;
    console.log(gifUrl);

    res.set("Content-Type", "image/gif");
    // res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")

    res.json({ gifUrl });
  } catch (error) {
    console.error("Error al generar el GIF:", error);
    res.status(500).send("Error interno del servidor");
  }
});

/**
 * GET
 * @return updated GIF
 */
api.get("/v2", async (req, res) => {
  try {
    const id = req.query.name;
    const target_date_time =
      req.query.expirationDate || now.setDate(now.getDate() + 1);
    const nameImage = `${req.query.name}.gif` || "new_image.gif";
    const now = new Date();
    const cacheKey = `countdown-last-generated-${id}`;

    // Obtener la última fecha de generacion del GIF desde Redis
    const lastGenerated = await getAsync(cacheKey);
    const isOutDated = !lastGenerated || now - lastGenerated > 60000;

    if (isOutDated) {
      const gifBuffer = await generarGIF(target_date_time);
      await setAsync(cacheKey, now);

      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: nameImage,
        Body: gifBuffer,
        ContentType: "image/gif",
        ACL: "public-read",
      };

      const uploadResult = await s3.upload(uploadParams).promise();

      const gifUrl = uploadResult.Location;
      console.log(gifUrl);

      res.set("Content-Type", "image/gif");
    }

    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${nameImage}`;
    console.log(url);

    res.redirect(url);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error al devolver GIF actualizado");
  }
});

const cronExpression = '*/5 * * * *';

const cronGenerateGif = async () => {
  try {
    const options = {
       url: "http://localhost:5000/api/v1/images?fileName=HotSale2024&expirationDate=2024-05-22T00:00:00&height=150&numbersYoffset=80&labelsYoffset=110&backgroundColor=e5e5e5&labelsFontColor=000000&numbersFontColor=004A23",
       method: "GET",
    }

    request(options, (error, response, body) => {
      if (error) {
        console.log("Error al simular la solicitud: ", error);
        return;
      }

      // Simula la respuesta del endpoint
      const simulatedResponse = {
        status: response.statusCode,
        body: body // Puedes modificar el body si necesitas simular un resultado específico
      };

      if (simulatedResponse.status === 200) {
        console.log("Simulación correcta");
      } else {
        return;
      }
    })

  } catch(error) {
    console.error('Error generando y subiendo GIF:', error);
  }
}

schedule.scheduleJob(cronExpression, cronGenerateGif)



module.exports = api;
