from django.test import RequestFactory, SimpleTestCase

from apps.base.middleware import ClientIPMiddleware


class ClientIPMiddlewareTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = ClientIPMiddleware(lambda request: None)

    def test_client_ip_uses_first_forwarded_address(self):
        request = self.factory.get(
            "/",
            HTTP_X_FORWARDED_FOR="203.0.113.10, 10.0.0.2",
            REMOTE_ADDR="127.0.0.1",
        )

        self.middleware(request)

        self.assertEqual(request.client_ip, "203.0.113.10")

    def test_client_ip_falls_back_to_remote_addr(self):
        request = self.factory.get("/", REMOTE_ADDR="127.0.0.1")

        self.middleware(request)

        self.assertEqual(request.client_ip, "127.0.0.1")
