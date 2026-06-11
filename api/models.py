from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone


# ------------------------------------------------------------------
# Manager customizado para o Colaborador (necessário para login por email)
# ------------------------------------------------------------------
class ColaboradorManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('O e-mail é obrigatório.')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('perfil', 'admin')
        return self.create_user(email, password, **extra_fields)


# ------------------------------------------------------------------
# Colaborador — substitui o User padrão do Django (RF01)
# ------------------------------------------------------------------
class Colaborador(AbstractUser):
    class Perfil(models.TextChoices):
        ADMIN = 'admin', 'Administrador'
        FISIOTERAPEUTA = 'fisioterapeuta', 'Fisioterapeuta'
        RECEPCIONISTA = 'recepcionista', 'Recepcionista'
        COLABORADOR = 'colaborador', 'Colaborador'

    username = None
    email = models.EmailField(unique=True, verbose_name='E-mail')

    perfil = models.CharField(
        max_length=20,
        choices=Perfil.choices,
        default=Perfil.COLABORADOR,
        verbose_name='Perfil'
    )

    objects = ColaboradorManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = 'Colaborador'
        verbose_name_plural = 'Colaboradores'

    def __str__(self):
        return f'{self.get_full_name()} ({self.email})'


# ------------------------------------------------------------------
# Paciente
# ------------------------------------------------------------------
class Paciente(models.Model):
    nome = models.CharField(max_length=150)
    login = models.CharField(max_length=50, unique=True)
    senha = models.CharField(max_length=255)
    cpf = models.CharField(max_length=14, unique=True)
    data_nascimento = models.DateField()

    def __str__(self):
        return self.nome


# ------------------------------------------------------------------
# Serviço
# ------------------------------------------------------------------
class Servico(models.Model):
    nome = models.CharField(max_length=100)
    descricao = models.TextField()
    info_relevantes = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nome


# ------------------------------------------------------------------
# Exercício
# ------------------------------------------------------------------
class Exercicio(models.Model):
    nome = models.CharField(max_length=100)
    descricao_base = models.TextField()
    url_midia = models.URLField(max_length=200, blank=True, null=True)

    def __str__(self):
        return self.nome


# ------------------------------------------------------------------
# Ficha Clínica
# ------------------------------------------------------------------
class FichaClinica(models.Model):
    data_criacao = models.DateField(default=timezone.now)
    paciente = models.OneToOneField(Paciente, on_delete=models.CASCADE)

    def __str__(self):
        return f"Ficha Clínica de {self.paciente.nome}"


# ------------------------------------------------------------------
# Anotação
# ------------------------------------------------------------------
class Anotacao(models.Model):
    conteudo = models.TextField()
    data = models.DateField(default=timezone.now)
    hora = models.TimeField(default=timezone.now)
    ficha_clinica = models.ForeignKey(FichaClinica, on_delete=models.CASCADE)
    colaborador = models.ForeignKey(Colaborador, on_delete=models.PROTECT)


# ------------------------------------------------------------------
# Sessão de atendimento
# ------------------------------------------------------------------
class Sessao(models.Model):
    data = models.DateField()
    horario = models.TimeField()
    status = models.CharField(max_length=50, default='Agendado')
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    servico = models.ForeignKey(Servico, on_delete=models.PROTECT)
    colaborador = models.ForeignKey(Colaborador, on_delete=models.SET_NULL, null=True, blank=True)


# ------------------------------------------------------------------
# Prescrição
# ------------------------------------------------------------------
class Prescricao(models.Model):
    series = models.IntegerField()
    repeticoes = models.IntegerField()
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    exercicios = models.ManyToManyField(Exercicio)


# ------------------------------------------------------------------
# Movimentação Financeira
# ------------------------------------------------------------------
class MovimentacaoFinanceira(models.Model):
    tipo_transacao = models.CharField(max_length=50)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data_movimentacao = models.DateField(default=timezone.now)
    colaborador = models.ForeignKey(Colaborador, on_delete=models.PROTECT)
    servico = models.ForeignKey(Servico, on_delete=models.SET_NULL, null=True, blank=True)