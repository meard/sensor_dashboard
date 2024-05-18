// Packages
let mqtt = require("mqtt");
let Chart = require("chart.js");

// MQTT setup
let client = mqtt.connect("wss://test.mosquitto.org:8081");

// Pause control for data collection
let isPaused = false;

// Data display interval (allow users to "slow down" data stream)
let displayInterval = 100;
let lastDisplayUpdate = Date.now();

// MQTT topics
const inputDeviceStatusTopic = "iothackday/dfe/input-device";
const outputDeviceStatusTopic = "iothackday/dfe/output-device";
const inputDeviceTemperatureHumiditySensorTopic = "iothackday/dfe/input-device/temperatureHumidity";
const inputDeviceGasSensorTopic = "iothackday/dfe/input-device/gas";
const inputDeviceTiltSensorTopic = "iothackday/dfe/input-device/tilt";
const inputDeviceVibrationSensorTopic = "iothackday/dfe/input-device/vibration";

// Device status flags
let inputDeviceOnline = false;
let outputDeviceOnline = false;

// First-time device status flags, just for demo
let inputDeviceFirstPing = false;
let outputDeviceFirstPing = false;

// Last
let inputLastPing = Date.now();
let outputLastPing = Date.now();
let keepAliveThreshold = 1000;

// Important DOM elements
let inputSensorSelectedEl = document.getElementById("selected-sensor");
let pauseButtonEl = document.querySelector("#flow-controls .flow-control-button");
let displayIntervalEl = document.getElementById("interval-selector");
let inputDeviceStatusEl = document.getElementById("input-device-status");
let outputDeviceStatusEl = document.getElementById("output-device-status");

// Current sensor
let currentSensor = inputSensorSelectedEl.value || "temperature";
let default_currentSensor = "temperature";

// Sensor data
let totalReadings = {
  temperatureHumidity: 0,
  gas: 0,
  tilt: 0,
  vibration: 0,
};

// Triggers
let triggers = {
  temperatureHumidity: [],
  gas: [],
  tilt: [],
  vibration: [],
};

// Live chart elements and configs
const maxReadings = 10;
let liveChart;
const chartCanvasEl = document.getElementById("live-chart");

// Base data object for live chart
let dataObject = {
  labels: [],
  datasets: [
    {
      label: "Sensor values",
      data: [],
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      borderColor: "rgba(255, 99, 132, 1)",
      borderWidth: 1,
      pointRadius: 0,
    },
  ],
};

// Sensor-specific objects that hold sensor readings even when different sensors are active
let temperatureHumidityData = {
  labels: [],
  data: [],
};

let gasData = {
  labels: [],
  data: [],
};

let tiltData = {
  labels: [],
  data: [],
};

let vibrationData = {
  labels: [],
  data: [],
};

let currentSensorData = temperatureHumidityData;

// Live chart configuration - optionsObject
let optionsObject = {
  events: [], // disables tooltips on data points
  xAxisID: "Values",
  yAxisID: "Timestamp",
  legend: {
    display: false,
  },
  animation: false,
  scales: {
    xAxes: [
      {
        ticks: {
          display: false,
        },
      },
    ],
    yAxes: [
      {
        ticks: {
          beginAtZero: true,
        },
      },
    ],
  },
};

// Mock data generation
let mockDataEnabled = false;
let mockDataInterval;
let mockDataTarget = getRandomInt(0, 4096);
let mockDataVelocity = 300;
let mockDataCurrent = getRandomInt(0, 4096);

mockDataInterval = setInterval(setMockDataTarget, getRandomInt(1000, 5000));

function setMockDataTarget() {
  mockDataTarget = getRandomInt(0, 4096);
  clearInterval(mockDataInterval);
  mockDataInterval = setInterval(setMockDataTarget, getRandomInt(1000, 5000));
}

//================================================
//  Main program setup
//================================================
window.addEventListener("DOMContentLoaded", function (e) {
  // Initialize live chart
  liveChart = new Chart(chartCanvasEl, {
    type: "line",
    data: dataObject,
    options: optionsObject,
  });

  // Switch data streams when sensor selection is changed
  inputSensorSelectedEl.addEventListener("change", function (e) {
    currentSensor = e.target.value || "temperature";
    switch (currentSensor) {
      case "temperature":
        currentSensorData = temperatureHumidityData;
        resetDataTable();
        setYAxisScale(0, 100); // Example scale for temperature
        break;

      case "gas":
        currentSensorData = gasData;
        resetDataTable();
        setYAxisScale(0, 4096); // Example scale for gas sensor
        break;

      case "tilt":
        currentSensorData = tiltData;
        resetDataTable();
        setYAxisScale(0, 360); // Example scale for tilt sensor
        break;

      case "vibration":
        currentSensorData = vibrationData;
        resetDataTable();
        setYAxisScale(0, 50); // Example scale for vibration sensor
        break;

      default:
        currentSensorData = temperatureHumidityData;
        resetDataTable();
        setYAxisScale(0, 100); // Default scale
        break;
    }

    displayTriggers();
    displayTriggerCount();
  });

  // Toggle pause state of data display when pause/resume button is activated
  pauseButtonEl.addEventListener("click", function (e) {
    isPaused = !isPaused;

    let pauseContents = pauseButtonEl.querySelector(".pause-contents");
    let resumeContents = pauseButtonEl.querySelector(".resume-contents");

    if (!isPaused) {
      pauseContents.classList.remove("is-hidden");
      resumeContents.classList.add("is-hidden");
    } else {
      pauseContents.classList.add("is-hidden");
      resumeContents.classList.remove("is-hidden");
    }
  });

  // Update global display interval value when select element is changed
  displayIntervalEl.addEventListener("change", function (e) {
    displayInterval = parseInt(e.target.value);
  });

  // Toggle mock data using 'Space'
  document.body.addEventListener("keydown", function (e) {
    if (e.key === " ") {
      e.preventDefault();
      isPaused = !isPaused;
    }
  });

  // Render any pre-defined triggers, or just placeholders if there are none
  displayTriggers();
});

