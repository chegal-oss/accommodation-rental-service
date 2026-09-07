from django.conf import settings
from django.http import FileResponse, Http404, JsonResponse
from django.views import View


class FrontendAppView(View):
    def get(self, request, *args, **kwargs):
        index_path = settings.FRONTEND_DIST_DIR / "index.html"

        if not index_path.exists():
            raise Http404("Frontend build was not found. Run `npm run build` in frontend directory.")

        return FileResponse(index_path.open("rb"), content_type="text/html")


class PublicConfigView(View):
    def get(self, request, *args, **kwargs):
        return JsonResponse({"debug": settings.DEBUG})
