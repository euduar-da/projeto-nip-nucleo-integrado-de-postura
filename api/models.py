from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


# ------------------------------------------------------------------
# Manager base de autenticação
# ------------------------------------------------------------------
class UsuarioManager(BaseUserManager):
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
        return self.create_user(email, password, **extra_fields)


# ------------------------------------------------------------------
# Usuario — model base de autenticação (AUTH_USER_MODEL)
# ------------------------------------------------------------------
class Usuario(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, verbose_name='E-mail')
    first_name = models.CharField(max_length=150, verbose_name='Nome')
    last_name = models.CharField(max_length=150, verbose_name='Sobrenome')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UsuarioManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    def __str__(self):
        return self.email

    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'


# ------------------------------------------------------------------
# Colaborador
# ------------------------------------------------------------------
class Colaborador(models.Model):
    class Perfil(models.TextChoices):
        ADMIN = 'admin', 'Administrador'
        FISIOTERAPEUTA = 'fisioterapeuta', 'Fisioterapeuta'
        RECEPCIONISTA = 'recepcionista', 'Recepcionista'
        COLABORADOR = 'colaborador', 'Colaborador'

    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name='colaborador'
    )
    perfil = models.CharField(
        max_length=20,
        choices=Perfil.choices,
        default=Perfil.COLABORADOR,
        verbose_name='Perfil'
    )

    def __str__(self):
        return f'{self.usuario.get_full_name()} ({self.perfil})'

    class Meta:
        verbose_name = 'Colaborador'
        verbose_name_plural = 'Colaboradores'


# ------------------------------------------------------------------
# Paciente
# ------------------------------------------------------------------
class Paciente(models.Model):
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name='paciente'
    )
    cpf = models.CharField(max_length=14, unique=True)
    data_nascimento = models.DateField()

    def __str__(self):
        return self.usuario.get_full_name()

    class Meta:
        verbose_name = 'Paciente'
        verbose_name_plural = 'Pacientes'


# ------------------------------------------------------------------
# Serviço
# ------------------------------------------------------------------
class Servico(models.Model):
    nome = models.CharField(max_length=100)
    descricao = models.TextField()
    info_relevantes = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = 'Serviço'
        verbose_name_plural = 'Serviços'


# ------------------------------------------------------------------
# Exercício
# ------------------------------------------------------------------
class Exercicio(models.Model):
    nome = models.CharField(max_length=100)
    descricao_base = models.TextField()
    url_midia = models.URLField(max_length=200, blank=True, null=True)

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = 'Exercício'
        verbose_name_plural = 'Exercícios'


# ------------------------------------------------------------------
# Ficha Clínica
# ------------------------------------------------------------------
class FichaClinica(models.Model):
    data_criacao = models.DateField(default=timezone.now)
    paciente = models.OneToOneField(Paciente, on_delete=models.CASCADE)

    def __str__(self):
        return f'Ficha Clínica de {self.paciente.usuario.get_full_name()}'

    class Meta:
        verbose_name = 'Ficha Clínica'
        verbose_name_plural = 'Fichas Clínicas'


# ------------------------------------------------------------------
# Anotação
# ------------------------------------------------------------------
class Anotacao(models.Model):
    conteudo = models.TextField()
    data = models.DateField(default=timezone.now)
    hora = models.TimeField(default=timezone.now)
    ficha_clinica = models.ForeignKey(FichaClinica, on_delete=models.CASCADE)
    colaborador = models.ForeignKey(Colaborador, on_delete=models.PROTECT)

    class Meta:
        verbose_name = 'Anotação'
        verbose_name_plural = 'Anotações'
        ordering = ['data', 'hora']


# ------------------------------------------------------------------
# Sessão de atendimento
# ------------------------------------------------------------------
class Sessao(models.Model):
    data = models.DateField()
    horario = models.TimeField()
    status = models.CharField(max_length=50, default='Agendado')
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    servico = models.ForeignKey(Servico, on_delete=models.PROTECT)
    colaborador = models.ForeignKey(
        Colaborador,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = 'Sessão'
        verbose_name_plural = 'Sessões'


# ------------------------------------------------------------------
# Prescrição
# ------------------------------------------------------------------
class Prescricao(models.Model):
    series = models.IntegerField()
    repeticoes = models.IntegerField()
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    exercicios = models.ManyToManyField(Exercicio)

    class Meta:
        verbose_name = 'Prescrição'
        verbose_name_plural = 'Prescrições'


# ------------------------------------------------------------------
# Movimentação Financeira
# ------------------------------------------------------------------
class MovimentacaoFinanceira(models.Model):
    tipo_transacao = models.CharField(max_length=50)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data_movimentacao = models.DateField(default=timezone.now)
    colaborador = models.ForeignKey(Colaborador, on_delete=models.PROTECT)
    servico = models.ForeignKey(
        Servico,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = 'Movimentação Financeira'
        verbose_name_plural = 'Movimentações Financeiras'