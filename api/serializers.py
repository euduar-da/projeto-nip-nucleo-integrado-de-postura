from django.contrib.auth import authenticate
from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    senha = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        senha = data.get('senha')

        colaborador = authenticate(username=email, password=senha)

        if not colaborador:
            raise serializers.ValidationError('E-mail ou senha inválidos.')

        if not colaborador.is_active:
            raise serializers.ValidationError('Conta inativa. Contate o administrador.')

        data['colaborador'] = colaborador
        return data