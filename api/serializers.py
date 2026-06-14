from django.contrib.auth import authenticate
from rest_framework import serializers
from django.utils import timezone
from .models import Usuario, Colaborador, Paciente, FichaClinica, Anotacao, Sessao, Servico, Exercicio, Prescricao

# ------------------------------------------------------------------
# AUTENTICAÇÃO E CADASTROS BASE (Seu código original mantido)
# ------------------------------------------------------------------

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


# ------------------------------------------------------------------
# NOVO: FICHA CLÍNICA E ANOTAÇÕES
# ------------------------------------------------------------------

class AnotacaoSerializer(serializers.ModelSerializer):
    # Corrigido o caminho para acessar o nome completo do usuário vinculado ao colaborador
    colaborador_nome = serializers.CharField(source='colaborador.usuario.get_full_name', read_only=True)
    data = serializers.DateField(read_only=True)
    hora = serializers.TimeField(read_only=True)

    class Meta:
        model = Anotacao
        fields = ['id', 'conteudo', 'data', 'hora', 'colaborador_nome']
        read_only_fields = ['id', 'data', 'hora', 'colaborador_nome']


class FichaClinicaSerializer(serializers.ModelSerializer):
    anotacoes = AnotacaoSerializer(many=True, read_only=True, source='anotacao_set')
    paciente_nome = serializers.CharField(source='paciente.usuario.get_full_name', read_only=True)
    data_criacao = serializers.SerializerMethodField()

    class Meta:
        model = FichaClinica
        fields = ['id', 'data_criacao', 'paciente', 'paciente_nome', 'anotacoes']
        read_only_fields = ['id', 'data_criacao', 'paciente_nome', 'anotacoes']

    def get_data_criacao(self, obj):
        if hasattr(obj.data_criacao, 'date'):
            return obj.data_criacao.date().isoformat()
        return str(obj.data_criacao)

    def validate_paciente(self, value):
        if FichaClinica.objects.filter(paciente=value).exists():
            raise serializers.ValidationError('Este paciente já possui uma ficha clínica.')
        return value


class AnotacaoCriarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anotacao
        fields = ['id', 'conteudo']
        read_only_fields = ['id']

class PacienteListSerializer(serializers.ModelSerializer):
    nome = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()

    class Meta:
        model = Paciente
        fields = ['id', 'nome', 'email', 'cpf', 'data_nascimento']

    def get_nome(self, obj):
        return obj.usuario.get_full_name()

    def get_email(self, obj):
        return obj.usuario.email
    
    # ------------------------------------------------------------------
# NOVO: AGENDAMENTO DE SESSÕES
# ------------------------------------------------------------------

class SessaoSerializer(serializers.ModelSerializer):
    # Nomes amigáveis para facilitar a vida do Front-end
    paciente_nome = serializers.CharField(source='paciente.usuario.get_full_name', read_only=True)
    colaborador_nome = serializers.CharField(source='colaborador.usuario.get_full_name', read_only=True, default="Não atribuído")
    servico_nome = serializers.CharField(source='servico.nome', read_only=True)

    class Meta:
        model = Sessao
        fields = [
            'id', 'data', 'horario', 'status', 
            'paciente', 'paciente_nome', 
            'servico', 'servico_nome', 
            'colaborador', 'colaborador_nome'
        ]
        # Status entra como somente leitura porque o banco já define 'Agendado' por padrão
        read_only_fields = ['id', 'status', 'paciente_nome', 'servico_nome', 'colaborador_nome']

    def validate(self, data):
        colaborador = data.get('colaborador')
        data_sessao = data.get('data')
        horario_sessao = data.get('horario')

        hoje = timezone.localdate()
        agora = timezone.localtime().time()

        if data_sessao < hoje:
            raise serializers.ValidationError({
                'data': 'Não é possível agendar uma sessão para uma data anterior à atual.'
            })

        if data_sessao == hoje and horario_sessao < agora:
            raise serializers.ValidationError({
                'horario': 'Não é possível agendar uma sessão em um horário anterior ao horário atual.'
            })

        if not colaborador:
            raise serializers.ValidationError({
                'colaborador': 'Selecione um profissional para a sessão.'
            })

        conflito = Sessao.objects.filter(
            colaborador=colaborador,
            data=data_sessao,
            horario=horario_sessao
        ).exclude(
            status__iexact='Cancelado'
        ).exists()

        if conflito:
            raise serializers.ValidationError(
                "Este colaborador já possui um agendamento para este dia e horário."
            )
        return data
    
class ServicoListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servico
        fields = ['id', 'nome']

from rest_framework import serializers
from .models import MovimentacaoFinanceira


class MovimentacaoFinanceiraSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimentacaoFinanceira
        fields = [
            'id',
            'tipo_transacao',
            'valor',
            'data_movimentacao',
            'servico',
            'colaborador',
        ]
        read_only_fields = ['id', 'colaborador']

        # ------------------------------------------------------------------
# EXERCÍCIOS E PRESCRIÇÕES
# ------------------------------------------------------------------

class ExercicioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercicio
        fields = ['id', 'nome', 'descricao_base', 'url_midia']

class PrescricaoSerializer(serializers.ModelSerializer):
    exercicios = ExercicioSerializer(many=True, read_only=True)
    paciente_nome = serializers.CharField(source='paciente.usuario.get_full_name', read_only=True)

    class Meta:
        model = Prescricao
        fields = ['id', 'paciente_nome', 'series', 'repeticoes', 'exercicios']