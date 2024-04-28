#! /usr/bin/python3

import pandas as pd
from sklearn.cluster import KMeans
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns 

dataset_file = 'analysis_graph/test_dataset.csv'

csv_df = pd.read_csv(dataset_file)
dataset_df = pd.to_datetime(csv_df['Time - Temperature'], unit='s').dt.strftime("%Y%m%d%H%M%S")
dataset_df = pd.concat([dataset_df, csv_df['Temperature Value']], axis=1)


X = dataset_df[[ 'Time - Temperature','Temperature Value']].copy()

print(X.head())

wcss = []
for i in range(1, 11):
    kmeans = KMeans(n_clusters=3, init='k-means++', random_state=42)
    kmeans.fit(X)
    wcss.append(kmeans.inertia_)
    

sns.set_theme()

plt.plot(range(1, 11), wcss, marker='o', linestyle='--')

plt.title('K-means Clustering - Elbow Method')

plt.xlabel('Clusters')
plt.ylabel('WCSS')
plt.show()