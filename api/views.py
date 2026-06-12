from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from .permissions import IsColaborador

from .serializers import LoginSerializer, PacienteCadastroSerializer, ColaboradorCadastroSerializer


class LoginView(APIView):
    """
    RF01 - Login de Colaborador.
    Endpoint público — não exige autenticação prévia.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'erro': serializer.errors},
                status=status.HTTP_401_UNAUTHORIZED
            )

        colaborador = serializer.validated_data['colaborador']
        token, _ = Token.objects.get_or_create(user=colaborador)

        return Response({
            'token': token.key,
            'perfil': colaborador.perfil,
            'nome': colaborador.get_full_name(),
            'email': colaborador.email,
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    Invalida o token do colaborador autenticado.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.auth:
            request.auth.delete()
        return Response({'mensagem': 'Logout realizado com sucesso.'}, status=status.HTTP_200_OK)


class PacienteCadastroView(APIView):
    """
    RF02 - Cadastro de Paciente.
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
                'nome': paciente.nome,
                'login': paciente.login,
                'cpf': paciente.cpf,
                'data_nascimento': paciente.data_nascimento,
            }
        }, status=status.HTTP_201_CREATED)


class ColaboradorCadastroView(APIView):
    """
    RF - Cadastro de Colaborador.
    Apenas colaboradores autenticados podem cadastrar novos colaboradores.
    """
    permission_classes = [IsAuthenticated, IsColaborador]

    def post(self, request):
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
                'nome': colaborador.get_full_name(),
                'email': colaborador.email,
                'perfil': colaborador.perfil,
            }
        }, status=status.HTTP_201_CREATED)