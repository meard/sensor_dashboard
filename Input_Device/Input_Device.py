#! /usr/bin/python3

# system import
import os
import sys
import time
import threading
import datetime
import string
import csv
import pandas as pd
import json
import time
import numpy as np

# user imports
import paho.mqtt.client as mqtt
import wifi
import RPi.GPIO as GPIO
import dht11

# # sensor value
# sensorData_Temperature = []
# sensorData_Gas = []
# sensorData_Tilt = []
# sensorData_Vibration = []

# # sensor value time
# sensorData_Temperature_time = []
# sensorData_Gas_time = []
# sensorData_Tilt_time = []
# sensorData_Vibration_time = []

class client_inputDevice:
    def __init__(self):
        print("[INFO] Setting up primary initilizations")

        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self.client_server = "test.mosquitto.org"

        
        # sensor value
        self.sensorData_Temperature = []
        self.sensorData_Gas = []
        self.sensorData_Tilt = []
        self.sensorData_Vibration = []

        # sensor value time
        self.sensorData_Temperature_time = []
        self.sensorData_Gas_time = []
        self.sensorData_Tilt_time = []
        self.sensorData_Vibration_time = []

        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)

        self.set_network(self.client, self.client_server)
        self.run(self.client)

    def set_network(self, client, client_server):
        print("[INFO]Setting up MQTT Server...")
        time.sleep(3)
        client.connect_async(client_server, 1883)
        time.sleep(5)

    def sensorStatus(self, sensor):
        # Send keep-alive message so dashboard knows we're still connected
        while True:
            if (sensor):
                # print("Sensor Status: {}".format(str(self.client.is_connected())))
                self.client.publish("iothackday/dfe/input-device", "true")
            else:
                # print("Sensor Status: {}".format(str(self.client.is_connected())))
                self.client.publish("iothackday/dfe/input-device", "false")

    def temperatureHumiditySensor(self):
        print("[INFO] Running Temperature Sensor Thread ")
        time.sleep(2)

        # read data using pin 17
        dht_channel = dht11.DHT11(pin=17)
        log_file = 'sensorData/'+str(time.strftime("%Y%m%d-%H%M%S")) + \
            '_sensor_Temperature_Humidity.csv'
        # f = open(log_file, "x", encoding='utf-8')
        try:
            while True:
                result = dht_channel.read()
                if result.is_valid():
                    self.client.publish(
                        'iothackday/dfe/input-device/temperatureHumidity', str(result.temperature))
                    self.sensorData_Temperature.append(str(result.temperature))
                    self.sensorData_Temperature_time.append(str(time.time()))
                    print("Current Temp: {}".format(str(result.temperature)))
                # Wait for a short period before reading again
                time.sleep(2)
        except (RuntimeError, KeyboardInterrupt, SystemExit) as err:
            # self.sensorData = pd.DataFrame(
            #     {'Time - Temperature': self.sensorData_Temperature_time, 'Temperature Value': self.sensorData_Temperature})
            # self.sensorData.to_csv(log_file, index=False)
            print(err.args[0])
        finally:
            # Clean up GPIO settings
            GPIO.cleanup()

    def gasSensor(self):
        print("[INFO] Running Gas Sensor Thread ")
        time.sleep(1)

        gas_channel = 7  # Replace with the actual GPIO pin number
        gas_state = 0
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(gas_channel, GPIO.IN)
        log_file = 'sensorData/'+str(time.strftime("%Y%m%d-%H%M%S")) + \
            '_sensor_Gas.csv'

        try:
            while True:
                # Read the state of the DO pin
                gas_present = GPIO.input(gas_channel)

                # Determine if gas is present or not
                if gas_present == GPIO.LOW:
                    gas_state = 1
                else:
                    gas_state = 0

                self.client.publish(
                    'iothackday/dfe/input-device/gas', str(gas_state))
                self.sensorData_Gas.append(str(gas_state))
                self.sensorData_Gas_time.append(str(time.time()))
                time.sleep(2)  # Wait for a short period before reading again
        except (RuntimeError, KeyboardInterrupt, SystemExit) as err:
            # self.sensorData = pd.DataFrame(
            #     {'Time - Gas': self.sensorData_Gas, 'Gas Value': self.sensorData_Gas_time})
            # self.sensorData.to_csv(log_file, index=False)
            print(err.args[0])
        finally:
            # Clean up GPIO settings
            GPIO.cleanup()

    def tiltSensor(self):
        print("[INFO] Running Tilt Sensor Thread ")
        time.sleep(1)

        tilt_channel = 21
        tilt_state = 0
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(tilt_channel, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        log_file = 'sensorData/'+str(time.strftime("%Y%m%d-%H%M%S")) + \
            '_sensor_Tilt.csv'
        try:
            GPIO.add_event_detect(tilt_channel, GPIO.FALLING,
                                  bouncetime=100)
            while True:
                if GPIO.event_detected(tilt_channel):
                    tilt_state = 1
                else:
                    tilt_state = 0
                self.client.publish(
                    'iothackday/dfe/input-device/tilt', str(tilt_state))
                self.sensorData_Tilt.append(str(tilt_state))
                self.sensorData_Tilt_time.append(str(time.time()))
                time.sleep(2)  # Wait for a short period before reading again
        except (RuntimeError, KeyboardInterrupt, SystemExit) as err:
            # self.sensorData = pd.DataFrame(
            #     {'Time - Tilt': self.sensorData_Tilt, 'Tilt Value': self.sensorData_Tilt_time})
            # self.sensorData.to_csv(log_file, index=False)
            print(err.args[0])

        finally:
            # Clean up GPIO settings
            GPIO.cleanup()

    def vibrationSensor(self):
        print("[INFO] Running Vibration Sensor Thread ")
        time.sleep(1)

        vibration_channel = 22
        vibration_state = 0
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(vibration_channel, GPIO.IN)
        log_file = 'sensorData/'+str(time.strftime("%Y%m%d-%H%M%S")) + \
            '_sensor_Vibration.csv'
        try:
            # let us know when the pin goes HIGH or LOW
            GPIO.add_event_detect(vibration_channel, GPIO.BOTH, bouncetime=300)
            while True:
                if GPIO.event_detected(vibration_channel):
                    vibration_state = 1
                else:
                    vibration_state = 0
                self.client.publish(
                    'iothackday/dfe/input-device/vibration', str(vibration_state))
                self.sensorData_Vibration.append(str(vibration_state))
                self.sensorData_Vibration_time.append(str(time.time()))
                time.sleep(2)  # Wait for a short period before reading again
        except (RuntimeError, KeyboardInterrupt, SystemExit) as err:
            # self.sensorData = pd.DataFrame(
            #     {'Time - Vibration': self.sensorData_Vibration, 'Vibration Value': self.sensorData_Vibration_time})
            # self.sensorData.to_csv(log_file, index=False)
            print(err.args[0])
        finally:
            # Clean up GPIO settings
            GPIO.cleanup()

    def generate_log_within_class(self):
        print("[INFO] Generating Log File in CSV format....")
        #log_file = 'sensorData/'+str(time.strftime("%Y%m%d-%H%M%S")) + \
        #    '_sensorData.csv'
        sensorData = pd.DataFrame(
            {
                'Time - Temperature':   self.sensorData_Temperature_time,
                'Temperature Value':    self.sensorData_Temperature,
                'Time - Gas':           self.sensorData_Gas,
                'Gas Value':            self.sensorData_Gas_time,
                'Time - Tilt':          self.sensorData_Tilt,
                'Tilt Value':           self.sensorData_Tilt_time,
                'Time - Vibration':     self.sensorData_Vibration,
                'Vibration Value':      self.sensorData_Vibration_time,
                })
        print("[INFO] sensor Data: ", sensorData)
        #print(sensorData)
                #sensorData.to_csv(log_file, index=False)
    
    def generate_log_global(self):
        pass
    
    def run(self, client):
        print("[INFO] Initializing primary sensor threads ")
        time.sleep(3)
        while True:
            try:
                # Reconnect to MQTT broker if dropped
                client.loop_start()
                time.sleep(2)

                t1 = threading.Thread(
                    target=self.temperatureHumiditySensor, name="temperatureHumiditySensor")
                t2 = threading.Thread(target=self.gasSensor, name="gas")
                t3 = threading.Thread(target=self.tiltSensor, name="tilt")
                t4 = threading.Thread(
                    target=self.vibrationSensor, name="vibration")

                t5 = threading.Thread(
                    target=self.sensorStatus, name="Sensor Status", args=(self.client.is_connected(),))

                t1.daemon = True
                t2.daemon = True
                t3.daemon = True
                t4.daemon = True
                t5.daemon = True

                t1.start()
                t2.start()
                t3.start()
                t4.start()
                t5.start()

                t1.join()
                t2.join()
                t3.join()
                t4.join()
                t5.join()

            except (KeyboardInterrupt):
                
                print("[INFO]Dashboard stopped by User")

            finally:
                self.generate_log_within_class()
                # Stop MQTT server Clean up GPIO settings
                self.client.disconnect()
                print("[INFO] Intializing Clean exit and GPIO cleanup")
                time.sleep(1)
                GPIO.cleanup()
                print("[INFO] Cleanup Done. Exiting Now")
                for i in range(10):
                    self.client.publish("iothackday/dfe/input-device", "false")

                sys.exit()


if __name__ == "__main__":
    print("[INFO] Initializing Sensor Data")
    client_input_obj = client_inputDevice()
