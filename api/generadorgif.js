const { createCanvas } = require("canvas");
const GIFEncoder = require("gifencoder");

// Función para generar un fotograma del GIF con el texto del contador regresivo
function generarFotograma(canvas, context, tiempoRestante) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    const expirationDate = new Date(tiempoRestante);

    // Calcula el tiempo restante en milisegundos
    const now = new Date();
    const timeLeft = expirationDate.getTime() - now.getTime();
  
    // Calcula los días, horas, minutos y segundos restantes
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);

    context.fillStyle = "#f4f4f4"
    context.fillRect(0, 0, canvas.width, canvas.height)

    
    const numLabels = 4
    const widthPercent = 0.9
    const padding = (canvas.width * (1 - widthPercent)) / 2
    const anchoEspacio = (canvas.width - (padding * 2)) / (numLabels + 1);

    // Dibujar el texto en el lienzo
    context.font = "bold 60px Arial";
    context.fillStyle = "#004A23";
    context.textAlign = "center";
    context.fillText(`${days}`, 20 + 20 + 20, 100);
    context.fillText(`${hours}`, 20 + 135 + 20 + 20, 100);
    context.fillText(`${minutes}`, 20 + 135 + 20 + 135 + 20 + 20, 100);
    context.fillText(`${seconds}`, 20 + 135 + 20 + 135 + 20 + 135 + 20 + 20, 100);

    // Dibujar labels
    context.font = "16px Arial";
    context.fillStyle = "#004A23";
    context.textAlign = "center"
    context.fillText("Días",  20 + 20 + 20, 150);
    context.fillText("Horas", 20 + 135 + 20 + 20, 150);
    context.fillText("Minutos", 20 + 135 + 20 + 135 + 20 + 20, 150);
    context.fillText("Segundos", 20 + 135 + 20 + 135 + 20 + 135 + 20 + 20, 150);

    return context.getImageData(0, 0, canvas.width, canvas.height).data;
}

// Función para generar el GIF animado con el contador regresivo
async function generarGIF(tiempoRestante) {
    const canvas = createCanvas(600, 200);
    const context = canvas.getContext("2d");
    const encoder = new GIFEncoder(600, 200);

    // Configurar el encoder
    encoder.start();
    encoder.setRepeat(0); // Repetir indefinidamente
    encoder.setDelay(1000); // 1 segundo por fotograma

    // Generar cada fotograma del GIF
    for (let i = 0; i < 120; i++) { // Generar 10 fotogramas (10 segundos)
        const fotogramaData = generarFotograma(canvas, context, tiempoRestante);
        encoder.addFrame(context);
        tiempoRestante.seconds--; // Actualizar el tiempo restante para el siguiente fotograma

        if (tiempoRestante.seconds < 0) {
            tiempoRestante.seconds = 59;
            tiempoRestante.minutes--;
            if (tiempoRestante.minutes < 0) {
                tiempoRestante.minutes = 59;
                tiempoRestante.hours--;
                if (tiempoRestante.hours < 0) {
                    tiempoRestante.hours = 23;
                    tiempoRestante.days--;
                }
            }
        }
        
        // Esperar 1 segundo antes de generar el siguiente fotograma
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Finalizar el encoder y devolver el GIF como un buffer
    encoder.finish();
    return encoder.out.getData();
}

module.exports = { generarGIF };
