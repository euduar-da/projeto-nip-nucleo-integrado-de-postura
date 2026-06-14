from django.urls import path
from .views import ColaboradorListView, LoginView, LogoutView, PacienteCadastroView, ColaboradorCadastroView, FichaClinicaView, AnotacaoCriarView, PacienteListView, PacientePerfilView, SessaoView, ServicoListView, RelatorioView, MovimentacaoFinanceiraView 


urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('pacientes/cadastrar/', PacienteCadastroView.as_view(), name='cadastrar-paciente'),
    path('colaboradores/cadastrar/', ColaboradorCadastroView.as_view(), name='cadastrar-colaborador'),
    path('fichas/', FichaClinicaView.as_view(), name='fichas-clinicas'),
    path('fichas/<int:ficha_id>/anotacoes/', AnotacaoCriarView.as_view(), name='criar-anotacao'),
    path('paciente/perfil/', PacientePerfilView.as_view(), name='paciente-perfil'),
    path('pacientes/listar/', PacienteListView.as_view(), name='listar-pacientes'),
    path('colaboradores/listar/', ColaboradorListView.as_view(), name='listar-colaboradores'),
    path('sessoes/', SessaoView.as_view(), name='agendamentos'),
    path('servicos/', ServicoListView.as_view(), name='listar-servicos'),
    path('relatorio/', RelatorioView.as_view(), name='relatorio'),
    path('movimentacoes/', MovimentacaoFinanceiraView.as_view(), name='cadastrar-movimentacao'),
]