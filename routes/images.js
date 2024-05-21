const express = require("express");
const api = express.Router();
const AWS = require("aws-sdk");
const { generarGIF } = require("../api/generadorgif");
const redis = require("redis");
const { promisify } = require("util");

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
 * POST
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
      fontColor: req.query.fontColor,
      labelFontSize: parseInt(req.query.labelFontSize),
      numberFontSize: parseInt(req.query.numberFontSize),
    };

    console.log(`Creando GIF: ${req.query.fileName}`)
    const countdownTimer = new CountdownTimer(settings);
    const gif = await countdownTimer.createGif();
    console.log("GIF CREADO");

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${req.query.fileName}.gif`,
      Body: gif,
      ContentType: "image/gif",
      ACL: "public-read",
    };

    console.log("Subiendo a S3");
    const uploadResult = await s3.upload(uploadParams).promise();
    const urlGif = uploadResult
    console.log(urlGif);

    const data = [{
      fileName: urlGif.key,
      fileLocation: urlGif.Location,
    }]
    res.setHeader("Content-Type", "application/json");
    res.status(200).send({message: "Images Created!", data: data});
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

module.exports = api;
