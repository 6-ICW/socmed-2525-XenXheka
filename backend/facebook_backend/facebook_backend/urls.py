from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Hoofd-URL-configuratie van het project — alle apps worden hier samengebracht
urlpatterns = [
    path('admin/', admin.site.urls),                            # Ingebouwde Django-beheerpagina
    path('api/accounts/', include('accounts.urls')),            # Registreren, inloggen, profielbeheer
    path('api/posts/', include('posts.urls')),                  # Feed, likes en comments
    path('api/friends/', include('friends.urls')),              # Vriendschapsverzoeken en vriendenlijst

# Mediabestanden (profielfoto's) serveren via de development server
# In productie neemt een webserver zoals Nginx deze taak over
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)