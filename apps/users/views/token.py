from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_scope = "auth_token"


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_scope = "auth_refresh"
