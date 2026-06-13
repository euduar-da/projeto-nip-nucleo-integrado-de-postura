from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from .permissions import IsColaborador

from .models import FichaClinica, Anotacao
from .serializers import (
    LoginSerializer,
    PacienteCadastroSerializer,
    ColaboradorCadastroSerializer,
    FichaClinicaSerializer,
    AnotacaoCriarSerializer,
)


class LoginView(APIView):
    """RF01 - Login de Colaborador."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({'erro': serializer.errors}, status=status.HTTP_401_UNAUTHORIZED)

        colaborador = serializer.validated_data['colaborador']
        token, _ = Token.objects.get_or_create(user=colaborador)

        return Response({
            'token': token.key,
            'perfil': colaborador.perfil,
            'nome': colaborador.get_full_name(),
            'email': colaborador.email,
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """Invalida o token do colaborador autenticado."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.auth:
            request.auth.delete()
        return Response({'mensagem': 'Logout realizado com sucesso.'}, status=status.HTTP_200_OK)


class PacienteCadastroView(APIView):
    """RF02 - Cadastro de Paciente."""
    permission_classes = [IsAuthenticated, IsColaborador]

    def post(self, request):
        serializer = PacienteCadastroSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({'erro': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        paciente = serializer.save()

        return Response({
            'mensagem': 'Paciente cadastrado com sucesso.',
            'paciente': {
                'id': paciente.id,
                'nome': paciente.nome,
                'login': paciente.login,
                'cpf': paciente.cpf,
                'data_nascimento': paciente.data_nascimento,
            }
        }, status=status.HTTP_201_CREATED)


class ColaboradorCadastroView(APIView):
    """RF - Cadastro de Colaborador."""
    permission_classes = [IsAuthenticated, IsColaborador]

    def post(self, request):
        serializer = ColaboradorCadastroSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({'erro': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        colaborador = serializer.save()

        return Response({
            'mensagem': 'Colaborador cadastrado com sucesso.',
            'colaborador': {
                'id': colaborador.id,
                'nome': colaborador.get_full_name(),
                'email': colaborador.email,
                'perfil': colaborador.perfil,
            }
        }, status=status.HTTP_201_CREATED)


class FichaClinicaView(APIView):
    """
    RF06 - Armazenar fichas de pacientes.

    POST /api/fichas/              → Cria uma nova ficha para um paciente
    GET  /api/fichas/<ficha_id>/   → Consulta a ficha de um paciente
    PUT  /api/fichas/<ficha_id>/   → Edita a ficha de um paciente
    """
    permission_classes = [IsAuthenticated, IsColaborador]

    def post(self, request):
        serializer = FichaClinicaSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({'erro': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        ficha = serializer.save()

        return Response({
            'mensagem': 'Ficha clínica criada com sucesso.',
            'ficha': FichaClinicaSerializer(ficha).data,
        }, status=status.HTTP_201_CREATED)

    def get(self, request, ficha_id):
        try:
            ficha = FichaClinica.objects.get(id=ficha_id)
        except FichaClinica.DoesNotExist:
            return Response({'erro': 'Ficha clínica não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(FichaClinicaSerializer(ficha).data, status=status.HTTP_200_OK)

    def put(self, request, ficha_id):
        try:
            ficha = FichaClinica.objects.get(id=ficha_id)
        except FichaClinica.DoesNotExist:
            return Response({'erro': 'Ficha clínica não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = FichaClinicaSerializer(ficha, data=request.data, partial=True)

        if not serializer.is_valid():
            return Response({'erro': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        ficha = serializer.save()

        return Response({
            'mensagem': 'Ficha clínica atualizada com sucesso.',
            'ficha': FichaClinicaSerializer(ficha).data,
        }, status=status.HTTP_200_OK)


class AnotacaoView(APIView):
    """
    RF06 - Histórico de alterações da ficha.
    Data, hora e colaborador são registrados automaticamente.

    POST /api/fichas/<ficha_id>/anotacoes/ → Adiciona anotação na ficha
    """
    permission_classes = [IsAuthenticated, IsColaborador]

    def post(self, request, ficha_id):
        try:
            ficha = FichaClinica.objects.get(id=ficha_id)
        except FichaClinica.DoesNotExist:
            return Response({'erro': 'Ficha clínica não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AnotacaoCriarSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({'erro': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        anotacao = Anotacao.objects.create(
            conteudo=serializer.validated_data['conteudo'],
            ficha_clinica=ficha,
            colaborador=request.user,
            data=timezone.localdate(),
            hora=timezone.localtime().time(),
        )

        return Response({
            'mensagem': 'Anotação registrada com sucesso.',
            'anotacao': {
                'id': anotacao.id,
                'conteudo': anotacao.conteudo,
                'data': anotacao.data,
                'hora': anotacao.hora,
                'colaborador': request.user.get_full_name(),
            }
        }, status=status.HTTP_201_CREATED)