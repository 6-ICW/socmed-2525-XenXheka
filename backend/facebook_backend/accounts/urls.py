from django.urls import path
from . import views

# URL-patronen voor alle account-gerelateerde eindpunten
urlpatterns = [
    path('register/', views.register),              # POST — nieuw account aanmaken
    path('login/', views.login_view),               # POST — inloggen en sessie starten
    path('logout/', views.logout_view),             # POST — sessie beëindigen
    path('update-profile/', views.update_profile),  # POST — bio en/of profielfoto opslaan
    path('profile/<str:username>/', views.get_profile),  # GET — profiel ophalen via gebruikersnaam
    path('search/', views.search_users),            # GET — gebruikers zoeken op naam (?q=...)
]