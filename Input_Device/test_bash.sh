#!/bin/bash


cd ~/navneet_ws/2022HT56073_SEM4/sensor_dashboard/dashboard && sleep 2 && node ./node_modules/gulp/bin/gulp.js && sleep 20 &

cd ~/navneet_ws/2022HT56073_SEMs4/sensor_dashboard/Input_Device && sleep 2 && python3 Input_Device.py && sleep 20

# D- ~/navneet_ws/2022HT56073_SEM4/sensor_dashboard/dashboard 
# CODE: node ./node_modules/gulp/bin/gulp.js

# D-~/navneet_ws/2022HT56073_SEMs4/sensor_dashboard/Input_Device
# CODE:python3 Input_Device.py