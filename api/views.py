from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated

from .serializers import LoginSerializer


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