//=======================================
//  Set up and manage MQTT connection
//=======================================
if (!mockDataEnabled) {
  client.on("connect", () => {
    console.log("Connected to MQTT server ...");

    // Listen for device status messages
    client.subscribe(inputDeviceStatusTopic);
    client.subscribe(outputDeviceStatusTopic);

    // Listen for sensor data
    client.subscribe(inputDeviceTemperatureHumiditySensorTopic);
    client.subscribe(inputDeviceGasSensorTopic);
    client.subscribe(inputDeviceTiltSensorTopic);
    client.subscribe(inputDeviceVibrationSensorTopic);

    // Process messages when they arrive through any of the subscribed topics
    client.on("message", (topic, message) => {
      processMessages(topic, message.toString());
    });
  });
}

//==========================================================
//  Process data messages coming from live input device
//  or mock data loops
//==========================================================
// Act on messages from devices or mock data events
function processMessages(topic, message) {
  switch (topic) {
    // Input device has sent keep-alive message
    case inputDeviceStatusTopic:
      let sensor_status = message;
      if (sensor_status === "true") {
        inputDeviceOnline = true;
        displayDeviceStatus();
      } else if (sensor_status === "false") {
        inputDeviceOnline = false;
        displayDeviceStatus();
      }
      break;

    // Sensor device has sent sensor data
    case inputDeviceTemperatureHumiditySensorTopic:
    case inputDeviceGasSensorTopic:
    case inputDeviceTiltSensorTopic:
    case inputDeviceVibrationSensorTopic:
      generateGraphComponent(message);
      break;
  }
}

// Generate sensor graph for individual sensors
async function generateGraphComponent(message) {
  let nextValue = parseFloat(message);

  // Push next value to appropriate sensor data object
  currentSensorData.labels.push(Date.now());
  currentSensorData.data.push(nextValue);

  // Remove first data point when we have too many
  if (currentSensorData.labels.length >= maxReadings) {
    currentSensorData.labels.shift();
    currentSensorData.data.shift();
  }

  // Inject current sensor data into chart data object
  dataObject.labels = currentSensorData.labels;
  dataObject.datasets[0].data = currentSensorData.data;

  // Only refresh the UI at the interval requested by the user
  if (Date.now() > lastDisplayUpdate + displayInterval && !isPaused) {
    liveChart.update();

    // Create new row in visually-hidden data table
    let row = document.createElement("tr");
    row.innerHTML = `
        <td>${nextValue}</td>
        <td>${new Date()}</td>
      `;

    let tbody = document.querySelector("#sensor-data tbody");
    let firstRow = document.querySelector("#sensor-data tbody tr:first-child");
    tbody.insertBefore(row, firstRow);

    lastDisplayUpdate = Date.now();
  }
}

// Display device status
function displayDeviceStatus() {
  if (inputDeviceOnline) {
    inputDeviceStatusEl.classList.add("device-status-online");
    inputDeviceStatusEl.classList.remove("device-status-offline");
    inputDeviceStatusEl.innerHTML = `
        <div class="device-online">
          <span class="device-online-icon"></span> Online
        </div>
      `;
  } else {
    inputDeviceStatusEl.classList.add("device-status-offline");
    inputDeviceStatusEl.classList.remove("device-status-online");
    inputDeviceStatusEl.innerHTML = `
        <div class="device-offline">
          <span class="device-offline-icon"></span> Offline
        </div>
      `;
  }

  if (outputDeviceOnline) {
    outputDeviceStatusEl.classList.add("device-status-online");
    outputDeviceStatusEl.classList.remove("device-status-offline");
    outputDeviceStatusEl.innerHTML = `
        <div class="device-online">
          <span class="device-online-icon"></span> Online
        </div>
      `;
  } else {
    outputDeviceStatusEl.classList.add("device-status-offline");
    outputDeviceStatusEl.classList.remove("device-status-online");
    outputDeviceStatusEl.innerHTML = `
        <div class="device-offline">
          <span class="device-offline-icon"></span> Offline
        </div>
      `;
  }
}

// Reset the data table with current sensor data
function resetDataTable() {
  let tbody = document.querySelector("#sensor-data tbody");
  tbody.innerHTML = "";

  for (let i = 0; i < currentSensorData.data.length; i++) {
    let row = document.createElement("tr");
    row.innerHTML = `
      <td>${currentSensorData.data[i]}</td>
      <td>${new Date(currentSensorData.labels[i])}</td>
    `;
    tbody.appendChild(row);
  }
}

// Set y-axis scale based on sensor type
function setYAxisScale(min, max) {
  liveChart.options.scales.yAxes[0].ticks.min = min;
  liveChart.options.scales.yAxes[0].ticks.max = max;
  liveChart.update();
}

//======================================
//  Utility functions
//======================================
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Mock data generation loop
if (mockDataEnabled) {
  setInterval(function () {
    mockDataCurrent += (mockDataTarget - mockDataCurrent) / mockDataVelocity;
    let mockMessage = mockDataCurrent.toFixed(2).toString();
    generateGraphComponent(mockMessage);
  }, displayInterval);
}
