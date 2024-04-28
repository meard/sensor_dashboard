#! /usr/bin/python3

import pandas as pd
from sklearn.cluster import KMeans
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import datetime as dt

dataset_file = 'analysis_graph/test_dataset.csv'

csv_df = pd.read_csv(dataset_file)
dataset_df = pd.DataFrame(columns=['Time - Temperature', 'Temperature Value'])
dataset_df['Time - Temperature'] = pd.to_datetime(csv_df['Time - Temperature'], unit='s')
dataset_df['Temperature Value'] = csv_df['Temperature Value']

dataset_df['Time - Temperature']=dataset_df['Time - Temperature'].map(dt.datetime.toordinal)


X = dataset_df[['Time - Temperature', 'Temperature Value']].copy()


# print(X.head())

# # # print(X['Time - Temperature'])

def plot_regression_line(x, y, b):
  # plotting the actual points as scatter plot
  plt.scatter(x, y, color = "m",
        marker = "o", s = 30)

  # predicted response vector
  y_pred = b[0] + b[1]*x

  # plotting the regression line
  plt.plot(x, y_pred, color = "g")

  # putting labels
  plt.xlabel('x')
  plt.ylabel('y')


def estimate_coef(x, y):
  # number of observations/points
  n = np.size(x)

  # mean of x and y vector
  m_x = np.mean(x)
  m_y = np.mean(y)

  # calculating cross-deviation and deviation about x
  SS_xy = np.sum(y*x) - n*m_y*m_x
  SS_xx = np.sum(x*x) - n*m_x*m_x

  # calculating regression coefficients
  b_1 = SS_xy / SS_xx
  b_0 = m_y - b_1*m_x

  return b_0, b_1

def main():
    # observations / data
    x = X['Time - Temperature']
    y = X['Temperature Value']

    # # estimating coefficients
    b_0, b_1 = estimate_coef(x, y)
    print("Estimated coefficients: \nb_0 = {} \
          \nb_1 = {}".format(b_0, b_1))

    # plot_regression_line(x, y, (b_0, b_1))

if __name__ == '__main__':
    main()
