from django.db import models
from django.utils import timezone

# PARTE 1: Tabelas Independentes

class Paciente(models.Model):
    nome = models.CharField(max_length=150)
    login = models.CharField(max_length=50, unique=True)
    senha = models.CharField(max_length=255)
    # Mantidos por causa da Regra de Negócio RN-01:
    cpf = models.CharField(max_length=14, unique=True) 
    data_nascimento = models.DateField()

    def __str__(self):
        return self.nome

class Colaborador(models.Model):
    nome = models.CharField(max_length=150)
    login = models.CharField(max_length=50, unique=True)
    senha = models.CharField(max_length=255)
    perfil = models.CharField(max_length=50) # Ex: 'FISIOTERAPEUTA'

    def __str__(self):
        return self.nome

class Servico(models.Model):
    nome = models.CharField(max_length=100)
    descricao = models.TextField()
    info_relevantes = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nome

class Exercicio(models.Model):
    nome = models.CharField(max_length=100)
    descricao_base = models.TextField()
    url_midia = models.URLField(max_length=200, blank=True, null=True)

    def __str__(self):
        return self.nome
    
    # PARTE 2: Tabelas Dependentes (Com Chaves Estrangeiras e Relacionamentos)

class FichaClinica(models.Model):
    data_criacao = models.DateField(default=timezone.now)
    # Relação 1:1 com Paciente (O diamante 'POSSUI')
    paciente = models.OneToOneField(Paciente, on_delete=models.CASCADE)

    def __str__(self):
        return f"Ficha Clínica de {self.paciente.nome}"

class Anotacao(models.Model):
    conteudo = models.TextField()
    data = models.DateField(default=timezone.now)
    hora = models.TimeField(default=timezone.now)
    # Relações N:1 (Os diamantes 'CONTEM' e 'REGISTRA')
    ficha_clinica = models.ForeignKey(FichaClinica, on_delete=models.CASCADE)
    colaborador = models.ForeignKey(Colaborador, on_delete=models.PROTECT)

class Sessao(models.Model):
    data = models.DateField()
    horario = models.TimeField()
    status = models.CharField(max_length=50, default='Agendado')
    # Relações N:1 (Os diamantes 'AGENDAR', 'REFERE-SE' e 'ATENDE')
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    servico = models.ForeignKey(Servico, on_delete=models.PROTECT)
    colaborador = models.ForeignKey(Colaborador, on_delete=models.SET_NULL, null=True, blank=True)

class Prescricao(models.Model):
    series = models.IntegerField()
    repeticoes = models.IntegerField()
    # Relação N:1 com Paciente (O diamante 'RECEBE')
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    # Relação N:M com Exercício (O diamante 'COMPOE')
    exercicios = models.ManyToManyField(Exercicio)

class MovimentacaoFinanceira(models.Model):
    tipo_transacao = models.CharField(max_length=50)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data_movimentacao = models.DateField(default=timezone.now)
    # Relações N:1 (Os diamantes 'EFETUA' e 'GERA')
    colaborador = models.ForeignKey(Colaborador, on_delete=models.PROTECT)
    servico = models.ForeignKey(Servico, on_delete=models.SET_NULL, null=True, blank=True)