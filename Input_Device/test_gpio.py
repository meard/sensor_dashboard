import RPi.GPIO as GPIO
import time
import json

# GPIO SETUP
channel = 22
GPIO.setmode(GPIO.BCM)
GPIO.setup(channel, GPIO.IN)

# File name for storing data
json_file = "sensor_data.json"

# Function to detect movement and write data to JSON file
def write_to_json(channel):
    data = {}
    data['timestamp'] = time.time()
    data['movement'] = "Movement Detected!" if GPIO.input(channel) else "No Movement Detected!"

    with open(json_file, 'a') as f:
        json.dump(data, f)
        f.write('\n')  # Add a newline for readability
    print("Data written to JSON file:", data)

# Set up event detection
GPIO.add_event_detect(channel, GPIO.BOTH, bouncetime=300)
GPIO.add_event_callback(channel, write_to_json)

print("Vibration sensor monitoring started. Press Ctrl+C to exit.")

# Infinite loop to keep the script running
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\nExiting program.")
    GPIO.cleanup()
