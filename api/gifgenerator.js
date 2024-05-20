const { createCanvas } = require("canvas")
const GIFEncoder = require("gifencoder");

class CountdownTimer {
    constructor(settings) {

        this.targetDateTime = new Date(settings.targetDateTime);
        this.fileName = settings.fileName || `${new Date()}-${Math.floor(Math.random() * 100)}.gif`;
        this.width = settings.width || 600;
        this.height = settings.height || 200;
        this.backgroundColor = settings.backgroundColor || "#f4f4f4";
        this.fontColor = settings.fontColor || "#004A23";
        this.labelFontSize = settings.labelFontSize || 60;
        this.numberFontSize = settings.numberFontSize || 240;

        this.now = new Date();
        this.seconds = 30;

        this.encoder = new GIFEncoder(this.width, this.height);
        this.encoder.start();
        this.encoder.setRepeat(0);
        this.encoder.setDelay(1000);
        this.encoder.setQuality(10);

    }

    drawFrame() {
        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext("2d");

        // Rellena el fondo
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.width, this.height);

        // Calcular tiempo restante
        const interval = Math.max(0, this.targetDateTime.getTime() - this.now.getTime());
        const days = Math.floor(interval / (1000 * 60 * 60 * 24));
        const hours = Math.floor((interval % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((interval % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((interval % (1000 * 60)) / 1000);
    
        // Dibujar el texto en el lienzo
        ctx.font = `bold ${this.numberFontSize * 0.25}px Arial`;
        ctx.fillStyle = "#004A23";
        ctx.textAlign = "center";
        ctx.fillText(`${days}`, 20 + 20 + 20, 100);
        ctx.fillText(`${hours}`, 20 + 135 + 20 + 20, 100);
        ctx.fillText(`${minutes}`, 20 + 135 + 20 + 135 + 20 + 20, 100);
        ctx.fillText(`${seconds}`, 20 + 135 + 20 + 135 + 20 + 135 + 20 + 20, 100);
    
        // Dibujar labels
        ctx.font = `${this.labelFontSize * 0.25}px Arial`;
        ctx.fillStyle = "#004A23";
        ctx.textAlign = "center"
        ctx.fillText("Días",  20 + 20 + 20, 150);
        ctx.fillText("Horas", 20 + 135 + 20 + 20, 150);
        ctx.fillText("Minutos", 20 + 135 + 20 + 135 + 20 + 20, 150);
        ctx.fillText("Segundos", 20 + 135 + 20 + 135 + 20 + 135 + 20 + 20, 150);
        
        this.encoder.addFrame(ctx);

        this.now = new Date(this.now.getTime() + 1000);

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