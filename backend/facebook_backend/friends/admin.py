from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import FriendRequest

admin.site.register(FriendRequest)