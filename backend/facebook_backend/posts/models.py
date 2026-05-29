from django.http import JsonResponse
from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from .models import FriendRequest


# Vriendschapsverzoek sturen naar een andere gebruiker
@api_view(['POST'])
def send_request(request, username):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Niet ingelogd'}, status=401)

    try:
        to_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Gebruiker niet gevonden'}, status=404)

    # Voorkomen dat een gebruiker zichzelf een verzoek stuurt
    if to_user == request.user:
        return JsonResponse({'error': 'Je kan jezelf geen verzoek sturen'}, status=400)

    # get_or_create voorkomt dubbele verzoeken — created is False als het al bestond
    freq, created = FriendRequest.objects.get_or_create(
        from_user=request.user,
        to_user=to_user,
    )

    if not created:
        return JsonResponse({'error': 'Verzoek al verstuurd'}, status=400)

    return JsonResponse({'message': 'Vriendschapsverzoek verstuurd!'})


# Inkomend vriendschapsverzoek accepteren of weigeren
@api_view(['POST'])
def handle_request(request, request_id):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Niet ingelogd'}, status=401)

    try:
        # to_user=request.user garandeert dat je alleen je eigen verzoeken kunt behandelen
        freq = FriendRequest.objects.get(id=request_id, to_user=request.user)
    except FriendRequest.DoesNotExist:
        return JsonResponse({'error': 'Verzoek niet gevonden'}, status=404)

    action = request.data.get('action')  # Verwachte waarde: 'accept' of 'reject'

    if action == 'accept':
        freq.status = 'accepted'
        freq.save()
        return JsonResponse({'message': 'Vriendschapsverzoek geaccepteerd!'})
    elif action == 'reject':
        freq.status = 'rejected'
        freq.save()
        return JsonResponse({'message': 'Vriendschapsverzoek geweigerd!'})
    else:
        return JsonResponse({'error': 'Ongeldige actie'}, status=400)


# Alle openstaande (pending) inkomende verzoeken ophalen voor de ingelogde gebruiker
@api_view(['GET'])
def get_requests(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Niet ingelogd'}, status=401)

    requests = FriendRequest.objects.filter(to_user=request.user, status='pending')
    data = [
        {
            'id': freq.id,
            'from_user': freq.from_user.username,
            # Datum formatteren naar leesbare Belgische notatie
            'created_at': freq.created_at.strftime('%d/%m/%Y %H:%M'),
        }
        for freq in requests
    ]
    return JsonResponse(data, safe=False)  # safe=False is nodig om een lijst terug te sturen


# Volledige vriendenlijst ophalen voor een gegeven gebruikersnaam
@api_view(['GET'])
def get_friends(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Gebruiker niet gevonden'}, status=404)

    # Vrienden zitten in beide richtingen: verzoeken die de user stuurde én ontving
    sent = FriendRequest.objects.filter(from_user=user, status='accepted').values_list('to_user__username', flat=True)
    received = FriendRequest.objects.filter(to_user=user, status='accepted').values_list('from_user__username', flat=True)

    # Samenvoegen en dedupliceren via set() zodat niemand dubbel verschijnt
    friends = list(set(list(sent) + list(received)))
    return JsonResponse(friends, safe=False)


# Vriendschapsstatus bepalen tussen de ingelogde gebruiker en een andere gebruiker
@api_view(['GET'])
def get_friendship_status(request, username):
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'not_logged_in'})

    try:
        other_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Gebruiker niet gevonden'}, status=404)

    # Eigen profielpagina — geen vriendschapsknop nodig
    if request.user == other_user:
        return JsonResponse({'status': 'self'})

    # Vriendschap controleren in beide richtingen want het verzoek kan van beide kanten komen
    freq = FriendRequest.objects.filter(
        from_user=request.user, to_user=other_user, status='accepted'
    ).first() or FriendRequest.objects.filter(
        from_user=other_user, to_user=request.user, status='accepted'
    ).first()

    if freq:
        return JsonResponse({'status': 'friends'})

    # Openstaand verzoek van de ingelogde gebruiker naar de andere gebruiker
    pending = FriendRequest.objects.filter(
        from_user=request.user, to_user=other_user, status='pending'
    ).first()

    if pending:
        return JsonResponse({'status': 'pending'})

    # Geen relatie gevonden — knop om verzoek te sturen tonen
    return JsonResponse({'status': 'none'})