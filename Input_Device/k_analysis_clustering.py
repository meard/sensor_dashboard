import pandas as pd
from sklearn.cluster import KMeans
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns 
import time

dataset_file = 'analysis_graph/test_dataset.csv'

csv_df = pd.read_csv(dataset_file)
dataset_df = pd.to_datetime(csv_df['Time - Temperature'], unit='s')

# Convert timestamp to Unix timestamp (seconds since the epoch)
dataset_df_unix = dataset_df.astype(np.int64) // 10**9

# Concatenate the Unix timestamp and temperature data
dataset_df_concat = pd.concat([dataset_df_unix, csv_df['Temperature Value']], axis=1)
dataset_df_concat.columns = ['Time - Temperature', 'Temperature Value']

# Select only the first 1200 rows
X = dataset_df_concat.iloc[:1200]

# Perform K-means clustering
wcss = []
for i in range(1, 11):
    kmeans = KMeans(n_clusters=i, init='random', random_state=42)
    kmeans.fit(X)
    wcss.append(kmeans.inertia_)
    
# Plot the Elbow Method graph
sns.set_theme()
plt.plot(range(1, 11), wcss, marker='o', linestyle='--')
plt.title('K-means Clustering - Elbow Method')
plt.xlabel('Clusters')
plt.ylabel('WCSS')
plt.savefig('elbow_method.png')  # Save the Elbow Method graph as an image
plt.show()

# Perform K-means clustering with the optimal number of clusters
kmeans = KMeans(n_clusters=3, init='random', random_state=42)
kmeans.fit(X)

# Plot the K-means clustering results
plt.figure(figsize=(10, 6))
plt.scatter(pd.to_datetime(X['Time - Temperature'], unit='s'), X['Temperature Value'], c=kmeans.labels_, cmap='viridis')
plt.scatter(pd.to_datetime(kmeans.cluster_centers_[:, 0], unit='s'), kmeans.cluster_centers_[:, 1], marker='o', s=200, color='red')
plt.title('K-means Clustering')
plt.xlabel('Time')
plt.ylabel('Temperature Value')
plt.savefig('kmeans_clusters.png')  # Save the K-means clustering graph as an image
plt.show()

# Additional K-means clustering plot
x = pd.to_datetime(X['Time - Temperature'], unit='s')
y = X['Temperature Value']

kmeans = KMeans(n_clusters=2)
kmeans.fit(X)

plt.scatter(x, y, c=kmeans.labels_)
plt.title('K-means Clustering (2 clusters)')
plt.xlabel('Time')
plt.ylabel('Temperature Value')
plt.show()
