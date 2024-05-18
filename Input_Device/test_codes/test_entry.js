let mqtt = require("mqtt");
let chart = require("chart.js");

// MQTT setup
let client = mqtt.connect("wss://test.mosquitto.org:8081");

// Pause control for data collection
let isPaused = false;

// Data display interval (allow users to "slow down" data stream)
let displayInterval = 100;
let lastDisplayUpdate = Date.now();

// MQTT topics
const inputDeviceTemperatureHumiditySensorTopic = "iothackday/dfe/input-device/temperatureHumidity";
const inputDeviceGasSensorTopic = "iothackday/dfe/input-device/gas";
const inputDeviceTiltSensorTopic = "iothackday/dfe/input-device/tilt";
const inputDeviceVibrationSensorTopic = "iothackday/dfe/input-device/vibration";

// Important DOM elements
let inputSensorSelectedEl = document.getElementById("selected-sensor");
let pauseButtonEl = document.querySelector("#flow-controls .flow-control-button");
let displayIntervalEl = document.getElementById("interval-selector");
const chartCanvasEl = document.getElementById("live-chart");

// Sensor data objects
let temperatureHumidityData = { labels: [], data: [] };
let gasData = { labels: [], data: [] };
let tiltData = { labels: [], data: [] };
let vibrationData = { labels: [], data: [] };

let currentSensorData = temperatureHumidityData;

// Live chart configuration
let dataObject = {
  labels: [],
  datasets: [{
    label: "Sensor values",
    data: [],
    backgroundColor: "rgba(255, 99, 132, 0.2)",
    borderColor: "rgba(255, 99, 132, 1)",
    borderWidth: 1,
    pointRadius: 0,
  }],
};

let optionsObject = {
  events: [],
  scales: {
    xAxes: [{ ticks: { display: false } }],
    yAxes: [{ ticks: { beginAtZero: true, max: 50 } }],
  },
};

// Initialize live chart
let liveChart = new Chart(chartCanvasEl, {
  type: "line",
  data: dataObject,
  options: optionsObject,
});

// Handle sensor selection changes
inputSensorSelectedEl.addEventListener("change", function (e) {
  switch (e.target.value) {
    case "temperatureHumidity":
      currentSensorData = temperatureHumidityData;
      break;
    case "gas":
      currentSensorData = gasData;
      break;
    case "tilt":
      currentSensorData = tiltData;
      break;
    case "vibration":
      currentSensorData = vibrationData;
      break;
    default:
      currentSensorData = temperatureHumidityData;
      break;
  }
  resetDataTable();
});

// Toggle pause state of data display
pauseButtonEl.addEventListener("click", function () {
  isPaused = !isPaused;
  pauseButtonEl.querySelector(".pause-contents").classList.toggle("is-hidden");
  pauseButtonEl.querySelector(".resume-contents").classList.toggle("is-hidden");
});

// Update global display interval value
displayIntervalEl.addEventListener("change", function (e) {
  displayInterval = parseInt(e.target.value);
});

// MQTT connection
client.on("connect", () => {
  console.log("Connected to MQTT server ...");
  client.subscribe([
    inputDeviceTemperatureHumiditySensorTopic,
    inputDeviceGasSensorTopic,
    inputDeviceTiltSensorTopic,
    inputDeviceVibrationSensorTopic,
  ]);

  client.on("message", (topic, message) => {
    processMessages(topic, message);
  });
});

// Process MQTT messages
function processMessages(topic, message) {
  let value = parseFloat(message.toString());
  switch (topic) {
    case inputDeviceTemperatureHumiditySensorTopic:
      updateSensorData(temperatureHumidityData, value);
      break;
    case inputDeviceGasSensorTopic:
      updateSensorData(gasData, value);
      break;
    case inputDeviceTiltSensorTopic:
      updateSensorData(tiltData, value);
      break;
    case inputDeviceVibrationSensorTopic:
      updateSensorData(vibrationData, value);
      break;
  }
}

// Update sensor data and refresh chart
function updateSensorData(sensorData, value) {
  if (Date.now() > lastDisplayUpdate + displayInterval && !isPaused) {
    sensorData.labels.push(Date.now());
    sensorData.data.push(value);

    if (sensorData.labels.length > 10) {
      sensorData.labels.shift();
      sensorData.data.shift();
    }

    dataObject.labels = sensorData.labels;
    dataObject.datasets[0].data = sensorData.data;

    liveChart.update();

    lastDisplayUpdate = Date.now();
  }
}

// Reset data table
function resetDataTable() {
  // Logic to reset the data table with current sensor data
}
