# About the Project

This project has been forked from a very useful template by @JasonWebb (https://github.com/jasonwebb/dashboard-for-everybody, https://jasonwebb.github.io/dashboard-for-everybody/).

The primary purpose of this project was to create a sensor dashboard that displays current running real-time statistics of sensors attached to a system. Existing arduino code (Input_Device/Input_Device.ino) was modified to python3  (Input_Device/Input_Device.py) to support future developments using python3.
For our usecase, we had 4 specific sensors i.e. Temperature, Sound, gas, Vibration


## Features

- Realtime sensor data monitoring
- Add triggers to detect when sensor crosses threshold value
- Select specific sensor to monitor
- Generate local logs for sensor data
- Apply analysis algorithms e.g. K-Means clustering to analyze system behavior


## Project Setup
### Hardware
- **3d Printer** -> Test System 
- **Raspberry PI 4B** -> Master Controller for sensors and codebase
- **Sensors** -> Temperature, Sound, gas, Vibration

### Software
- **VS Code** -> Primary code editor
- **Python** -> Programming language for software-hardware interaction 
- **Node JS** -> Cross-platform, open-source JavaScript runtime environment to handle frontend web application
- **Javascript** -> Programming language frontend development

## Run Locally

#### These steps initiatizes the frontend web application Dashboard

Clone the project

```bash
  git clone https://github.com/meard/sensor_dashboard
```

Go to the project directory

```bash
  cd sensor_dashboard/dashboard
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  node ./node_modules/gulp/bin/gulp.js
```

## Running with sensor hardware

#### These steps initiatizes the python code to process sensor data and parse it to frontend web application Dashboard

Connect all sensor hardwares.

Go to project directory

```bash
  cd sensor_dashboard
```

Install dependencies

```bash
  pip install -r requirements.txt
```

Go to Input Device Folder and run python3 code file

```bash
  python3 Input_Device.py
```

### Running everything together
Go to project directory

```bash
  cd sensor_dashboard
```

Run Command

```bash
  cd dashboard && sleep 2 && node ./node_modules/gulp/bin/gulp.js && sleep 20 & cd ../Input_Device && sleep 2 && python3 Input_Device.py && sleep 20

```

## Acknowledgements

 - [Original Jason Webb Repository](https://github.com/jasonwebb/dashboard-for-everybody)

