from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from .permissions import IsColaborador

from .serializers import LoginSerializer, PacienteCadastroSerializer


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