# Onnodige dubbele imports verwijderd — de onderstaande zijn voldoende
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .models import Profile


# Nieuw account aanmaken op basis van gebruikersnaam, wachtwoord en e-mail
@api_view(['POST'])
@csrf_exempt
def register(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')

    # Gebruikersnaam moet uniek zijn — blokkeer duplicaten vroeg
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken'}, status=400)

    # create_user zorgt automatisch voor het hashen van het wachtwoord
    user = User.objects.create_user(username=username, password=password, email=email)
    return Response({'message': 'Account created!'}, status=201)


# Gebruiker inloggen na verificatie van de opgegeven gegevens
@api_view(['POST'])
@csrf_exempt
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    # authenticate vergelijkt het wachtwoord met de gehashte versie in de database
    user = authenticate(username=username, password=password)

    if user is not None:
        login(request, user)  # Sessiecookie aanmaken voor verdere verzoeken
        return Response({'message': 'Logged in!', 'username': user.username})
    else:
        # Bewust vaag: niet aangeven of gebruikersnaam of wachtwoord fout is
        return Response({'error': 'Wrong username or password'}, status=400)


# Sessie beëindigen en de gebruiker uitloggen
@api_view(['POST'])
@csrf_exempt
def logout_view(request):
    logout(request)  # Verwijdert de sessiecookie server-side
    return Response({'message': 'Logged out!'})


# Profieldata ophalen voor een gegeven gebruikersnaam
@api_view(['GET'])
def get_profile(request, username):
    try:
        user = User.objects.get(username=username)

        # get_or_create voorkomt een crash als het profiel nog niet bestaat
        profile, _ = Profile.objects.get_or_create(user=user)

        return JsonResponse({
            'username': user.username,
            'email': user.email,
            'bio': profile.bio,
            # Volledige absolute URL bouwen zodat de frontend de foto kan laden
            'profile_pic': request.build_absolute_uri(profile.profile_pic.url) if profile.profile_pic else None,
        })
    except User.DoesNotExist:
        return JsonResponse({'error': 'Gebruiker niet gevonden'}, status=404)


# Bio en/of profielfoto bijwerken voor de ingelogde gebruiker
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])  # Nodig voor bestandsuploads (multipart/form-data)
def update_profile(request):
    # Profiel aanmaken als het nog niet bestaat (bv. eerste keer opslaan)
    profile, _ = Profile.objects.get_or_create(user=request.user)

    bio = request.data.get('bio')
    profile_pic = request.FILES.get('profile_pic')  # Bestand zit in FILES, niet in data

    # Alleen velden updaten die meegegeven zijn — geen verplichte velden
    if bio is not None:
        profile.bio = bio
    if profile_pic:
        profile.profile_pic = profile_pic

    profile.save()
    return JsonResponse({
        'message': 'Profiel bijgewerkt!',
        'bio': profile.bio,
        'profile_pic': request.build_absolute_uri(profile.profile_pic.url) if profile.profile_pic else None,
    })


# Gebruikers zoeken op (deel van) gebruikersnaam
@api_view(['GET'])
def search_users(request):
    query = request.GET.get('q', '')

    # Lege zoekopdracht geeft meteen een lege lijst terug
    if not query:
        return JsonResponse([], safe=False)

    # icontains = hoofdletterongevoelig zoeken; eigen account uitsluiten uit resultaten
    users = User.objects.filter(username__icontains=query).exclude(username=request.user.username)[:10]

    data = [
        {
            'username': u.username,
            # hasattr-check voorkomt een crash als het profiel-object ontbreekt
            'profile_pic': request.build_absolute_uri(u.profile.profile_pic.url)
                if hasattr(u, 'profile') and u.profile.profile_pic else None,
        }
        for u in users
    ]
    return JsonResponse(data, safe=False)