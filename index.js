const URL_HEROKU = 'https://weather-js-bot.herokuapp.com:443';
const TEMP_KELVIN = 273.15;
const WIND_DIRECTIONS = ['северный', 'северо-восточный', 'восточный', 'юго-восточный', 'южный', 'юго-западный', 'западный', 'северо-западный'];
const Rumb = {
  QUANTITY: 8,
  SIZE: 45,
  SHIFT: 0.5
};

const Bluebird = require('bluebird');
const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');

fetch.Promise = Bluebird;

const options = {
  webHook: {
    port: process.env.PORT
  }
};

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, options);
bot.setWebHook(`${URL_HEROKU}/bot${process.env.TELEGRAM_TOKEN}`);

let chatId = null;
const weatherUrl = `http://api.openweathermap.org/data/2.5/weather?appid=${process.env.WEATHER_KEY}&lang=ru&`;

bot.on('message', (msg) => {
  chatId = msg.chat.id;

  if (msg.text === '/start') {
    bot.sendMessage(chatId, greet());
  }

  if (!msg.hasOwnProperty('location') && msg.text !== '/start') {
    fetch(`${weatherUrl}q=${encodeURIComponent(msg.text)}`)
      .then(res => res.json())
      .then(json => sendAnswer(json));
  }

  if (msg.hasOwnProperty('location')) {
    fetch(`${weatherUrl}lat=${msg.location.latitude}&lon=${msg.location.longitude}`)
      .then(res => res.json())
      .then(json => sendAnswer(json));
  }
});

// Отправка ответа
const sendAnswer = (data) => {
  if (data.hasOwnProperty('name')) {
    bot.sendMessage(chatId, createAnswer(data));
  } else {
    bot.sendMessage(chatId, reportError());
  }
}

// Создание ответа
const createAnswer = (data) => {
  return '\u{1F4CD} ' + data.name
    + '\n\nСейчас на улице ' + data.weather[0].description
    + '\nТемпература ' + Math.round(data.main.temp - TEMP_KELVIN)
    + ', ощущается как ' + Math.round(data.main.feels_like - TEMP_KELVIN)
    + '\nВлажность ' + data.main.humidity + '%'
    + '\nВетер ' + defineWindDirection(data.wind.deg)
    + ', скорость ' + Math.round(data.wind.speed) + ' м/с'
}

// Определение направления ветра
const defineWindDirection = (angle) => {
  const rumb = Math.floor(angle / Rumb.SIZE + Rumb.SHIFT);
  const indexWind = rumb % Rumb.QUANTITY;

  return WIND_DIRECTIONS[indexWind];
}

// Приветствие
const greet = () => {
  return 'Привет! Пришли мне название города или свою геопозицию \u{1F609}';
}

// Сообщение об ошибке
const reportError = () => {
  return 'К сожалению я ничего не нашел \u{1F614} Попробуй отправить мне свою геопозицию.';
}
