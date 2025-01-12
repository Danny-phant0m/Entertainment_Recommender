import pandas as pd
from sklearn.preprocessing import OneHotEncoder
from sklearn.neighbors import NearestNeighbors
from sklearn.model_selection import train_test_split



movies = pd.read_csv('../data/TMDB_movie_dataset_v11.csv')
ratings = pd.read_csv('../data/ratings.csv')

# Removing duplicate rows
movies.drop_duplicates(inplace=True)
ratings.drop_duplicates(inplace=True)

# Removing missing values
movies.dropna(inplace=True)
ratings.dropna(inplace=True)

# Display first few rows of the dataset
movies.head()

# Clean up the column names
movies.columns = movies.columns.str.replace('"', '').str.strip()

# Extracting the genres column
genres = movies['genres']


# Creating an instance of the OneHotEncoder
encoder = OneHotEncoder(sparse_output=False)

# Fitting and transforming the genres column
genres_encoded = encoder.fit_transform(genres.values.reshape(-1, 1))


X_train, X_test, y_train, y_test = train_test_split(genres_encoded, genres_encoded, test_size=0.2, random_state=42)

# print(genres_encoded)

# # Creating an instance of the NearestNeighbors class
# recommender = NearestNeighbors(metric='cosine')

# # Fitting the encoded genres to the recommender
# recommender.fit(genres_encoded.toarray())

# # Index of the movie the user has previously watched
# movie_index = 0

# # Number of recommendations to return
# num_recommendations = 5

# # Getting the recommendations
# _, recommendations = recommender.kneighbors(genres_encoded[movie_index].toarray(), n_neighbors=num_recommendations)

# # Extracting the movie titles from the recommendations
# recommended_movie_titles = movies.iloc[recommendations[0]]['title']
# print(recommended_movie_titles)

