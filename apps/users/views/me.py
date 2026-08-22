from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.users.serializers import UserSerializer, UserUpdateSerializer


class CurrentUserView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserUpdateSerializer

        return UserSerializer
