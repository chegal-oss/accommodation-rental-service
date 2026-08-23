from rest_framework import status
from rest_framework.test import APITestCase


class OpenAPITests(APITestCase):
    def test_schema_and_docs_are_available(self):
        schema_response = self.client.get("/api/schema/")
        docs_response = self.client.get("/api/docs/")

        self.assertEqual(schema_response.status_code, status.HTTP_200_OK)
        self.assertEqual(docs_response.status_code, status.HTTP_200_OK)
