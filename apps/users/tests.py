from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User


@override_settings(CAPTCHA_ENABLED=False)
class UserAuthAPITests(APITestCase):
    def test_user_can_register_and_get_token(self):
        response = self.client.post(
            "/api/v1/auth/register/",
            {
                "email": "tenant@example.com",
                "name": "Tenant",
                "phone": "+49123456789",
                "password": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("password", response.data)
        self.assertTrue(User.objects.filter(email="tenant@example.com").exists())

        token_response = self.client.post(
            "/api/v1/auth/token/",
            {
                "email": "tenant@example.com",
                "password": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(token_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", token_response.data)
        self.assertIn("refresh", token_response.data)

    def test_authenticated_user_can_get_current_profile(self):
        user = User.objects.create_user(
            email="tenant@example.com",
            password="StrongPass123!",
            name="Tenant",
        )
        self.client.force_authenticate(user=user)

        response = self.client.get("/api/v1/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], user.email)

    def test_registration_errors_are_localized_by_accept_language(self):
        response = self.client.post(
            "/api/v1/auth/register/",
            {
                "email": "tenant@example.com",
                "name": "Tenant",
                "phone": "bad",
                "password": "StrongPass123!",
            },
            HTTP_ACCEPT_LANGUAGE="ru",
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["phone"][0],
            "Введите корректный номер телефона. Он может содержать цифры, пробелы, дефисы, скобки и необязательный знак плюс в начале.",
        )
