import pandas as pd
import matplotlib.pyplot as plt
import csv
import time

def read_sensor_data(file_path):
    """
    Read sensor data from CSV file and return as a DataFrame.
    """
    try:
        df = pd.read_csv(file_path)
        return df
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
        return None
    except Exception as e:
        print(f"Error: Failed to read '{file_path}': {str(e)}")
        return None

def plot_sensor_data(df, sensor_name):
    """
    Plot sensor data.
    """
    if df is not None:
        plt.figure(figsize=(10, 6))
        plt.plot(df['Timestamp'], df['Value'], linestyle='-')
        plt.title(f'{sensor_name} Sensor Data')
        plt.xlabel('Timestamp')
        plt.ylabel('Value')
        plt.grid(True)
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.show()

def main():
    # # File paths for sensor data CSV files
    # temperature_file = "temperature_sensor_data.csv"
    # vibration_file = "vibration_sensor_data.csv"
    # tilt_file = "tilt_sensor_data.csv"
    # gas_file = "gas_sensor_data.csv"

    # # Read sensor data
    # temperature_data = read_sensor_data(temperature_file)
    # vibration_data = read_sensor_data(vibration_file)
    # tilt_data = read_sensor_data(tilt_file)
    # gas_data = read_sensor_data(gas_file)

    # # Plot sensor data
    # if temperature_data is not None:
    #     plot_sensor_data(temperature_data, "Temperature")
    # if vibration_data is not None:
    #     plot_sensor_data(vibration_data, "Vibration")
    # if tilt_data is not None:
    #     plot_sensor_data(tilt_data, "Tilt")
    # if gas_data is not None:
    #     plot_sensor_data(gas_data, "Gas")
    dataset_file = 'test_dataset.csv'
    temp_data = read_sensor_data(dataset_file)
    plot_sensor_data(temp_data, 'Temperature')

if __name__ == "__main__":
    main()
