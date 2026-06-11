from rest_framework.permissions import BasePermission
from .models import Colaborador


class IsColaborador(BasePermission):
    """
    Permite acesso apenas para usuários autenticados que sejam colaboradores.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and isinstance(request.user, Colaborador)
        )