from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import pandas as pd

# Example view to handle ratings
@csrf_exempt  # For now, disable CSRF for testing, but set up proper CSRF protection later
def submit_rating(request):
    # ratings = pd.read_csv('../data/ratings_small.csv')[['userId', 'movieId', 'rating']]
    # movies = pd.read_csv('../data/movies_small.csv')[['movieId', 'title']]

    # # Add a new user (new user ID is last user ID + 1)
    # new_user_id = ratings['userId'].max() + 1
    # new_ratings = pd.DataFrame({
    #     'userId': [new_user_id]*11, 
    #     'movieId': [167746,122892,27311,60979,79274,90603,103233,131739,136864,167746,95004],  # Movie IDs that the new user rates
    #     'rating': [4.5, 5 , 4.5 , 3 , 4 , 5 , 2 , 4.5 , 3 , 5 , 5]  # Simulated ratings
    # })

    # # Concatenate the new ratings with the original dataset
    # ratings = pd.concat([ratings, new_ratings], ignore_index=True)
    # ratings2 = pd.merge(ratings, movies, how='inner', on='movieId')

    if request.method == "POST":
        try:
            # Parse the JSON data from the request body
            data = json.loads(request.body)

            movie_id = data.get("movieId")
            rating = data.get("rating")

            # Validate the data
            if not movie_id or not rating:
                return JsonResponse({"error": "Invalid data"}, status=400)

            print(f"Received rating {rating} for movie {movie_id}")

            # Respond with a success message
            return JsonResponse({"message": "Rating submitted successfully!"}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
    
    return JsonResponse({"error": "Invalid HTTP method"}, status=405)