#! /usr/bin/python3

# system import
import os
import sys
import time
import threading
import datetime
import string
import csv

# user imports
import paho.mqtt.client as mqtt
import wifi
import RPi.GPIO as GPIO
import dht11


class client_inputDevice:
    def __init__(self):
        print("[INFO] Setting up primary initilizations")

        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
        self.client_server = "test.mosquitto.org"
        # self.ssid = ""
        # self.password = ""
        # self.isConnected = False

        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)

        # self.set_network(self.client, self.client_server,
        #                  self.ssid, self.password)

        self.set_network(self.client, self.client_server)
        self.run(self.client)

    def set_network(self, client, client_server):
        def on_connect(client, userdata, flags, rc):
            if rc == 0:
                print("Connected to MQTT Broker!")
            else:
                print("Failed to connect, return code %d\n", rc)
                exit(0)

        print("[INFO]Setting up MQTT Server...")
        time.sleep(3)
        client.on_connect = on_connect
        client.connect_async(client_server, 1883)

        time.sleep(5)
        # print("[INFO]Setting up Local Network...")
        # wifi_scanner = wifi.Cell.all('wlan0')

        # for cell in wifi_scanner:
        #     if cell.ssid == ssid:
        #         scheme = wifi.Scheme.for_cell('wlan0', ssid, cell, password)
        #         scheme.save()
        #         scheme.activate()
        #         self.isConnected = True
        #         break

        # if self.isConnected:
        #     print(f"Connected to network: {ssid}")
        #     return

        # else:
        #     print(f"Unable to find network: {ssid}")
        #     sys.exit()

    def sensorStatus(self, sensor):
        # Send keep-alive message so dashboard knows we're still connected
        while True:
            if (sensor):
                self.client.publish("iothackday/dfe/input-device", "online")
            else:
                self.client.publish("iothackday/dfe/input-device", "offline")

    def temperatureHumiditySensor(self):
        print("[INFO] Initializing Temperature Sensor Thread ")
        time.sleep(3)

        # read data using pin 17
        dht_channel = dht11.DHT11(pin=17)
        os.chdir('sensorData')
        log_file = str(time.strftime("%Y%m%d-%H%M%S")) + \
            '_sensor_Temperature_Humidity.csv'
        f = open(log_file, "x", encoding='utf-8')
        try:
            while True:
                result = dht_channel.read()
                if result.is_valid():
                    self.client.publish(
                        'iothackday/dfe/input-device/temperatureHumidity', str(result.temperature))
                    # generate .csv log file
                    with open(log_file, 'w', newline='', encoding='utf-8') as csv_file:
                        writer = csv.writer(csv_file)
                        writer.writerow(result.temperature)
                    csv_file.close()
                # Wait for a short period before reading again
                time.sleep(2)
        except RuntimeError as err:
            f.close()
            print(err.args[0])
        finally:
            # Clean up GPIO settings
            GPIO.cleanup()

    def gasSensor(self):
        print("[INFO] Initializing Gas Sensor Thread ")
        time.sleep(3)

        gas_channel = 7  # Replace with the actual GPIO pin number
        gas_state = 0
        GPIO.setup(gas_channel, GPIO.IN)
        os.chdir('sensorData')
        log_file = str(time.strftime("%Y%m%d-%H%M%S")) + \
            '_sensor_Gas.csv'
        f = open(log_file, "x", encoding='utf-8')
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
                # generate .csv log file
                with open(log_file, 'w', newline='', encoding='utf-8') as csv_file:
                    writer = csv.writer(csv_file)
                    writer.writerow(gas_state)
                csv_file.close()
                time.sleep(2)  # Wait for a short period before reading again
        except RuntimeError as err:
            f.close()
            print(err.args[0])
        finally:
            # Clean up GPIO settings
            GPIO.cleanup()

    def tiltSensor(self):
        print("[INFO] Initializing Tilt Sensor Thread ")
        time.sleep(3)

        tilt_channel = 21
        tilt_state = 0
        GPIO.setup(tilt_channel, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        os.chdir('sensorData')
        log_file = str(time.strftime("%Y%m%d-%H%M%S")) + \
            '_sensor_Tilt.csv'
        f = open(log_file, "x", encoding='utf-8')
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
                # generate .csv log file
                with open(log_file, 'w', newline='', encoding='utf-8') as csv_file:
                    writer = csv.writer(csv_file)
                    writer.writerow(tilt_state)
                csv_file.close()
                time.sleep(2)  # Wait for a short period before reading again
        except RuntimeError as err:
            f.close()
            print(err.args[0])
        finally:
            # Clean up GPIO settings
            GPIO.cleanup()

    def vibrationSensor(self):
        print("[INFO] Initializing Vibration Sensor Thread ")
        time.sleep(3)

        vibration_channel = 27
        vibration_state = 0
        GPIO.setup(vibration_channel, GPIO.IN)
        os.chdir('sensorData')
        log_file = str(time.strftime("%Y%m%d-%H%M%S")) + \
            '_sensor_Vibration.csv'
        f = open(log_file, "x", encoding='utf-8')
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
                # generate .csv log file
                with open(log_file, 'w', newline='', encoding='utf-8') as csv_file:
                    writer = csv.writer(csv_file)
                    writer.writerow(vibration_state)
                    csv_file.close()
                time.sleep(2)  # Wait for a short period before reading again
        except RuntimeError as err:
            f.close()
            print(err.args[0])
        finally:
            # Clean up GPIO settings
            GPIO.cleanup()

    def run(self, client):
        print("[INFO] Initializing primary sensor threads ")
        time.sleep(3)
        while True:
            try:
                # Reconnect to MQTT broker if dropped
                client.loop_start()
                time.sleep(5)

                t1 = threading.Thread(
                    target=self.temperatureHumiditySensor, name="temperatureHumiditySensor")
                t2 = threading.Thread(target=self.gasSensor, name="gas")
                t3 = threading.Thread(target=self.tiltSensor, name="tilt")
                t4 = threading.Thread(
                    target=self.vibrationSensor, name="vibration")

                t5 = threading.Thread(
                    target=self.sensorStatus, name="Sensor Status", args=(t1.is_alive(),))

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

            except (KeyboardInterrupt, SystemExit):
                print("[INFO]Dashboard stopped by User")

            finally:
                # Stop MQTT server Clean up GPIO settings
                print("[INFO] Intializing Clean exit and GPIO cleanup")
                time.sleep(1)
                GPIO.cleanup()
                print("[INFO] Cleanup Done. Exiting Now")
                sys.exit()


if __name__ == "__main__":
    print("[INFO] Initializing Sensor Data")
    client_input_obj = client_inputDevice()
