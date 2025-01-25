from django.urls import path
from . import views

urlpatterns = [
    path('submit_rating/', views.submit_rating, name='submit_rating'),
]