from django.contrib import admin
from .models import Paciente, Colaborador, Servico, Exercicio, FichaClinica, Anotacao, Sessao, Prescricao, MovimentacaoFinanceira

# Registrando as tabelas Base
admin.site.register(Paciente)
admin.site.register(Colaborador)
admin.site.register(Servico)
admin.site.register(Exercicio)

# Registrando as tabelas Dependentes
admin.site.register(FichaClinica)
admin.site.register(Anotacao)
admin.site.register(Sessao)
admin.site.register(Prescricao)
admin.site.register(MovimentacaoFinanceira)