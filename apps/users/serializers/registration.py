from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.base.services.captcha import verify_captcha
from apps.users.models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    captcha_token = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "name",
            "phone",
            "password",
            "captcha_token",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def create(self, validated_data):
        password = validated_data.pop("password")
        captcha_token = validated_data.pop("captcha_token", "")
        request = self.context.get("request")
        remote_ip = getattr(request, "client_ip", None)

        verify_captcha(captcha_token, remote_ip=remote_ip)

        return User.objects.create_user(password=password, **validated_data)
