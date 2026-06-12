from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Post, Like, Comment


# Alle posts ophalen van vrienden en de ingelogde gebruiker zelf
@api_view(['GET'])
def get_posts(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Niet ingelogd'}, status=401)

    # Lokale import om een circulaire importfout te vermijden tussen de posts- en friends-app
    from friends.models import FriendRequest

    # Vriendschap kan in beide richtingen bestaan — beide kanten opvragen
    sent = FriendRequest.objects.filter(from_user=request.user, status='accepted').values_list('to_user', flat=True)
    received = FriendRequest.objects.filter(to_user=request.user, status='accepted').values_list('from_user', flat=True)

    # Dedupliceren via set() en eigen id toevoegen zodat je ook je eigen posts ziet
    friend_ids = list(set(list(sent) + list(received))) + [request.user.id]

    # Nieuwste posts eerst via omgekeerde sortering op aanmaaktijdstip
    posts = Post.objects.filter(user__id__in=friend_ids).order_by('-created_at')

    data = [
        {
            'id': post.id,
            'username': post.user.username,
            'content': post.content,
            'created_at': post.created_at.strftime('%d/%m/%Y %H:%M'),
            'likes': post.likes.count(),
            # Controleren of de ingelogde gebruiker deze post al geliked heeft
            'liked_by_me': post.likes.filter(user=request.user).exists(),
        }
        for post in posts
    ]
    return JsonResponse(data, safe=False)  # safe=False is nodig om een lijst terug te sturen


# Nieuwe post aanmaken voor de ingelogde gebruiker
@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Alternatief voor handmatige is_authenticated-check
def create_post(request):
    content = request.data.get('content')

    if not content:
        return JsonResponse({'error': 'Content is verplicht'}, status=400)

    post = Post.objects.create(user=request.user, content=content)
    return JsonResponse({
        'id': post.id,
        'username': post.user.username,
        'content': post.content,
        'created_at': post.created_at.strftime('%d/%m/%Y %H:%M'),
    }, status=201)  # 201 Created — niet 200, want er is een nieuwe resource aangemaakt


# Like toevoegen of verwijderen (toggle) op een post
@api_view(['POST'])
def toggle_like(request, post_id):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Niet ingelogd'}, status=401)

    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({'error': 'Post niet gevonden'}, status=404)

    # get_or_create: like bestaat al → unlike; bestaat nog niet → like toevoegen
    like, created = Like.objects.get_or_create(user=request.user, post=post)

    if not created:
        like.delete()  # Al geliked → like verwijderen
        liked = False
    else:
        liked = True   # Nog niet geliked → like toegevoegd

    return JsonResponse({
        'liked': liked,
        'likes': post.likes.count(),  # Bijgewerkte teller teruggeven aan de frontend
    })


# Alle comments van een post ophalen, chronologisch gesorteerd
@api_view(['GET'])
def get_comments(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({'error': 'Post niet gevonden'}, status=404)

    # Oudste comments eerst zodat de conversatie logisch leesbaar is
    comments = post.comments.all().order_by('created_at')
    data = [
        {
            'id': comment.id,
            'username': comment.user.username,
            'content': comment.text,
            'created_at': comment.created_at.strftime('%d/%m/%Y %H:%M'),
        }
        for comment in comments
    ]
    return JsonResponse(data, safe=False)


# Nieuw comment toevoegen aan een post
@api_view(['POST'])
def create_comment(request, post_id):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Niet ingelogd'}, status=401)

    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({'error': 'Post niet gevonden'}, status=404)

    content = request.data.get('content')
    if not content:
        return JsonResponse({'error': 'Comment mag niet leeg zijn'}, status=400)

    comment = Comment.objects.create(user=request.user, post=post, text=content)
    return JsonResponse({
        'id': comment.id,
        'username': comment.user.username,
        'content': comment.text,
        'created_at': comment.created_at.strftime('%d/%m/%Y %H:%M'),
    }, status=201)