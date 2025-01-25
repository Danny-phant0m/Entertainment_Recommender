import pandas as pd
from sklearn.preprocessing import OneHotEncoder
from sklearn.neighbors import NearestNeighbors
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import train_test_split
import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error
import optuna
import matplotlib.pyplot as plt
import re
from scipy.sparse import csr_matrix
from sklearn.preprocessing import OrdinalEncoder
import scipy.sparse as sp 
import itertools
from scipy.sparse import csr_matrix
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import LabelEncoder

def user_recommend_movie(u, k, threshold, num_recommendations,ratings2):
    
    userRatings = ratings2.pivot_table(index = ['userId'], columns = ['title'],
                                values = 'rating')
    user_similarity_matrix = userRatings.T.corr(method = 'pearson')

    # get movies that target user has watched and rated
    target_watched = userRatings[userRatings.index == u].dropna(axis = 1, how = 'all')
    # remove target user so that they are not amongst one of the similar users.
    user_similarity_matrix.drop(index = u)
    # Return the top k (10) similar users
    k_Neighbours = user_similarity_matrix[user_similarity_matrix[u] > threshold][u].sort_values(ascending = False)[:k]
    target_not_watched = userRatings[userRatings.index == u].dropna(axis = 1, how = 'all')
    target_not_watched = userRatings[userRatings.index.isin(k_Neighbours.index)].dropna(axis = 1, how = 'all')
    # remove movies that the target user has watched.
    target_not_watched.drop(target_watched.columns, axis = 1, inplace = True, errors = 'ignore')
    
    movies = target_not_watched.columns
    recommended_movie_list = []
    predicted_rating_list = []
    # calcualte mean rating for user u
    mu_u = userRatings[userRatings.index == u].T.mean()[u]

    for j in movies:
        movie_ratings = target_not_watched
        rating_sum = 0
        similarity_sum = 0
        for v in movie_ratings.index :
            # Get rating user v gave to movie j
            rating = movie_ratings.loc[v][j]
            # Get Pearson Similarity score between user u and user v
            similarity = user_similarity_matrix[u][v]
            if pd.isna(rating) == False:
                # calculate mean rating of user v
                mu_v = userRatings[userRatings.index == v].T.mean()[v]
                # calculate mean-centered rating
                mean_centered_rating = rating - mu_v
                rating_sum = rating_sum + similarity*mean_centered_rating
                similarity_sum = similarity_sum + similarity
        # Predict rating
        prediction_rating = mu_u + rating_sum/similarity_sum
        recommended_movie_list.append(j)
        predicted_rating_list.append(prediction_rating)

    results = pd.DataFrame(list(zip(recommended_movie_list, predicted_rating_list)), 
                          columns = ['Movie', 'Predicted_Rating']).sort_values('Predicted_Rating', ascending = False).head(num_recommendations)
    return results

def recommend_movies(user, num_recommended_movies,df,df1):

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
  return sorted_rm

def movie_recommender(user, num_neighbors, num_recommendation,ratings2):
  # joing the ratings with the movies
  df = ratings2.pivot_table(index='title',columns='userId',values='rating').fillna(0) # create the user item matrix 
  df1 = df.copy()
  
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

  recommend_movies(user,num_recommendation,df,df1)# call the function to print movie recommendations

# movie_recommender(new_user_id, 10, 10,ratings2)
# recommend = user_recommend_movie(u=new_user_id, k=10, threshold=0.5, num_recommendations=10, ratings2=ratings2)
# print(recommend)

def content_based_recommendation(Moive_ratings): 
  movies_large = pd.read_csv('../data/TMDB_all_movies.csv')
  # Extracting columns
  genres = movies_large['genres']
  # keywords = movies_large['keywords']
  overview = movies_large['overview']
  tagline = movies_large['tagline']
  production = movies_large['production_companies']
  language = movies_large['original_language']
  cast = movies_large['cast']
  director = movies_large['director']
  director_of_photography = movies_large['director_of_photography']
  writers = movies_large['writers']
  producers = movies_large['producers']
  music_composer = movies_large['music_composer']


  # Combine genres, keywords, and overview into a single string for each movie
  combined = genres.fillna('') + ' ' + overview.fillna('') + ' ' + tagline.fillna('') + ' ' + production.fillna('') + ' ' + language.fillna('') + ' ' + cast.fillna('')  + ' ' + director.fillna('') + ' ' + director_of_photography.fillna('')  + ' ' + writers.fillna('')  + ' ' + producers.fillna('')  + ' ' + music_composer.fillna('') 

  # Extract features from text descriptions
  tfidf_vectorizer = TfidfVectorizer()
  tfidf_matrix = tfidf_vectorizer.fit_transform(combined)
  # Example user interactions
  # user_interactions = [(118340, 5)]
  user_interactions = Moive_ratings

  # Create a user profile by aggregating item features
  user_profile = np.zeros(tfidf_matrix.shape[1])
  for id, rating in user_interactions:
      item_index = movies_large.index[movies_large['id'] == id][0]
      print(item_index)
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
  recommended_movies = movies_large.iloc[top_indices]

  # Extract the IDs of the recommended movies
  recommended_item_ids = recommended_movies['id']

  # Display recommendations
  print("Recommended Items:")
  for id in recommended_item_ids:
      print(f"Movie {id}")
