#! /usr/bin/python3

# system import
import os
import sys
import time
import threading
import datetime

# user imports
import paho.mqtt.client as mqtt
import wifi
import RPi.GPIO as GPIO
import dht11


class client_inputDevice:
    def __init__(self):
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
        self.client_server = "test.mosquitto.org"
        self.ssid = ""
        self.password = ""
        self.isConnected = False

        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)

        self.set_network(self.client, self.client_server,
                         self.ssid, self.password)

        self.run(self.client)

    def set_network(self, client, client_server, ssid, password):
        def on_connect(client, userdata, flags, rc):
            if rc == 0:
                print("Connected to MQTT Broker!")
            else:
                print("Failed to connect, return code %d\n", rc)
                exit(0)

        print("[INFO]Setting up MQTT Server...")

        client.on_connect = on_connect
        client.connect_async(client_server, 1883)

        time.sleep(5)
        print("[INFO]Setting up Local Network...")
        wifi_scanner = wifi.Cell.all('wlan0')

        for cell in wifi_scanner:
            if cell.ssid == ssid:
                scheme = wifi.Scheme.for_cell('wlan0', ssid, cell, password)
                scheme.save()
                scheme.activate()
                self.isConnected = True
                break

        if self.isConnected:
            print(f"Connected to network: {ssid}")
            return

        else:
            print(f"Unable to find network: {ssid}")
            exit(0)

    # write code to publish to mqtt server
    def temperatureHumiditySensor(self):
        # read data using pin 17
        instance = dht11.DHT11(pin=17)
        while True:
            try:
                result = instance.read()
                if result.is_valid():
                    print("Last valid input: " + str(datetime.datetime.now()))
                    print("Temperature: %d C" % result.temperature)
                    print("Temperature: %d F" %
                          ((result.temperature * 9/5)+32))
                    print("Humidity: %d %%" % result.humidity)
            except RuntimeError as err:
                print(err.args[0])
            finally:
                # Clean up GPIO settings
                GPIO.cleanup()

            time.sleep(1)

    def gasSensor(self):
        DO_PIN = 7  # Replace with the actual GPIO pin number
        GPIO.setup(DO_PIN, GPIO.IN)

        try:
            while True:
                # Read the state of the DO pin
                gas_present = GPIO.input(DO_PIN)

                # Determine if gas is present or not
                if gas_present == GPIO.LOW:
                    gas_state = "Gas Detected"
                else:
                    gas_state = "No Gas Detected"

                # Print the gas state
                print(f"Gas State: {gas_state}")

                time.sleep(0.5)  # Wait for a short period before reading again

        except KeyboardInterrupt:
            print("Gas detection stopped by user")

        finally:
            # Clean up GPIO settings
            GPIO.cleanup()

    def tiltSensor(self):
        def alert(ev=None):
            print("Tilt Detected")

        channel = 21
        GPIO.setup(channel, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        try:
            GPIO.add_event_detect(channel, GPIO.FALLING,
                                  callback=alert, bouncetime=100)
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("Tilt detection stopped by user")

        finally:
            # Clean up GPIO settings
            GPIO.cleanup()

    def vibrationSensor(self):
        channel = 17
        GPIO.setup(channel, GPIO.IN)

        def callback(channel):
            if GPIO.input(channel):
                print("Movement Detected!")
            else:
                print("Movement Detected!")
        try:
            # let us know when the pin goes HIGH or LOW
            GPIO.add_event_detect(channel, GPIO.BOTH, bouncetime=300)
            # assign function to GPIO PIN, Run function on change
            GPIO.add_event_callback(channel, callback)

            # infinite loop
            while True:
                time.sleep(1)

        except KeyboardInterrupt:
            print("Vibration detection stopped by user")

        finally:
            # Clean up GPIO settings
            GPIO.cleanup()

    def run(self, client):
        try:
            # Reconnect to MQTT broker if dropped
            client.loop_start()
            time.sleep(5)

            # Send keep-alive message so dashboard knows we're still connected
            client.publish("iothackday/dfe/input-device", "online")

            t1 = threading.Thread(
                target=self.temperatureHumiditySensor, name="temperatureHumiditySensor")
            t2 = threading.Thread(target=self.gasSensor, name="gas")
            t3 = threading.Thread(target=self.tiltSensor, name="tilt")
            t4 = threading.Thread(
                target=self.vibrationSensor, name="vibration")

            t1.start()
            t2.start()
            t3.start()
            t4.start()

            t1.join()
            t2.join()
            t3.join()
            t4.join()

        except KeyboardInterrupt:
            print("Dashboard stopped by User")

        finally:
            # Stop MQTT server Clean up GPIO settings
            client.loop_stop()
            GPIO.cleanup()


if __name__ == "__main__":
    client_input_obj = client_inputDevice()
