from datetime import date

from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status

from .models import (
    Usuario,
    Paciente,
    Servico,
    Exercicio,
    FichaClinica,
    Sessao
)


# ==========================================================
# TESTES DOS MODELS
# ==========================================================

class UsuarioTest(TestCase):

    def test_criar_usuario(self):
        usuario = Usuario.objects.create_user(
            email='teste@email.com',
            password='123456',
            first_name='Francisco',
            last_name='Neto'
        )

        self.assertEqual(usuario.email, 'teste@email.com')
        self.assertTrue(usuario.check_password('123456'))


class UsuarioNomeCompletoTest(TestCase):

    def test_nome_completo(self):
        usuario = Usuario.objects.create_user(
            email='teste@email.com',
            password='123456',
            first_name='Francisco',
            last_name='Neto'
        )

        self.assertEqual(
            usuario.get_full_name(),
            'Francisco Neto'
        )


class SuperUsuarioTest(TestCase):

    def test_criar_superusuario(self):
        admin = Usuario.objects.create_superuser(
            email='admin@email.com',
            password='123456',
            first_name='Admin',
            last_name='Sistema'
        )

        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)


class PacienteTest(TestCase):

    def test_criar_paciente(self):

        usuario = Usuario.objects.create_user(
            email='paciente@email.com',
            password='123456',
            first_name='João',
            last_name='Silva'
        )

        paciente = Paciente.objects.create(
            usuario=usuario,
            cpf='123.456.789-00',
            data_nascimento=date(2000, 1, 1)
        )

        self.assertEqual(
            str(paciente),
            'João Silva'
        )


class ServicoTest(TestCase):

    def test_criar_servico(self):

        servico = Servico.objects.create(
            nome='Fisioterapia',
            descricao='Tratamento fisioterapêutico'
        )

        self.assertEqual(
            str(servico),
            'Fisioterapia'
        )


class ExercicioTest(TestCase):

    def test_criar_exercicio(self):

        exercicio = Exercicio.objects.create(
            nome='Alongamento',
            descricao_base='Alongamento cervical'
        )

        self.assertEqual(
            str(exercicio),
            'Alongamento'
        )


# ==========================================================
# TESTES DAS APIS
# ==========================================================

class LoginViewTest(APITestCase):

    def setUp(self):
        self.usuario = Usuario.objects.create_user(
            email='teste@email.com',
            password='123456',
            first_name='Francisco',
            last_name='Neto'
        )

    def test_login_invalido(self):

        response = self.client.post(
            '/api/login/',
            {
                'email': 'teste@email.com',
                'password': 'senha_errada'
            },
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )


class LogoutViewTest(APITestCase):

    def test_logout_sem_login(self):

        response = self.client.post('/api/logout/')

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )


class PerfilPacienteTest(APITestCase):

    def test_perfil_sem_login(self):

        response = self.client.get(
            '/api/paciente/perfil/'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )


class ListaPacientesTest(APITestCase):

    def test_lista_sem_login(self):

        response = self.client.get(
            '/api/pacientes/listar/'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )


class RelatorioTest(APITestCase):

    def test_relatorio_sem_login(self):

        response = self.client.get(
            '/api/relatorio/'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )


class SessaoViewTest(APITestCase):

    def test_sessoes_sem_login(self):

        response = self.client.get(
            '/api/sessoes/'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )


