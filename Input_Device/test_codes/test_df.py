#! /usr/bin/python3

import pandas as pd
import time
import time
import csv



log_file = 'sensorData/'+str(time.strftime("%Y%m%d-%H%M%S")) + \
            '_sensor_Temperature_Humidity.csv'


sensorData_Temperature = []
sensorData_Temperature_Time = []
sensorData_Tilt = []
sensorData_Vibration = []

for i in range(10):
    sensorData_Temperature.append(str(i))
    sensorData_Temperature_Time.append(str(time.time()))

sensorData = pd.DataFrame({'Time - Temperature': sensorData_Temperature_Time, 'Temperature Value': sensorData_Temperature})

print(sensorData)
print(sensorData.head())

sensorData.to_csv(log_file, index=False)


# # print(len(sensorData['Temperature Value']))  
# with open(log_file, 'w') as f:
#     fieldnames = ['Time - Temperature', 'Temperature Value']
#     writer = csv.DictWriter(f, fieldnames=fieldnames)

#     writer.writeheader()
    
#     writer.writerow(sensorData_Temperature_Time)
#     writer.writerow(sensorData_Temperature)
    
#     f.close()
#     # # using csv.writer method from CSV package
#     # write = csv.writer(f)
     
#     # write.writerows(sensorData_Temperature_Time)
#     # write.writerows(sensorData_Temperature)

# # sensorData.at[len(sensorData['Temperature Value']), 'Temperature Value']


# # with open(..., 'w', newline='') as myfile:
# #      wr = csv.writer(myfile, quoting=csv.QUOTE_ALL)
# #      wr.writerow(mylist)



