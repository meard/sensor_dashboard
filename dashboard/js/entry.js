// Packages
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
const inputDeviceStatusTopic = "iothackday/dfe/input-device";
const outputDeviceStatusTopic = "iothackday/dfe/output-device";

const inputDeviceTemperatureHumiditySensorTopic =
  "iothackday/dfe/input-device/temperatureHumidity";
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
let pauseButtonEl = document.querySelector(
  "#flow-controls .flow-control-button"
);
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

// Set y-axis scale based on sensor type
function setYAxisScale(min, max) {
  liveChart.options.scales.yAxes[0].ticks.min = min;
  liveChart.options.scales.yAxes[0].ticks.max = max;
  liveChart.update();
}

// Mock data generation
let mockDataEnabled = false;

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

  // Periodically check input/output devices for keep-alive messages
  // setInterval(checkDevices, 3000);

  // Add a new trigger when "Add Trigger" button is clicked
  let addTriggerButton = document.querySelector(
    '#add-trigger-panel button[type="submit"]'
  );
  addTriggerButton.addEventListener("click", addNewTrigger);

  // Switch data streams when sensor selection is changed
  inputSensorSelectedEl.addEventListener("change", function (e) {
    currentSensor = e.target.value || "temperature";
    switch (currentSensor) {
      case "temperature":
        currentSensorData = temperatureHumidityData;
        resetDataTable();
        setYAxisScale(0, 50);
        break;

      case "gas":
        currentSensorData = gasData;
        resetDataTable();
        setYAxisScale(0, 5);
        break;

      case "tilt":
        currentSensorData = tiltData;
        resetDataTable();
        setYAxisScale(0, 5);
        break;

      case "vibration":
        currentSensorData = vibrationData;
        resetDataTable();
        setYAxisScale(0, 5);
        break;

      default:
        currentSensorData = temperatureHumidityData;
        resetDataTable();
        setYAxisScale(0, 50);
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
    let firstRow = tbody.querySelector("tr:first-child");
    // Insert new row into the data table
    if (firstRow == undefined) {
      tbody.append(row);
    } else {
      tbody.insertBefore(row, firstRow);
    }

    // Remove oldest sensor reading when maximum threshold reached
    if (tbody.children.length >= maxReadings) {
      tbody.children[tbody.children.length - 1].remove();
    }

    // Display this new sensor value on the "last reading" highlight block
    displaySensorReading();

    // Update last display refresh timestamp
    lastDisplayUpdate = Date.now();
  }

  // Add to total reading count for this sensor
  switch (currentSensor) {
    case "temperature":
      totalReadings.temperatureHumidity++;
      break;

    case "gas":
      totalReadings.gas++;
      break;

    case "tilt":
      totalReadings.tilt++;
      break;

    case "vibration":
      totalReadings.vibration++;
      break;
  }

  displayTotalReadings();
}

//================================================================
//  Remove all rows from hidden data table for chart, and add
//  all previous sensor readings for the current sensor.
//  Called when user selects a new sensor from dropdown.
//================================================================
function resetDataTable() {
  let tbody = document.querySelector("#sensor-data tbody");
  let oldRows = tbody.querySelectorAll("tr");

  // Remove all the old readings from previous sensor
  oldRows.forEach((row) => {
    row.remove();
  });

  // Add all the previous sensor readings from the current sensor
  for (let i = currentSensorData.data.length - 1; i >= 0; i--) {
    let row = document.createElement("tr");
    row.innerHTML = `
      <td>${currentSensorData.data[i]}</td>
      <td>${new Date(currentSensorData.labels[i])}</td>
    `;
    tbody.appendChild(row);
  }
}

//======================================================
//  Display live data in the "highlight" blocks next
//  to the live chart
//======================================================
// Display the number of triggers set up for this sensor
function displayTriggerCount() {
  let currentTriggers;

  switch (currentSensor) {
    case "temperature":
      currentTriggers = triggers.temperatureHumidity;
      break;

    case "gas":
      currentTriggers = triggers.gas;
      break;

    case "tilt":
      currentTriggers = triggers.tilt;
      break;

    case "vibration":
      currentTriggers = triggers.vibration;
      break;

    default:
      currentTriggers = triggers.temperatureHumidity;
  }

  let triggerCountEl = document.querySelector("#triggers-set-up .value");
  triggerCountEl.innerHTML = currentTriggers.length;
}

// Display the total number of readings taken for this sensor so far
function displayTotalReadings() {
  let readingsSoFarEl = document.querySelector("#readings-so-far .value");

  switch (currentSensor) {
    case "temperature":
      readingsSoFarEl.innerHTML = totalReadings.temperatureHumidity;
      break;

    case "gas":
      readingsSoFarEl.innerHTML = totalReadings.gas;
      break;

    case "tilt":
      readingsSoFarEl.innerHTML = totalReadings.tilt;
      break;

    case "vibration":
      readingsSoFarEl.innerHTML = totalReadings.vibration;
      break;

    default:
      readingsSoFarEl.innerHTML = totalReadings.temperatureHumidity;
  }
}

// Display the most recent sensor reading
function displaySensorReading() {
  let sensorReadingEl = document.querySelector("#last-reading .value");
  sensorReadingEl.innerHTML =
    currentSensorData.data[currentSensorData.data.length - 1];
}

//===============
//  Triggers
//===============
// Creates a new trigger for the current sensor when the "Add Trigger" button is clicked
function addNewTrigger(e) {
  e.preventDefault();

  let currentTriggers;

  switch (currentSensor) {
    case "temperature":
      currentTriggers = triggers.temperatureHumidity;
      break;

    case "gas":
      currentTriggers = triggers.gas;
      break;

    case "tilt":
      currentTriggers = triggers.tilt;
      break;

    case "vibration":
      currentTriggers = triggers.vibration;
      break;

    default:
      currentTriggers = triggers.temperatureHumidity;
  }

  if (currentTriggers.length < 3) {
    let aboveOrBelowEl = document.querySelector(
      '#add-trigger-panel input[name="above-below"]:checked'
    );
    let thresholdEl = document.querySelector(
      '#add-trigger-panel input[name="threshold-value"]'
    );
    let PrinterActionEl = document.querySelector(
      '#add-trigger-panel input[name="printer-action"]:checked'
    );

    // For demo purposes, forget about form validation and just make sure the values aren't null
    let aboveOrBelow =
      aboveOrBelowEl != undefined ? aboveOrBelowEl.value : "above";
    let threshold = thresholdEl.value != "" ? parseInt(thresholdEl.value) : 500;
    let motorAction =
      motorActionEl != undefined ? motorActionEl.value : "pulse-once";

    // Create a new trigger for this sensor from the form data
    let newTriggerEl = document.createElement("div");
    newTriggerEl.classList = "panel trigger is-blue";
    newTriggerEl.setAttribute("role", "group");

    newTriggerEl.innerHTML = `
      <h2>
        ${
          currentSensor.charAt(0).toUpperCase() + currentSensor.slice(1)
        } Trigger #${currentTriggers.length + 1}
      </h2>

      <button class="remove-icon-button remove-button">
        <span class="icon fas fa-times" aria-hidden="true"></span>
        <span class="visually-hidden">Remove trigger</span>
      </button>

      <div class="name">
        <span class="visually-hidden">The </span>
          3d Printer
      </div>

      <div class="action">
        Will
        <span class="is-highlighted">${motorAction.replace(/-/g, " ")}</span>
        when the
        <span class="is-highlighted">${currentSensor}</span>
        sensor goes
        <span class="is-highlighted">${aboveOrBelow}</span>
        <span class="is-highlighted">${threshold}</span>
      </div>

      <button class="remove-button button is-danger">Remove this trigger</button>
    `;

    currentTriggers.push(newTriggerEl);

    // Announce addition of new trigger to screen reader users
    announce("Added " + currentSensor + " trigger #" + currentTriggers.length);

    // Update UI
    displayTriggers();
    displayTriggerCount();
  }
}

function removeTrigger(trigger) {
  let currentTriggers;

  switch (currentSensor) {
    case "temperature":
      currentTriggers = triggers.temperatureHumidity;
      break;

    case "gas":
      currentTriggers = triggers.gas;
      break;

    case "tilt":
      currentTriggers = triggers.tilt;
      break;

    case "vibration":
      currentTriggers = triggers.vibration;
      break;
  }

  // Announce removal of this trigger to scree reader users, before the trigger is gone
  announce(
    "Removed " +
      currentSensor +
      " trigger #" +
      (currentTriggers.indexOf(trigger) + 1)
  );

  // Remove this trigger from the array of triggers
  currentTriggers = currentTriggers.splice(currentTriggers.indexOf(trigger), 1);

  // TODO: Re-order the numbers

  // Update UI
  displayTriggers();
  displayTriggerCount();
}

// Display all triggers that have been set
function displayTriggers() {
  let currentTriggers;

  switch (currentSensor) {
    case "temperature":
      currentTriggers = triggers.temperatureHumidity;
      break;

    case "gas":
      currentTriggers = triggers.gas;
      break;

    case "tilt":
      currentTriggers = triggers.tilt;
      break;

    case "vibration":
      currentTriggers = triggers.vibration;
      break;

    default:
      currentTriggers = triggers.temperatureHumidity;
  }

  let columns = document.querySelectorAll("#current-triggers .column");

  // Display all the current triggers for this sensor
  currentTriggers.forEach(function (trigger, index) {
    columns[index].innerHTML = "";
    columns[index].appendChild(trigger);

    let removeButtons = trigger.querySelectorAll(".remove-button");
    removeButtons.forEach((removeButton) => {
      if (removeButton.getAttribute("data-has-click-handler")) {
        removeButton.removeEventListener("click", removeButtonClickHandler);
        removeButton.removeAttribute("data-has-click-handler");
      }

      removeButton.addEventListener("click", removeButtonClickHandler);
      removeButton.setAttribute("data-has-click-handler", true);
    });
  });

  // Add placeholders for remaining panels if there aren't enough triggers
  if (currentTriggers.length < 3) {
    for (let i = 0; i < 3 - currentTriggers.length; i++) {
      columns[currentTriggers.length + i].innerHTML = `
        <div class="panel-placeholder">
          No trigger defined
        </div>
      `;
    }
  }
}

// Click handler function for remove buttons on each trigger card
function removeButtonClickHandler(e) {
  removeTrigger(e.target.closest(".trigger"));
}

//==========================================
//  Device status checking and display
//==========================================
// Automatically set device statuses to "offline" if no keep alive
// has been received in a while. Called periodically by an interval.
function checkDevices() {
  let currentTime = Date.now();

  // Check if input device has gone offline
  if (currentTime - inputLastPing > keepAliveThreshold) {
    inputDeviceOnline = false;
  }

  // Check if output device has gone offline
  if (currentTime - outputLastPing > keepAliveThreshold) {
    outputDeviceOnline = false;
  }
}

// Display the current status of each device at the top of the page
function displayDeviceStatus() {
  // console.log("Input Device Status: "+inputDeviceOnline);
  // Display input device status
  let connectedEl = inputDeviceStatusEl.querySelector(".connected");
  let notConnectedEl = inputDeviceStatusEl.querySelector(".not-connected");

  if (inputDeviceOnline) {
    connectedEl.classList.add("is-visible");
    notConnectedEl.classList.remove("is-visible");
  } else {
    connectedEl.classList.remove("is-visible");
    notConnectedEl.classList.add("is-visible");
  }

  // Display output device status
  connectedEl = outputDeviceStatusEl.querySelector(".connected");
  notConnectedEl = outputDeviceStatusEl.querySelector(".not-connected");

  if (outputDeviceOnline) {
    connectedEl.classList.add("is-visible");
    notConnectedEl.classList.remove("is-visible");
  } else {
    connectedEl.classList.remove("is-visible");
    notConnectedEl.classList.add("is-visible");
  }
}

//==================
//  Utilities
//==================
// Generate a random integer within a range
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

// Insert a message into the assertive live region used for making announcements to screen readers
function announce(message) {
  let announcementEl = document.getElementById("screen-reader-announcements");
  announcementEl.innerText = message;
}
