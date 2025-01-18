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
import tables


# Creating an instance of the OneHotEncoder
encoder = OneHotEncoder()

#movies = pd.read_csv('../data/TMDB_movie_dataset_v11.csv')
ratings = pd.read_csv('../data/ratings_small.csv')[['userId', 'movieId', 'rating']]
# ratings = pd.read_csv('../data/ratings_small.csv')
movies = pd.read_csv('../data/movies_small.csv')[['movieId', 'title']]

# ratings = pd.read_csv(
#     "../data/u.data",
#     sep="\t", # this is a tab separated data
#     names=["user_id", "movie_id", "rating", "timestamp"], # the columns names
#     usecols=["user_id", "movie_id", "rating"], # we do not need the timestamp column
#     low_memory=False
# )

# movies_mapper_cols = [
#     "movie_id", 
#     "movie_title", 
#     "release_date", 
#     "video_release_date", 
#     "IMDb_URL", 
#     "unknown",
#     "Action",
#     "Adventure",
#     "Animation",
#     "Childrens",
#     "Comedy",
#     "Crime",
#     "Documentary",
#     "Drama",
#     "Fantasy",
#     "Film_Noir",
#     "Horror",
#     "Musical",
#     "Mystery",
#     "Romance",
#     "Sci_Fi",
#     "Thriller",
#     "War",
#     "Western" 
# ]
# movies_mapper = pd.read_csv(
#     "../data/u.item",
#     sep="|",
#     encoding="latin",
#     names=movies_mapper_cols,
#     usecols=["movie_id", "movie_title"], # we only need these columns
#     index_col="movie_id"
# )
# Remove movies release years from titles
movies["title"] = movies["title"].apply(
    lambda title: re.sub(r"\(\d{4}\)", "", title).strip()
)

test_perc = 0.2 # set percentage of test data

# Initialize the train and test dataframes.
train_set, test_set = pd.DataFrame(), pd.DataFrame()

# Add a new user (new user ID is last user ID + 1)
# new_user_id = ratings['userId'].max() + 1
# new_ratings = pd.DataFrame({
#     'userId': [new_user_id]*11, 
#     'movieId': [131739, 190017,156000,124867,129826,136864,138104,143890,166455,168420,161354],  # Movie IDs that the new user rates
#     'rating': [4.5, 5,4.5,3,4,5,2,4.5,3,5,5]  # Simulated ratings
# })

# # Concatenate the new ratings with the original dataset
# ratings = pd.concat([ratings, new_ratings], ignore_index=True)

# # Load MovieLens dataset and split into train/test sets
# reader = Reader(rating_scale=(1, 5))
# data = Dataset.load_from_df(ratings, reader)
# train_set, test_set = train_test_split(data, test_size=0.2)

# # Instantiate the SVD model
# svd = SVD()

# # Train the model on the training set
# svd.fit(train_set)

# # Function to recommend movies based on a given item_id
# def recommend_based_on_item(user_id, top_n=10):
#     predictions = []
#     # Loop through all users and predict the rating for the item
#     for item_id in ratings['movieId'].unique():
#         predicted_rating = svd.predict(user_id, item_id).est
#         predictions.append((item_id, predicted_rating))

#     # Sort predictions by rating in descending order and get top N recommendations
#     predictions.sort(key=lambda x: x[1], reverse=True)
#     top_predictions = predictions[:top_n]

#     # Return the top N recommended users and their predicted ratings
#     return top_predictions

# # Example: Get recommendations based on a specific movie (item_id = 302)
# top_n_recommendations = recommend_based_on_item(new_user_id)

# # Print the recommendations
# for item_id, predicted_rating in top_n_recommendations:
#     print(f"User {new_user_id} has a predicted rating of {predicted_rating} for item {item_id}")


# Check each user.
for userId in ratings.userId.unique(): 
    user_df = ratings[ratings.userId == userId].sample(
        frac=1,
        random_state=42
    ) # select only samples of the actual user and shuffle the resulting dataframe
    
    n_entries = len(user_df) # get the total number of ratings
    n_test = int(round(test_perc * n_entries))# gets about 20% of the number of ratings for the test set
    
    # joins the train and test set for ratings to the users of global test/train set
    test_set = pd.concat((test_set, user_df.tail(n_test)))  
    train_set = pd.concat((train_set, user_df.head(n_entries - n_test)))

# shuffles the test/train set and resest the index
train_set = train_set.sample(frac=1).reset_index(drop=True)
test_set = test_set.sample(frac=1).reset_index(drop=True)

train_set.shape, test_set.shape

