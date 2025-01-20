import pandas as pd
from sklearn.preprocessing import OneHotEncoder
from sklearn.neighbors import NearestNeighbors
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import train_test_split
import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error
from surprise import accuracy
import optuna
import matplotlib.pyplot as plt
import re
import os
from scipy.sparse import hstack
from surprise import Dataset, Reader, SVD
from scipy.sparse import csr_matrix
from sklearn.preprocessing import OrdinalEncoder
import scipy.sparse as sp 
import itertools
from scipy.sparse import csr_matrix
from surprise import KNNWithMeans
from surprise.model_selection import GridSearchCV


# Creating an instance of the OneHotEncoder
encoder = OneHotEncoder()

#movies = pd.read_csv('../data/TMDB_movie_dataset_v11.csv')
# ratings = pd.read_csv('../data/ratings_small.csv')

ratings = pd.read_csv('../data/ratings_small.csv')[['userId', 'movieId', 'rating']]
movies = pd.read_csv('../data/movies_small.csv')[['movieId', 'title']]


# Add a new user (new user ID is last user ID + 1)
new_user_id = ratings['userId'].max() + 1
new_ratings = pd.DataFrame({
    'userId': [new_user_id]*11, 
    'movieId': [167746,122892,27311,60979,79274,90603,103233,131739,136864,167746,95004],  # Movie IDs that the new user rates
    'rating': [4.5, 5 , 4.5 , 3 , 4 , 5 , 2 , 4.5 , 3 , 5 , 5]  # Simulated ratings
})

# Concatenate the new ratings with the original dataset
ratings = pd.concat([ratings, new_ratings], ignore_index=True)
ratings2 = pd.merge(ratings, movies, how='inner', on='movieId')# joing the ratings with the movies
df = ratings2.pivot_table(index='title',columns='userId',values='rating').fillna(0)# create the user item matrix 
df1 = df.copy()

# # mean centered ratings to bias
# ratings_centred = df.subtract(df.mean(axis=0), axis='columns')

# # calculate the adjusted cosine 
# items_similarity_matrix = ratings_centred.corr()



# Remove movies release years from titles
movies["title"] = movies["title"].apply(
    lambda title: re.sub(r"\(\d{4}\)", "", title).strip()
)


def recommend_movies(user, num_recommended_movies):

  print('The list of the Movies {} Has Watched \n'.format(user))

  for m in df[df[user] > 0][user].index.tolist():
    print(m)
  
  print('\n')

  recommended_movies = []

  # loop through each movie movie the user has not rated
  for m in df[df[user] == 0].index.tolist():

    index_df = df.index.tolist().index(m) # get the index of the movie m
    predicted_rating = df1.iloc[index_df, df1.columns.tolist().index(user)]# gets predicted rations for movie m from df1
    recommended_movies.append((m, predicted_rating)) # adds the movie and its rating to the array

  sorted_rm = sorted(recommended_movies, key=lambda x:x[1], reverse=True) # sorte the recommended movies in dec order
  
  print('The list of the Recommended Movies \n')
  rank = 1 # keeps track of the position of the recommend movies
  for recommended_movie in sorted_rm[:num_recommended_movies]:
    
    print('{}: {} - predicted rating:{}'.format(rank, recommended_movie[0], recommended_movie[1])) # prints out the recommended movies and the position of its ranking
    rank = rank + 1

