require('dotenv').config();
const mqtt = require('mqtt');

// Configurações do broker MQTT usando variáveis de ambiente
const options = {
    clientId: "mqtt-explorer-17a600d2",  // ID do cliente MQTT
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    host: process.env.MQTT_HOST,
    port: parseInt(process.env.MQTT_PORT, 10),
    url: `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`
};

const client = mqtt.connect(options);
const TOPIC = "datacenter/sensor";

// Conecta ao broker MQTT
client.on('connect', () => {
  console.log('Conectado ao broker MQTT');

  setInterval(() => {
    // Simula valores de umidade e vibração aleatórios
    const umidade = Math.floor(Math.random() * 1000); // Simulação de umidade (0-1000)
    const vibracao = Math.floor(Math.random() * 1000); // Simulação de vibração (0-1000)

    // Cria um objeto de dados para o MQTT
    const data = `${umidade},${vibracao}`;

    // Publica no tópico
    client.publish(TOPIC, data);
    console.log(`Dados publicados - Umidade: ${umidade}, Vibração: ${vibracao}`);
  }, 10000); // Publica a cada 10 segundos
});
