#! /usr/bin/python3

# system import
import os
import sys
import time
import threading
import datetime


class client_inputDevice:
    def __init__(self):

        self.run()

    # write code to publish to mqtt server
    def temperatureHumiditySensor(self):
        while True:
            try:
                print("In Temperature Humidity sensor")
            except RuntimeError as err:
                print(err.args[0])
            except KeyboardInterrupt:
                print("temperatureHumiditySensor stopped by User")
            time.sleep(1)

    def gasSensor(self):
        while True:
            try:
                print("In Gas sensor")
            except RuntimeError as err:
                print(err.args[0])
            except KeyboardInterrupt:
                print("gasSensor stopped by User")
            time.sleep(1)

    def tiltSensor(self):
        while True:
            try:
                print("In Tilt sensor")
            except RuntimeError as err:
                print(err.args[0])
            except KeyboardInterrupt:
                print("tiltSensor stopped by User")
            time.sleep(1)

    def vibrationSensor(self):
        while True:
            try:
                print("In Vibration sensor")
            except RuntimeError as err:
                print(err.args[0])
            except KeyboardInterrupt:
                print("vibrationSensor stopped by User")
            time.sleep(1)

    def run(self):
        try:
            time.sleep(5)

            t1 = threading.Thread(
                target=self.temperatureHumiditySensor, name="temperatureHumiditySensor")
            t2 = threading.Thread(target=self.gasSensor, name="gas")
            t3 = threading.Thread(target=self.tiltSensor, name="tilt")
            t4 = threading.Thread(
                target=self.vibrationSensor, name="vibration")

            t1.daemon =True
            t2.daemon =True
            t3.daemon =True
            t4.daemon =True





            t1.start()
            t2.start()
            t3.start()
            t4.start()

            t1.join()
            t2.join()
            t3.join()
            t4.join()

        except (KeyboardInterrupt, SystemExit):
            print("Dashboard stopped by User")
            time.sleep(1)
            sys.exit()

if __name__ == "__main__":
    client_input_obj = client_inputDevice()
