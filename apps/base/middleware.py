class ClientIPMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.client_ip = self._get_client_ip(request)

        return self.get_response(request)

    def _get_client_ip(self, request):
        forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if forwarded_for:
            return forwarded_for.split(",", maxsplit=1)[0].strip()

        return request.META.get("REMOTE_ADDR")
