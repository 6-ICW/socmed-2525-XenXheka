# Middleware die CSRF-controle uitschakelt voor alle inkomende verzoeken
class DisableCSRF:
    def __init__(self, get_response):
        self.get_response = get_response  # Volgende middleware of view in de keten

    def __call__(self, request):
        # Django slaat CSRF-validatie over als dit attribuut True is
        setattr(request, '_dont_enforce_csrf_checks', True)
        return self.get_response(request)  # Verzoek doorgeven aan de volgende stap