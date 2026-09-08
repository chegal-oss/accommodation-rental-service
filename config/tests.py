from pathlib import Path
from tempfile import TemporaryDirectory

from django.test import SimpleTestCase, override_settings
from django.utils.translation import gettext, override
from rest_framework import status
from rest_framework.test import APITestCase


class OpenAPITests(APITestCase):
    def test_schema_and_docs_are_available(self):
        schema_response = self.client.get("/api/schema/")
        docs_response = self.client.get("/api/docs/")

        self.assertEqual(schema_response.status_code, status.HTTP_200_OK)
        self.assertEqual(docs_response.status_code, status.HTTP_200_OK)


class LocalizationTests(SimpleTestCase):
    def test_russian_translations_are_available(self):
        with override("ru"):
            self.assertEqual(gettext("listing"), "объявление")
            self.assertEqual(gettext("Tenant"), "Арендатор")

    def test_german_translations_are_available(self):
        with override("de"):
            self.assertEqual(gettext("listing"), "Anzeige")
            self.assertEqual(gettext("Tenant"), "Mieter")


class FrontendAppTests(SimpleTestCase):
    def test_frontend_routes_return_index_html(self):
        with TemporaryDirectory() as directory:
            index_path = Path(directory) / "index.html"
            index_path.write_text("<html><body>Frontend app</body></html>", encoding="utf-8")

            with override_settings(FRONTEND_DIST_DIR=Path(directory)):
                root_response = self.client.get("/")
                route_response = self.client.get("/listings/1")

        self.assertEqual(root_response.status_code, status.HTTP_200_OK)
        self.assertEqual(route_response.status_code, status.HTTP_200_OK)
        self.assertIn(b"Frontend app", b"".join(root_response.streaming_content))
        self.assertIn(b"Frontend app", b"".join(route_response.streaming_content))

    def test_frontend_fallback_does_not_handle_bare_admin_path(self):
        with TemporaryDirectory() as directory:
            index_path = Path(directory) / "index.html"
            index_path.write_text("<html><body>Frontend app</body></html>", encoding="utf-8")

            with override_settings(FRONTEND_DIST_DIR=Path(directory)):
                response = self.client.get("/admin")

        self.assertNotEqual(response.status_code, status.HTTP_200_OK)

    def test_missing_frontend_build_returns_404(self):
        with TemporaryDirectory() as directory, override_settings(FRONTEND_DIST_DIR=Path(directory)):
            response = self.client.get("/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
