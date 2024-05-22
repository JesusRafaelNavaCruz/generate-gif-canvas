const { createCanvas, registerFont } = require("canvas")
const GIFEncoder = require("gifencoder");
const moment = require('moment-timezone');
const fontPath = "./fonts/Poppins-SemiBold.ttf";

class CountdownTimer {
    constructor(settings) {

        this.targetDateTime = new Date(settings.targetDateTime);
        this.fileName = settings.fileName || `${new Date()}-${Math.floor(Math.random() * 100)}.gif`;
        this.width = settings.width || 600;
        this.height = settings.height || 200;
        this.backgroundColor = `#${settings.backgroundColor}` || "#f4f4f4";
        this.numbersFontColor = `#${settings.numbersFontColor}` || "#004A23";
        this.labelsFontColor = `#${settings.labelsFontColor}` || "#004A23";
        this.labelFontSize = settings.labelFontSize || 60;
        this.numberFontSize = settings.numberFontSize || 240;
        this.numbersYoffset = settings.numbersYoffset || 100;
        this.labelsYoffset = settings.labelsYoffset || 150; 

        this.now = new Date();
        this.seconds = 30;

        this.encoder = new GIFEncoder(this.width, this.height);
        this.encoder.start();
        this.encoder.setRepeat(0);
        this.encoder.setDelay(1000);
        this.encoder.setQuality(10);

        this.targetTimeZone = "America/Mexico_City"
        this.targetDateTimeMoment = moment.utc(this.targetDateTime).tz(this.targetTimeZone, true);
        this.nowMoment = moment.tz(this.targetTimeZone);

    }

    drawFrame() {
        registerFont(fontPath, {family: "Poppins"});
        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext("2d");

        // Rellena el fondo
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.width, this.height);

        // Calcular tiempo restante
        //const interval = Math.max(0, this.targetDateTimeUTC.getTime() - this.nowUTC.getTime());
        const interval = Math.max(0, this.targetDateTimeMoment.valueOf() - this.nowMoment.valueOf())

        const days = Math.floor(interval / (1000 * 60 * 60 * 24));
        const hours = Math.floor((interval % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((interval % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((interval % (1000 * 60)) / 1000);

        const formattedDays = days.toString().padStart(2, "0")
        const formattedHours = hours.toString().padStart(2, "0")
        const formattedMinutes = minutes.toString().padStart(2, "0")
        const formattedSeconds = seconds.toString().padStart(2, "0")
    
        // Dibujar el texto en el lienzo
        ctx.font = `bold ${this.numberFontSize * 0.25}px Poppins, Arial, sans-serif`;
        ctx.fillStyle = this.numbersFontColor;
        ctx.textAlign = "center";
        ctx.fillText(`${formattedDays}`, 20 + 20 + 20 + 20, this.numbersYoffset);
        ctx.fillText(`${formattedHours}`, 20 + 135 + 20 + 20 + 20, this.numbersYoffset);
        ctx.fillText(`${formattedMinutes}`, 20 + 135 + 20 + 135 + 20 + 20 + 20, this.numbersYoffset);
        ctx.fillText(`${formattedSeconds}`, 20 + 135 + 20 + 135 + 20 + 135 + 20 + 20 + 20, this.numbersYoffset);
    
        // Dibujar labels
        ctx.font = `${this.labelFontSize * 0.25}px Poppins, Arial, sans-serif`;
        ctx.fillStyle = this.labelsFontColor;
        ctx.textAlign = "center"
        ctx.fillText("Día",  20 + 20 + 20 + 20, this.labelsYoffset);
        ctx.fillText("Horas", 20 + 135 + 20 + 20 + 20, this.labelsYoffset);
        ctx.fillText("Minutos", 20 + 135 + 20 + 135 + 20 + 20 + 20, this.labelsYoffset);
        ctx.fillText("Segundos", 20 + 135 + 20 + 135 + 20 + 135 + 20 + 20 + 20, this.labelsYoffset);
        
        this.encoder.addFrame(ctx);

        //this.nowUTC = new Date(this.nowUTC.getTime() + 1000);
        this.nowMoment.add(1, "seconds")

    }

    createGif() {
        for (let i = 0; i < this.seconds; i++) {
            this.drawFrame();
        }
        this.encoder.finish();
        return this.encoder.out.getData();
    }
}

module.exports = CountdownTimer