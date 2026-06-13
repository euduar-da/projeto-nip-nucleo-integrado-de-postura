from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from .models import Paciente, Colaborador, FichaClinica, Anotacao


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


class PacienteCadastroSerializer(serializers.ModelSerializer):
    senha = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Paciente
        fields = ['id', 'nome', 'login', 'senha', 'cpf', 'data_nascimento']
        read_only_fields = ['id']

    def validate_cpf(self, value):
        if Paciente.objects.filter(cpf=value).exists():
            raise serializers.ValidationError('Já existe um paciente cadastrado com este CPF.')
        return value

    def validate_login(self, value):
        if Paciente.objects.filter(login=value).exists():
            raise serializers.ValidationError('Já existe um paciente cadastrado com este login.')
        return value

    def create(self, validated_data):
        senha = validated_data.pop('senha')
        paciente = Paciente(**validated_data, senha=make_password(senha))
        paciente.save()
        return paciente


class ColaboradorCadastroSerializer(serializers.ModelSerializer):
    senha = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Colaborador
        fields = ['id', 'first_name', 'last_name', 'email', 'senha', 'perfil']
        read_only_fields = ['id']

    def validate_email(self, value):
        if Colaborador.objects.filter(email=value).exists():
            raise serializers.ValidationError('Já existe um colaborador cadastrado com este e-mail.')
        return value

    def create(self, validated_data):
        senha = validated_data.pop('senha')
        colaborador = Colaborador(**validated_data)
        colaborador.set_password(senha)
        colaborador.save()
        return colaborador


class AnotacaoSerializer(serializers.ModelSerializer):
    colaborador_nome = serializers.CharField(source='colaborador.get_full_name', read_only=True)
    data = serializers.DateField(read_only=True)
    hora = serializers.TimeField(read_only=True)

    class Meta:
        model = Anotacao
        fields = ['id', 'conteudo', 'data', 'hora', 'colaborador_nome']
        read_only_fields = ['id', 'data', 'hora', 'colaborador_nome']


class FichaClinicaSerializer(serializers.ModelSerializer):
    anotacoes = AnotacaoSerializer(many=True, read_only=True, source='anotacao_set')
    paciente_nome = serializers.CharField(source='paciente.nome', read_only=True)

    class Meta:
        model = FichaClinica
        fields = ['id', 'data_criacao', 'paciente', 'paciente_nome', 'anotacoes']
        read_only_fields = ['id', 'data_criacao', 'paciente_nome', 'anotacoes']

    def validate_paciente(self, value):
        if FichaClinica.objects.filter(paciente=value).exists():
            raise serializers.ValidationError('Este paciente já possui uma ficha clínica.')
        return value


class AnotacaoCriarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anotacao
        fields = ['id', 'conteudo']
        read_only_fields = ['id']