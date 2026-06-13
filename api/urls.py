from django.urls import path
from .views import (
    LoginView,
    LogoutView,
    PacienteCadastroView,
    ColaboradorCadastroView,
    FichaClinicaView,
    AnotacaoView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('pacientes/cadastrar/', PacienteCadastroView.as_view(), name='cadastrar-paciente'),
    path('colaboradores/cadastrar/', ColaboradorCadastroView.as_view(), name='cadastrar-colaborador'),

    
    path('fichas/', FichaClinicaView.as_view(), name='criar-ficha'),
    path('fichas/<int:ficha_id>/', FichaClinicaView.as_view(), name='detalhe-ficha'),
    path('fichas/<int:ficha_id>/anotacoes/', AnotacaoView.as_view(), name='anotacao-ficha'),
]