class FichaClinicaViewTest(APITestCase):

    def test_fichas_sem_login(self):

        response = self.client.get(
            '/api/fichas/'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

from rest_framework.authtoken.models import Token
from .models import Colaborador


class CadastroPacienteApiTest(APITestCase):

    def setUp(self):

        usuario = Usuario.objects.create_user(
            email='admin@email.com',
            password='123456',
            first_name='Admin',
            last_name='Sistema'
        )

        Colaborador.objects.create(
            usuario=usuario,
            perfil='admin'
        )

        self.client.force_authenticate(user=usuario)

    def test_cadastrar_paciente(self):

        response = self.client.post(
            '/api/pacientes/cadastrar/',
            {
                'email': 'paciente@email.com',
                'senha': '123456',
                'first_name': 'João',
                'last_name': 'Silva',
                'cpf': '123.456.789-00',
                'data_nascimento': '2000-01-01'
            },
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )


class CadastroColaboradorApiTest(APITestCase):

    def setUp(self):

        usuario = Usuario.objects.create_user(
            email='admin@email.com',
            password='123456',
            first_name='Admin',
            last_name='Sistema'
        )

        Colaborador.objects.create(
            usuario=usuario,
            perfil='admin'
        )

        self.client.force_authenticate(user=usuario)

    def test_cadastrar_colaborador(self):

        response = self.client.post(
            '/api/colaboradores/cadastrar/',
            {
                'email': 'novo@email.com',
                'senha': '123456',
                'first_name': 'Maria',
                'last_name': 'Souza',
                'perfil': 'recepcionista'
            },
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )
class FichaClinicaApiTest(APITestCase):

    def setUp(self):

        admin_user = Usuario.objects.create_user(
            email='admin@email.com',
            password='123456',
            first_name='Admin',
            last_name='Sistema'
        )

        Colaborador.objects.create(
            usuario=admin_user,
            perfil='admin'
        )

        paciente_user = Usuario.objects.create_user(
            email='paciente@email.com',
            password='123456',
            first_name='João',
            last_name='Silva'
        )

        self.paciente = Paciente.objects.create(
            usuario=paciente_user,
            cpf='111.111.111-11',
            data_nascimento='2000-01-01'
        )

        self.client.force_authenticate(user=admin_user)

    def test_criar_ficha(self):

        response = self.client.post(
            '/api/fichas/',
            {
                'paciente': self.paciente.id
            },
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )
from .models import Sessao, Servico


class ConflitoSessaoTest(APITestCase):

    def test_colaborador_nao_pode_ter_duas_sessoes_mesmo_horario(self):

        usuario = Usuario.objects.create_user(
            email='fisio@email.com',
            password='123456',
            first_name='Fisio',
            last_name='Teste'
        )

        colaborador = Colaborador.objects.create(
            usuario=usuario,
            perfil='fisioterapeuta'
        )

        paciente_user = Usuario.objects.create_user(
            email='paciente@email.com',
            password='123456',
            first_name='João',
            last_name='Silva'
        )

        paciente = Paciente.objects.create(
            usuario=paciente_user,
            cpf='999.999.999-99',
            data_nascimento='2000-01-01'
        )

        servico = Servico.objects.create(
            nome='Fisioterapia',
            descricao='Teste'
        )

        Sessao.objects.create(
            data='2026-12-01',
            horario='10:00:00',
            paciente=paciente,
            servico=servico,
            colaborador=colaborador
        )

        from .serializers import SessaoSerializer

        serializer = SessaoSerializer(data={
            'data': '2026-12-01',
            'horario': '10:00:00',
            'paciente': paciente.id,
            'servico': servico.id,
            'colaborador': colaborador.id
        })

        self.assertFalse(serializer.is_valid())

class EmailDuplicadoPacienteTest(APITestCase):

    def test_email_duplicado(self):

        Usuario.objects.create_user(
            email='teste@email.com',
            password='123456',
            first_name='Joao',
            last_name='Silva'
        )

        from .serializers import PacienteCadastroSerializer

        serializer = PacienteCadastroSerializer(data={
            'email': 'teste@email.com',
            'senha': '123456',
            'first_name': 'Maria',
            'last_name': 'Souza',
            'cpf': '111.111.111-11',
            'data_nascimento': '2000-01-01'
        })

        self.assertFalse(serializer.is_valid())

class CpfDuplicadoPacienteTest(APITestCase):

    def test_cpf_duplicado(self):

        usuario = Usuario.objects.create_user(
            email='paciente@email.com',
            password='123456',
            first_name='Joao',
            last_name='Silva'
        )

        Paciente.objects.create(
            usuario=usuario,
            cpf='123.456.789-00',
            data_nascimento='2000-01-01'
        )

        from .serializers import PacienteCadastroSerializer

        serializer = PacienteCadastroSerializer(data={
            'email': 'novo@email.com',
            'senha': '123456',
            'first_name': 'Maria',
            'last_name': 'Souza',
            'cpf': '123.456.789-00',
            'data_nascimento': '2000-01-01'
        })

        self.assertFalse(serializer.is_valid())

class FichaDuplicadaTest(TestCase):

    def test_paciente_nao_pode_ter_duas_fichas(self):

        usuario = Usuario.objects.create_user(
            email='paciente@email.com',
            password='123456',
            first_name='Joao',
            last_name='Silva'
        )

        paciente = Paciente.objects.create(
            usuario=usuario,
            cpf='999.999.999-99',
            data_nascimento='2000-01-01'
        )

        FichaClinica.objects.create(
            paciente=paciente
        )

        from .serializers import FichaClinicaSerializer

        serializer = FichaClinicaSerializer(data={
            'paciente': paciente.id
        })

        self.assertFalse(serializer.is_valid())

class LoginDadosInvalidosTest(APITestCase):

    def test_login_sem_senha(self):

        response = self.client.post(
            '/api/login/',
            {
                'email': 'teste@email.com'
            },
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

class CriarSessaoTest(TestCase):

    def test_criar_sessao(self):

        usuario = Usuario.objects.create_user(
            email='paciente@email.com',
            password='123456',
            first_name='Joao',
            last_name='Silva'
        )

        paciente = Paciente.objects.create(
            usuario=usuario,
            cpf='111.222.333-44',
            data_nascimento='2000-01-01'
        )

        servico = Servico.objects.create(
            nome='Fisioterapia',
            descricao='Tratamento'
        )

        sessao = Sessao.objects.create(
            data='2026-12-01',
            horario='10:00:00',
            paciente=paciente,
            servico=servico
        )

        self.assertEqual(
            sessao.status,
            'Agendado'
        )

class ExercicioComMidiaTest(TestCase):

    def test_exercicio_com_url(self):

        exercicio = Exercicio.objects.create(
            nome='Alongamento',
            descricao_base='Teste',
            url_midia='https://youtube.com/video'
        )

        self.assertEqual(
            exercicio.url_midia,
            'https://youtube.com/video'
        )