def build_predictions_df(preds_m, dataframe):
    preds_v = []
    for row_id, user_id, movie_id, _ in dataframe.itertuples():
        preds_v.append(preds_m[user_id-1, movie_id-1])
    preds_df = pd.DataFrame(data={"user_id": dataframe.user_id, "movie_id": dataframe.movie_id, "rating": preds_v})
    return preds_df

def get_mse(estimator, train_set, test_set):
    train_preds = build_predictions_df(estimator.predictions, train_set)
    test_preds = build_predictions_df(estimator.predictions, test_set)
    
    train_mse = mean_squared_error(train_set.rating, train_preds.rating)
    test_mse = mean_squared_error(test_set.rating, test_preds.rating)
    
    return train_mse, test_mse

n_users = ratings['userId'].nunique()
n_movies = ratings['movieId'].max()

def store_dense_matrix(matrix, name):
    with tables.open_file(f"../data/{name}.h5", mode="w") as file:
        file.create_array("/", "dense_matrix", matrix)

def spouter(A, B):
    A_coo = A.tocoo()
    B_coo = B.tocoo()

    row_indices = np.repeat(B_coo.row, len(A_coo.data))
    col_indices = (B_coo.col[:, None] * A.shape[1] + A_coo.col).ravel()
    data = (B_coo.data[:, None] * A_coo.data).ravel()

    return csr_matrix((data, (row_indices, col_indices)), shape=(B.shape[0], A.shape[1] * B.shape[1]))

def build_interactions_matrix(r_mat, n_users, n_items):
    iter_m = np.zeros((n_users, n_items)) # create empty 0 matrix
    
    # loops through the ratings data
    for _, userId, movieId, rating in r_mat.itertuples():
        iter_m[userId-1, movieId-1] = rating # fills the matrix with users ratings
    return iter_m

iter_m = build_interactions_matrix(ratings, n_users, n_movies) # call to create interaction matrix  
iter_m.shape # return the dimensions of the interactions matrix

# create the similrity matrix
def build_similarity_matrix(interactions_matrix, kind="user", eps=1e-9):
    interactions_matrix = csr_matrix(interactions_matrix)
    # takes rows as user features
    if kind == "user":
        similarity_matrix = interactions_matrix.dot(interactions_matrix.T) # dot product to get similarity matrix
    # takes columns as item features
    elif kind == "item":
        similarity_matrix = interactions_matrix.T.dot(interactions_matrix)
    norms = np.sqrt(similarity_matrix.diagonal()) + eps # calculates normalization factors
    # Initialize a new sparse matrix for normalized values
    normalized_matrix = similarity_matrix.copy()
    norms2D = csr_matrix(norms[np.newaxis, :])
    norms2D1 =  csr_matrix(norms[:, np.newaxis])
    A = csr_matrix([[1, 2, 4]])
    B = csr_matrix([[1], [2], [4]])

    # Get the outer product
    outer_product = spouter(A, B)
    # print(norms2D)
    # print(norms2D1)
    print(outer_product)
    # for row in range(similarity_matrix.shape[0]):
    #     # Get the start and end of the non-zero elements for the row
    #     start_idx = similarity_matrix.indptr[row]
    #     end_idx = similarity_matrix.indptr[row + 1]
        
    #     start_idx1 = outer_product.indptr[row]
    #     end_idx1 = outer_product.indptr[row + 1]
        
    #     # Loop through the column indices for this row
    #     for col_idx, value in zip(similarity_matrix.indices[start_idx:end_idx], similarity_matrix.data[start_idx:end_idx]):
    #         for col_idx1, value2 in zip(outer_product.indices[start_idx1:end_idx1], outer_product.data[start_idx1:end_idx1]):
    #             if col_idx == col_idx1:
    #                 print(value/value2)
                    # Append the results (row, column, divided value)
                    # rows.append(row)
                    # cols.append(col_idx)
                    # values.append(value / value2)
    # Iterate over rows to normalize
    # for i in range(similarity_matrix.shape[0]):
    #     row_start = similarity_matrix.indptr[i]
    #     row_end = similarity_matrix.indptr[i]
    #     normalized_matrix.data[row_start:row_end] /= norms[i]
    #print(normalized_matrix.data[0:126])
    # print(similarity_matrix.indptr[i+1])
    #print(normalized_matrix)
    return normalized_matrix # normalize the matrix

u_sim = build_similarity_matrix(iter_m, kind="user")
i_sim = build_similarity_matrix(iter_m, kind="item")
# print(u_sim)
# print(i_sim)

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
