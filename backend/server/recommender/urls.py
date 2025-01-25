from django.urls import path
from .views import submit_rating

urlpatterns = [
    path('submit_rating/', submit_rating, name='submit_rating'),
]