from django.urls import path
from . import views

# URL-patronen voor alle vriendschap-gerelateerde eindpunten
urlpatterns = [
    path('send/<str:username>/', views.send_request),           # POST — vriendschapsverzoek sturen naar <username>
    path('requests/', views.get_requests),                      # GET  — eigen inkomende verzoeken ophalen
    path('handle/<int:request_id>/', views.handle_request),     # POST — verzoek accepteren of weigeren op basis van id
    path('list/<str:username>/', views.get_friends),            # GET  — vriendenlijst van <username> ophalen
    path('status/<str:username>/', views.get_friendship_status), # GET  — vriendschapsstatus met <username> ophalen
]