def movie_recommender(user, num_neighbors, num_recommendation):
  
  number_neighbors = num_neighbors

  knn = NearestNeighbors(metric='cosine', algorithm='brute') # initilize knn with cosine simularity
  knn.fit(df.values) # fit the data into the instance
  distances, indices = knn.kneighbors(df.values, n_neighbors=number_neighbors)# retrive the nearest neighbours for each movie

  user_index = df.columns.tolist().index(user)

  # iterate over the movies to calculate predicted ratings for the user
  for m,t in list(enumerate(df.index)):
    if df.iloc[m, user_index] == 0:
      sim_movies = indices[m].tolist() # get the index for the simiular movies
      movie_distances = distances[m].tolist()
    
      # remove the movie if it is in sim_movies
      if m in sim_movies:
        id_movie = sim_movies.index(m) # get the index of the move
        sim_movies.remove(m)# remove the movie 
        movie_distances.pop(id_movie) # Remove the movie distance

      else:
        sim_movies = sim_movies[:num_neighbors-1] # stores the top neighbors for similar movies prediction
        movie_distances = movie_distances[:num_neighbors-1]# stores the distances for similar movies
      
      # convert the distances to similarity
      movie_similarity = [1-x for x in movie_distances]
      movie_similarity_copy = movie_similarity.copy()
      nominator = 0 # variable for incremented weighed ratings

      # Loops through similar movies
      for s in range(0, len(movie_similarity)):
        # makes sure to only make predictions for movies the user has not rated
        if df.iloc[sim_movies[s], user_index] == 0: 
          if len(movie_similarity_copy) == (number_neighbors - 1):
            movie_similarity_copy.pop(s) # remove movies that are not rated
          
          else:
            movie_similarity_copy.pop(s-(len(movie_similarity)-len(movie_similarity_copy)))
        else:
          nominator = nominator + movie_similarity[s]*df.iloc[sim_movies[s],user_index]# adds the weighted ratings of similar movies
          
      # Checks if there are still more similarites
      if len(movie_similarity_copy) > 0:
        if sum(movie_similarity_copy) > 0: # makes sure no divison by 0
          predicted_r = nominator/sum(movie_similarity_copy) # calculated the predicted rating
        
        else:
          predicted_r = 0

      else:
        predicted_r = 0 # predicted ration is zero if no similarites exsist
        
      df1.iloc[m,user_index] = predicted_r # save predicted ratings in a copy of the matrix

  recommend_movies(user,num_recommendation)# call the function to print movie recommendations


movie_recommender(new_user_id, 10, 10)

# def build_predictions_df(preds_m, dataframe):
#     preds_v = []
#     for row_id, userId, movieId, _ in dataframe.itertuples():
#         preds_v.append(preds_m[userId-1, movieId-1])
#     preds_df = pd.DataFrame(data={"userId": dataframe.userId, "movieId": dataframe.movieId, "rating": preds_v})
#     return preds_df

# def get_mse(estimator, train_set, test_set):
#     train_preds = build_predictions_df(estimator.predictions, train_set)
#     test_preds = build_predictions_df(estimator.predictions, test_set)
    
#     train_mse = mean_squared_error(train_set.rating, train_preds.rating)
#     test_mse = mean_squared_error(test_set.rating, test_preds.rating)
    
#     return train_mse, test_mse

# # Removing duplicate rows
# movies.drop_duplicates(inplace=True)
# ratings.drop_duplicates(inplace=True)

# # Removing missing values
# movies.dropna(inplace=True)
# ratings.dropna(inplace=True)

# # Display first few rows of the dataset
# movies.head()

# # Clean up the column names
# movies.columns = movies.columns.str.replace('"', '').str.strip()

# # Extracting columns
# genres = movies['genres']
# keywords = movies['keywords']
# overview = movies['overview']
# tagline = movies['tagline']
# production = movies['production_companies']
# language = movies['original_language']


# # Combine genres, keywords, and overview into a single string for each movie
# combined = genres.fillna('') + ' ' + keywords.fillna('') + ' ' + overview.fillna('') + ' ' + tagline.fillna('') + ' ' + production.fillna('') + ' ' + language.fillna('') 

# # Extract features from text descriptions
# tfidf_vectorizer = TfidfVectorizer()
# tfidf_matrix = tfidf_vectorizer.fit_transform(combined)

# # Example user interactions
# user_interactions = [(118340, 5)]

# # Create a user profile by aggregating item features
# user_profile = np.zeros(tfidf_matrix.shape[1])
# for id, rating in user_interactions:
#     item_index = movies.index[movies['id'] == id][0]
#     user_profile += tfidf_matrix[item_index].toarray()[0] * rating

# # Calculate cosine similarity between the user profile and item features
# similarities = cosine_similarity([user_profile], tfidf_matrix)

# # Number of recommendations to return
# num_recommendations = 5  # Adjust this as needed

# # Sort similarities in descending order and get the indices
# sorted_indices = np.argsort(similarities[0])[::-1]

# # Limit the recommendations to the top N
# top_indices = sorted_indices[:num_recommendations]

# # Map sorted indices to the original DataFrame
# recommended_movies = movies.iloc[top_indices]

# # Extract the IDs of the recommended movies
# recommended_item_ids = recommended_movies['id']

# # Display recommendations
# print("Recommended Items:")
# for id in recommended_item_ids:
#     print(f"Movie {id}")

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
