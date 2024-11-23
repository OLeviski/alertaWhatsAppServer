
require('dotenv').config();
const mqtt = require('mqtt');
const twilio = require('twilio');

// Configuração do Twilio usando variáveis de ambiente
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

const fromWhatsAppNumber = process.env.TWILIO_FROM_WHATSAPP;
const toWhatsAppNumber = process.env.TWILIO_TO_WHATSAPP;

// Configuração do broker MQTT usando variáveis de ambiente
const options = {
    clientId: "oleviski",
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    host: process.env.MQTT_HOST,
    port: process.env.MQTT_PORT,
    url: `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`
};

const client = mqtt.connect(options);
const TOPIC = "datacenter/sensor";

// Limites para alertas usando variáveis de ambiente
const LIMITE_UMIDADE = parseFloat(process.env.LIMITE_UMIDADE);
const LIMITE_VIBRACAO = parseFloat(process.env.LIMITE_VIBRACAO);

// Função para enviar alerta via WhatsApp
function enviarAlerta(umidade, vibracao) {
    twilioClient.messages
        .create({
            body: `🚨 *Alerta de Deslizamento de Terra* 🚨 \n\n*Nível de umidade:* ${umidade} \n*Nível de vibração:* ${vibracao} \n\nRecomendação: Evacuar a área e buscar um local seguro.`,
            from: fromWhatsAppNumber,
            to: toWhatsAppNumber,
        })
        .then(message => console.log(`Mensagem enviada com sucesso: ${message.sid}`))
        .catch(error => console.error('Erro ao enviar mensagem WhatsApp:', error));
}

// Conecta ao broker e escuta o tópico
client.on('error', (err) => {
    console.error('Erro de conexão com o broker:', err);
});
client.on('connect', () => {
    console.log('Conectado ao broker MQTT');
    client.subscribe(TOPIC, (err) => {
        if (err) {
            console.error('Falha ao se inscrever no tópico:', err);
        } else {
            console.log(`Inscrito no tópico: ${TOPIC}`);
        }
    });
});

client.on('message', (topic, message) => {
    console.log('Mensagem recebida no tópico:', topic);
    const messageContent = message.toString();
    console.log('Conteúdo da mensagem:', messageContent);

    try {
        // Separando os dados de umidade e vibração com base na vírgula
        const dados = messageContent.split(',');

        // Verificando se a mensagem contém exatamente dois elementos
        if (dados.length !== 2) {
            console.error('Mensagem no formato incorreto. Dados esperados: [umidade, temperatura]');
            return;
        }

        // Convertendo os dados para números
        const umidade = parseFloat(dados[0]);
        const temperatura = parseFloat(dados[1]);
        
        // Validando se a conversão foi bem-sucedida
        if (isNaN(umidade) || isNaN(temperatura)) {
            console.error('Erro de conversão: Umidade ou temperatura não são números válidos.');
            return;
        }

        console.log(`Dados recebidos - Umidade: ${umidade}, Temperatura (usada como vibração): ${temperatura}`);

        // Considerando a temperatura como vibração
        const vibracao = temperatura;

        // Condição para enviar alerta
        if (umidade > LIMITE_UMIDADE || vibracao > LIMITE_VIBRACAO) {
            console.log('Alerta de risco! Enviando mensagem WhatsApp...');
            enviarAlerta(umidade, vibracao);
        }
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
    }
});
