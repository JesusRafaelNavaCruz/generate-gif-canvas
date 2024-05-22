const express = require("express");
const api = express.Router();
const AWS = require("aws-sdk");
const { generarGIF } = require("../api/generadorgif");
const redis = require("redis");
const { promisify } = require("util");
const request = require('request');
const fs = require("fs")
const path = require("path")

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
 * Genera GIF con los parametros
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

    const countdownTimer = new CountdownTimer(settings);
    const gif = await countdownTimer.createGif();

    
    const filePath = path.join(__dirname, "gifs", `${settings.fileName}.gif`);
    const settingsFilePath = path.join(__dirname, "gifs", `${settings.fileName}.json`);

    try {
      await fs.promises.writeFile(filePath, gif)
      await fs.promises.writeFile(settingsFilePath, JSON.stringify(settings, null, 2));

      console.log(`Gif Guardado correctamente: ${filePath}`);
      console.log(`Configuración Guardado correctamente: ${settingsFilePath}`);
      res.status(200).json({
        message: "GIF generado y guardado correctamente",
        apiPath: `${process.env.API_PATH}/${settings.fileName}`,
        path: filePath,
      })
    }catch (e) {
      res.status(500).send({message: `Error al guardar GIF: ${e}`});
    }

  } catch (error) {
    res.status(500).send({message: `Error al generar GIF: ${error}`})
  }
});

/**
 * GET
 * generated GIF OLD
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
 * Actualiza GIF
 */
api.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const filePath = path.join(__dirname, "gifs", `${id}.gif`);
    const settingsFilePath = path.join(__dirname, "gifs", `${id}.json`);

    if (!fs.existsSync(filePath)) {
      res.status(404).send({
        message: "Imagen no encontrada",
      });
    }

    if(!fs.existsSync(settingsFilePath)) {
      return res.status(404).send({
        message: "Configuración no encontrada"
      })
    }

    const settingsData = await fs.promises.readFile(settingsFilePath);
    const settings = JSON.parse(settingsData);

    const countdownTimer = new CountdownTimer(settings)
    const newGif = countdownTimer.createGif();

    await fs.promises.writeFile(filePath, newGif);

    const gifBuffer = await fs.promises.readFile(filePath);

    res.set("Content-Type", "image/gif")
    res.send(gifBuffer);

  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: `Error al devolver GIF actualizado ${err}`
    });
  }
});



// CRON JOB
const cronExpression = '*/1 * * * *';

const cronGenerateGif = async () => {
  try {
    const options = {
       url: "http://localhost:5000/api/v1/images?fileName=HotSale2024_2&expirationDate=2024-05-23T23:00:00&height=150&numbersYoffset=80&labelsYoffset=110&backgroundColor=f5f5f5&labelsFontColor=000000&numbersFontColor=004A23&labelFontSize=52",
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

//schedule.scheduleJob(cronExpression, cronGenerateGif)



module.exports = api;
