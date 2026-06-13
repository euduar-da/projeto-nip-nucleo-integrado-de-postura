from django.urls import path
from .views import LoginView, LogoutView, PacienteCadastroView, ColaboradorCadastroView, FichaClinicaView, AnotacaoCriarView
from .views import LoginView, LogoutView, PacienteCadastroView, ColaboradorCadastroView, PacientePerfilView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('pacientes/cadastrar/', PacienteCadastroView.as_view(), name='cadastrar-paciente'),
    path('colaboradores/cadastrar/', ColaboradorCadastroView.as_view(), name='cadastrar-colaborador'),
    path('fichas/', FichaClinicaView.as_view(), name='fichas-clinicas'),
    path('fichas/<int:ficha_id>/anotacoes/', AnotacaoCriarView.as_view(), name='criar-anotacao'),
    path('paciente/perfil/', PacientePerfilView.as_view(), name='paciente-perfil'),
]