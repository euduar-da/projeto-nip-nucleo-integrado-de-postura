from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import Usuario, Colaborador, Paciente

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    senha = serializers.CharField(write_only=True)

    def validate(self, data):
        usuario = authenticate(username=data['email'], password=data['senha'])

        if not usuario:
            raise serializers.ValidationError('E-mail ou senha inválidos.')

        if not usuario.is_active:
            raise serializers.ValidationError('Conta inativa. Contate o administrador.')

        data['usuario'] = usuario
        return data


class UsuarioCadastroSerializer(serializers.ModelSerializer):
    senha = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Usuario
        fields = ['email', 'senha', 'first_name', 'last_name']

    def validate_email(self, value):
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError('Já existe um usuário com este e-mail.')
        return value


class PacienteCadastroSerializer(serializers.Serializer):
    email = serializers.EmailField()
    senha = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    cpf = serializers.CharField(max_length=14)
    data_nascimento = serializers.DateField()

    def validate_email(self, value):
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError('Já existe um usuário com este e-mail.')
        return value

    def validate_cpf(self, value):
        if Paciente.objects.filter(cpf=value).exists():
            raise serializers.ValidationError('Já existe um paciente com este CPF.')
        return value

    def create(self, validated_data):
        usuario = Usuario.objects.create_user(
            email=validated_data['email'],
            password=validated_data['senha'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
        )
        paciente = Paciente.objects.create(
            usuario=usuario,
            cpf=validated_data['cpf'],
            data_nascimento=validated_data['data_nascimento'],
        )
        return paciente


# ------------------------------------------------------------------
# NOVO: Cadastro de Colaborador (Adaptado para a nova arquitetura)
# ------------------------------------------------------------------
class ColaboradorCadastroSerializer(serializers.Serializer):
    email = serializers.EmailField()
    senha = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    perfil = serializers.ChoiceField(choices=Colaborador.Perfil.choices)

    def validate_email(self, value):
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError('Já existe um usuário cadastrado com este e-mail.')
        return value

    def create(self, validated_data):
        usuario = Usuario.objects.create_user(
            email=validated_data['email'],
            password=validated_data['senha'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
        )
        colaborador = Colaborador.objects.create(
            usuario=usuario,
            perfil=validated_data['perfil']
        )
        return colaborador