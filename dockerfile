# Usa la imagen oficial de Node.js como base
FROM node:18

# Establece el directorio de trabajo
WORKDIR /app

# Copia el package.json
COPY package*.json ./

# Instala dependencias del proyecto
RUN npm install

# Copia el resto de los archivos del proyecto al directorio de trabajo
COPY . .

# Expone el puerto en el que la aplicación se ejecuta
EXPOSE 5000

# Define el comando para ejecutar la aplicación
CMD ["npm", "start"]