from django.db import models
from django.contrib.auth.models import User  # Ingebouwd gebruikersmodel van Django

# Uitbreiding op het standaard User-model met extra profielinformatie
class Profile(models.Model):
    # OneToOneField: elk account heeft precies één profiel; CASCADE verwijdert het profiel mee als de user wordt verwijderd
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    # blank=True: bio is optioneel — het veld mag leeg blijven
    bio = models.TextField(blank=True)
    email=models.EmailField(blank=True)
    # upload_to bepaalt de submap binnen MEDIA_ROOT waar foto's worden opgeslagen
    # null=True: geen foto is toegestaan — de databasekolom mag NULL bevatten
    profile_pic = models.ImageField(upload_to='profile_pics/', blank=True, null=True)

    def __str__(self):
        # Leesbare weergave in de Django-admin en de shell
        return f"{self.user.username}'s profiel"