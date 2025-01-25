from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

# Example view to handle ratings
@csrf_exempt  # For now, disable CSRF for testing, but set up proper CSRF protection later
def submit_rating(request):
    if request.method == "POST":
        try:
            # Parse the JSON data from the request body
            data = json.loads(request.body)

            movie_id = data.get("movie_id")
            rating = data.get("rating")

            # Validate the data
            if not movie_id or not rating:
                return JsonResponse({"error": "Invalid data"}, status=400)

            # Here you would save the rating to the database, e.g., create or update a Rating object
            # For now, let's assume we just print it
            print(f"Received rating {rating} for movie {movie_id}")

            # Respond with a success message
            return JsonResponse({"message": "Rating submitted successfully!"}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
    
    return JsonResponse({"error": "Invalid HTTP method"}, status=405)