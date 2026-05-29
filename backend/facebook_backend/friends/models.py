from django.db import models
from django.contrib.auth.models import User  # Ingebouwd gebruikersmodel van Django


class FriendRequest(models.Model):
    # Mogelijke statussen van een vriendschapsverzoek
    STATUS_CHOICES = [
        ('pending', 'Pending'),   # Verstuurd maar nog niet behandeld
        ('accepted', 'Accepted'), # Geaccepteerd — de twee gebruikers zijn nu vrienden
        ('rejected', 'Rejected'), # Geweigerd
    ]

    # ForeignKey naar User — beide kanten hebben een related_name zodat je vanuit
    # een User-object makkelijk alle verstuurde of ontvangen verzoeken kunt opvragen
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')

    # Status opslaan als tekstwaarde; choices beperkt de geldige opties in de admin
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')

    # Tijdstip automatisch invullen bij aanmaken — kan achteraf niet meer gewijzigd worden
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Voorkomt dat dezelfde gebruiker meerdere verzoeken naar dezelfde persoon stuurt
        unique_together = ('from_user', 'to_user')

    def __str__(self):
        # Leesbare weergave in de Django-admin en de shell
        return f"{self.from_user.username} → {self.to_user.username} ({self.status})"