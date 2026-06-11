from rest_framework.permissions import BasePermission


class IsColaborador(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, 'colaborador')
        )


class IsPaciente(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, 'paciente')
        )