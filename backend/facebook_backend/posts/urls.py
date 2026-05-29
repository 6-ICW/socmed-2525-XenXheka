from django.urls import path
from . import views

# URL-patronen voor alle post-gerelateerde eindpunten
urlpatterns = [
    path('', views.get_posts),                                   # GET  — alle posts ophalen voor de feed
    path('create/', views.create_post),                          # POST — nieuwe post aanmaken
    path('<int:post_id>/like/', views.toggle_like),              # POST — like toevoegen of verwijderen
    path('<int:post_id>/comments/', views.get_comments),         # GET  — comments van een post ophalen
    path('<int:post_id>/comments/create/', views.create_comment),# POST — nieuw comment toevoegen aan een post
]