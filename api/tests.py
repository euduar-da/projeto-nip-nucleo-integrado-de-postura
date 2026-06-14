from datetime import date

from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status

from .models import (
    Usuario,
    Paciente,
    Servico,
    Exercicio
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