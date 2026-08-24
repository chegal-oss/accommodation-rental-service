import logging

from django.test.runner import DiscoverRunner


class QuietRequestWarningsDiscoverRunner(DiscoverRunner):
    def setup_test_environment(self, **kwargs):
        super().setup_test_environment(**kwargs)
        self._django_request_level = logging.getLogger("django.request").level
        logging.getLogger("django.request").setLevel(logging.ERROR)

    def teardown_test_environment(self, **kwargs):
        logging.getLogger("django.request").setLevel(self._django_request_level)
        super().teardown_test_environment(**kwargs)
