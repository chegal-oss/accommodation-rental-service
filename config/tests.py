from django.test import SimpleTestCase
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
