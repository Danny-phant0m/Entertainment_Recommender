import pandas as pd
from sklearn.preprocessing import OneHotEncoder
from sklearn.neighbors import NearestNeighbors
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from scipy.sparse import hstack


# Creating an instance of the OneHotEncoder
encoder = OneHotEncoder()

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

# Extracting columns
genres = movies['genres']
keywords = movies['keywords']
overview = movies['overview']

# Combine genres, keywords, and overview into a single string for each movie
combined = movies['genres'].fillna('') + ' ' + movies['keywords'].fillna('') + ' ' + movies['overview'].fillna('')

# Extract features from text descriptions
tfidf_vectorizer = TfidfVectorizer()
tfidf_matrix = tfidf_vectorizer.fit_transform(overview)

# Example user interactions
user_interactions = [(27205, 1), (157336, 0), (155, 1)]

# Create a user profile by aggregating item features
user_profile = np.zeros(tfidf_matrix.shape[1])
for id, rating in user_interactions:
    item_index = movies.index[movies['id'] == id][0]
    user_profile += tfidf_matrix[item_index].toarray()[0] * rating

# Calculate cosine similarity between the user profile and item features
similarities = cosine_similarity([user_profile], tfidf_matrix)

# Number of recommendations to return
num_recommendations = 10  # Adjust this as needed

# Sort similarities in descending order and get the indices
sorted_indices = np.argsort(similarities[0])[::-1]

# Limit the recommendations to the top N
top_indices = sorted_indices[:num_recommendations]

# Map sorted indices to the original DataFrame
recommended_movies = movies.iloc[top_indices]

# Extract the IDs of the recommended movies
recommended_item_ids = recommended_movies['id']

# Display recommendations
print("Recommended Items:")
for id in recommended_item_ids:
    print(f"Movie {id}")

# # Fitting and transforming the genres column
# genres_encoded = encoder.fit_transform(genres.values.reshape(-1, 1))
# keywords_encoded = encoder.fit_transform(keywords.values.reshape(-1, 1))

# # Combining the encoded genres and keywords into a single feature vector
# combined_features = hstack([genres_encoded, keywords_encoded])

# # Creating an instance of the NearestNeighbors class
# recommender = NearestNeighbors(metric='cosine')

# # Fitting the encoded genres to the recommender
# recommender.fit(keywords_encoded.toarray())

# # Index of the movie the user has previously watched
# movie_index = 0

# # Number of recommendations to return
# num_recommendations = 5

# # Getting the recommendations
# _, recommendations = recommender.kneighbors(keywords_encoded[movie_index].toarray(), n_neighbors=num_recommendations)

# # Extracting the movie titles from the recommendations
# recommended_movie_titles = movies.iloc[recommendations[0]]['title']
# print(recommended_movie_titles)

