from django.urls import path

from apps.users.views import (
    CurrentUserView,
    ThrottledTokenObtainPairView,
    ThrottledTokenRefreshView,
    UserRegistrationView,
)

urlpatterns = [
    path("auth/register/", UserRegistrationView.as_view(), name="auth-register"),
    path("auth/token/", ThrottledTokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("auth/token/refresh/", ThrottledTokenRefreshView.as_view(), name="token-refresh"),
    path("auth/me/", CurrentUserView.as_view(), name="auth-me"),
]
