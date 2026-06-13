from django.shortcuts import get_object_or_404
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
    AnotacaoCriarSerializer
)

class LoginView(APIView):
    """
    RF01/RF02 - Login unificado para colaboradores e pacientes.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'erro': serializer.errors},
                status=status.HTTP_401_UNAUTHORIZED
            )

        usuario = serializer.validated_data['usuario']
        token, _ = Token.objects.get_or_create(user=usuario)

        response = {
            'token': token.key,
            'tipo': 'paciente' if hasattr(usuario, 'paciente') else 'colaborador',
            'nome': usuario.get_full_name(),
            'email': usuario.email,
        }

        if hasattr(usuario, 'colaborador'):
            response['perfil'] = usuario.colaborador.perfil

        return Response(response, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    Invalida o token do usuário autenticado.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.auth:
            request.auth.delete()
        return Response(
            {'mensagem': 'Logout realizado com sucesso.'},
            status=status.HTTP_200_OK
        )


class PacienteCadastroView(APIView):
    """
    RF04 - Cadastro de Paciente.
    Apenas colaboradores autenticados podem cadastrar pacientes.
    """
    permission_classes = [IsAuthenticated, IsColaborador]

    def post(self, request):
        serializer = PacienteCadastroSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'erro': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        paciente = serializer.save()

        return Response({
            'mensagem': 'Paciente cadastrado com sucesso.',
            'paciente': {
                'id': paciente.id,
                'nome': paciente.usuario.get_full_name(),
                'email': paciente.usuario.email,
                'cpf': paciente.cpf,
                'data_nascimento': paciente.data_nascimento,
            }
        }, status=status.HTTP_201_CREATED)


class ColaboradorCadastroView(APIView):
    """
    RF - Cadastro de Colaborador.
    Apenas colaboradores autenticados e com perfil 'admin' podem cadastrar novos colaboradores.
    """
    permission_classes = [IsAuthenticated, IsColaborador]

    def post(self, request):
        # Verifica se o colaborador logado tem o perfil de administrador
        if request.user.colaborador.perfil != 'admin':
            return Response(
                {"erro": "Acesso negado. Apenas administradores podem cadastrar novos colaboradores."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ColaboradorCadastroSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'erro': serializer.errors}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        colaborador = serializer.save()

        return Response({
            'mensagem': 'Colaborador cadastrado com sucesso.',
            'colaborador': {
                'id': colaborador.id,
                'nome': colaborador.usuario.get_full_name(),
                'email': colaborador.usuario.email,
                'perfil': colaborador.perfil,
            }
        }, status=status.HTTP_201_CREATED)


# ------------------------------------------------------------------
# NOVO: FICHA CLÍNICA E ANOTAÇÕES
# ------------------------------------------------------------------

class FichaClinicaView(APIView):
    """
    Gerencia a listagem e criação de Fichas Clínicas.
    Apenas colaboradores autenticados.
    """
    permission_classes = [IsAuthenticated, IsColaborador]

    def get(self, request):
        fichas = FichaClinica.objects.all()
        serializer = FichaClinicaSerializer(fichas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = FichaClinicaSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'erro': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        ficha = serializer.save()

        return Response({
            'mensagem': 'Ficha Clínica criada com sucesso.',
            'ficha': FichaClinicaSerializer(ficha).data
        }, status=status.HTTP_201_CREATED)


class AnotacaoCriarView(APIView):
    """
    Adiciona uma nova anotação a uma Ficha Clínica específica.
    Apenas colaboradores autenticados. O colaborador é vinculado automaticamente.
    """
    permission_classes = [IsAuthenticated, IsColaborador]

    def post(self, request, ficha_id):
        # Garante que a ficha existe, senão retorna erro 404 automático
        ficha = get_object_or_404(FichaClinica, id=ficha_id)
        
        serializer = AnotacaoCriarSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'erro': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Passamos a ficha e o colaborador logado direto no .save()
        anotacao = serializer.save(
            ficha_clinica=ficha,
            colaborador=request.user.colaborador
        )

        return Response({
            'mensagem': 'Anotação adicionada com sucesso.',
            'anotacao': {
                'id': anotacao.id,
                'conteudo': anotacao.conteudo,
                'data': anotacao.data,
                'hora': anotacao.hora,
                'colaborador_nome': request.user.get_full_name()
            }
        }, status=status.HTTP_201_CREATED)