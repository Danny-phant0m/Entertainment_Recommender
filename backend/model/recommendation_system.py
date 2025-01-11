import pandas as pd
from sklearn.preprocessing import OneHotEncoder


movies = pd.read_csv('../data/movies.csv')
ratings = pd.read_csv('../data/ratings.csv')

# Removing duplicate rows
movies.drop_duplicates(inplace=True)
ratings.drop_duplicates(inplace=True)

# Removing missing values
movies.dropna(inplace=True)
ratings.dropna(inplace=True)

# Extracting the genres column
genres = movies['genres']

# Creating an instance of the OneHotEncoder
encoder = OneHotEncoder()

# Fitting and transforming the genres column
genres_encoded = encoder.fit_transform(genres.values.reshape(-1, 1))
