from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated

from .permissions import IsColaborador
from .models import FichaClinica, Anotacao, Paciente, Colaborador, Sessao, Servico
from .serializers import (
    LoginSerializer, 
    PacienteCadastroSerializer, 
    ColaboradorCadastroSerializer,
    FichaClinicaSerializer,
    AnotacaoCriarSerializer,
    PacienteListSerializer,
    SessaoSerializer,
    ServicoListSerializer,

)
from .models import MovimentacaoFinanceira
from django.db.models import Sum, Q
from decimal import Decimal

class LoginView(APIView):
    """
    RF01/RF02 - Login unificado para colaboradores e pacientes.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'erro': serializer.errors},
                status=status.HTTP_401_UNAUTHORIZED
            )

        usuario = serializer.validated_data['usuario']
        token, _ = Token.objects.get_or_create(user=usuario)

        response = {
            'token': token.key,
            'tipo': 'paciente' if hasattr(usuario, 'paciente') else 'colaborador',
            'nome': usuario.get_full_name(),
            'email': usuario.email,
        }

        if hasattr(usuario, 'colaborador'):
            response['perfil'] = usuario.colaborador.perfil

        return Response(response, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    Invalida o token do usuário autenticado.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.auth:
            request.auth.delete()
        return Response(
            {'mensagem': 'Logout realizado com sucesso.'},
            status=status.HTTP_200_OK
        )


class PacienteCadastroView(APIView):
    """
    RF04 - Cadastro de Paciente.
    Apenas colaboradores autenticados podem cadastrar pacientes.
    """
    permission_classes = [IsAuthenticated, IsColaborador]

    def post(self, request):
        serializer = PacienteCadastroSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'erro': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        paciente = serializer.save()

        return Response({
            'mensagem': 'Paciente cadastrado com sucesso.',
            'paciente': {
                'id': paciente.id,
                'nome': paciente.usuario.get_full_name(),
                'email': paciente.usuario.email,
                'cpf': paciente.cpf,
                'data_nascimento': paciente.data_nascimento,
            }
        }, status=status.HTTP_201_CREATED)


class ColaboradorCadastroView(APIView):
    permission_classes = [IsAuthenticated, IsColaborador]

    def post(self, request):
        serializer = ColaboradorCadastroSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'erro': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        colaborador = serializer.save()

        return Response({
            'mensagem': 'Colaborador cadastrado com sucesso.',
            'colaborador': {
                'id': colaborador.id,
                'nome': colaborador.usuario.get_full_name(),
                'email': colaborador.usuario.email,
                'perfil': colaborador.perfil,
            }
        }, status=status.HTTP_201_CREATED)


# ------------------------------------------------------------------
# NOVO: FICHA CLÍNICA E ANOTAÇÕES
# ------------------------------------------------------------------

class FichaClinicaView(APIView):
    """
    Gerencia a listagem e criação de Fichas Clínicas.
    Apenas colaboradores autenticados.
    """
    permission_classes = [IsAuthenticated, IsColaborador]

    def get(self, request):
        fichas = FichaClinica.objects.all()
        serializer = FichaClinicaSerializer(fichas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = FichaClinicaSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'erro': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        ficha = serializer.save()

        return Response({
            'mensagem': 'Ficha Clínica criada com sucesso.',
            'ficha': FichaClinicaSerializer(ficha).data
        }, status=status.HTTP_201_CREATED)


class AnotacaoCriarView(APIView):
    """
    Adiciona uma nova anotação a uma Ficha Clínica específica.
    Apenas colaboradores autenticados. O colaborador é vinculado automaticamente.
    """
    permission_classes = [IsAuthenticated, IsColaborador]

    def post(self, request, ficha_id):
        # Garante que a ficha existe, senão retorna erro 404 automático
        ficha = get_object_or_404(FichaClinica, id=ficha_id)
        
        serializer = AnotacaoCriarSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'erro': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Passamos a ficha e o colaborador logado direto no .save()
        anotacao = serializer.save(
            ficha_clinica=ficha,
            colaborador=request.user.colaborador
        )

        return Response({
            'mensagem': 'Anotação adicionada com sucesso.',
            'anotacao': {
                'id': anotacao.id,
                'conteudo': anotacao.conteudo,
                'data': anotacao.data,
                'hora': anotacao.hora,
                'colaborador_nome': request.user.get_full_name()
            }
        }, status=status.HTTP_201_CREATED)
    
class PacientePerfilView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            paciente = request.user.paciente
            return Response({
                'nome': request.user.get_full_name(),
                'email': request.user.email,
                'cpf': paciente.cpf,
                'data_nascimento': paciente.data_nascimento,
            }, status=status.HTTP_200_OK)
        except:
            return Response({'erro': 'Paciente não encontrado.'}, status=404)
        
class PacienteListView(APIView):
    """
    Lista todos os pacientes. Apenas colaboradores autenticados.
    """
    permission_classes = [IsAuthenticated, IsColaborador]

    def get(self, request):
        pacientes = Paciente.objects.select_related('usuario').all()
        serializer = PacienteListSerializer(pacientes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ColaboradorListView(APIView):
    permission_classes = [IsAuthenticated, IsColaborador]

    def get(self, request):
        colaboradores = Colaborador.objects.select_related('usuario').all()
        data = [{
            'id': c.id,
            'nome': c.usuario.get_full_name(),
            'email': c.usuario.email,
            'perfil': c.perfil,
        } for c in colaboradores]
        return Response(data, status=status.HTTP_200_OK)
    
    # ------------------------------------------------------------------
# NOVO: AGENDAMENTO DE SESSÕES
# ------------------------------------------------------------------

class SessaoView(APIView):
    """
    Gerencia a listagem da agenda e a marcação de novas Sessões.
    Pacientes só podem ver e agendar para si mesmos.
    Colaboradores têm acesso total.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Se quem está logado é um Paciente, filtramos para mostrar SÓ as sessões dele
        if hasattr(request.user, 'paciente'):
            sessoes = Sessao.objects.filter(paciente=request.user.paciente).order_by('data', 'horario')
        # Se for um Colaborador, traz a agenda inteira da clínica
        else:
            sessoes = Sessao.objects.all().order_by('data', 'horario')
            
        serializer = SessaoSerializer(sessoes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # Usamos o .copy() para o Django nos deixar alterar os dados do JSON
        dados = request.data.copy()

        # TRAVA DE SEGURANÇA: Força o ID do paciente logado, ignorando o que vier no JSON
        if hasattr(request.user, 'paciente'):
            dados['paciente'] = request.user.paciente.id

        serializer = SessaoSerializer(data=dados)

        if not serializer.is_valid():
            return Response(
                {'erro': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        sessao = serializer.save()

        return Response({
            'mensagem': 'Sessão agendada com sucesso.',
            'sessao': SessaoSerializer(sessao).data
        }, status=status.HTTP_201_CREATED)
    
class ServicoListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        servicos = Servico.objects.all().order_by('nome')
        serializer = ServicoListSerializer(servicos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RelatorioView(APIView):
    """
    Retorna um relatório financeiro simples com total de entradas, saídas e lucro líquido.
    Apenas colaboradores autenticados têm acesso.
    Parâmetros query opcionais: `start` (YYYY-MM-DD), `end` (YYYY-MM-DD).
    """
    permission_classes = [IsAuthenticated, IsColaborador]

    def get(self, request):
        movimentos = MovimentacaoFinanceira.objects.all()

        # filtros opcionais por data
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        if start:
            movimentos = movimentos.filter(data_movimentacao__gte=start)
        if end:
            movimentos = movimentos.filter(data_movimentacao__lte=end)

        entrada_q = Q(tipo_transacao__icontains='entrada') | Q(tipo_transacao__icontains='receita') | Q(tipo_transacao__icontains='credito')
        saida_q = Q(tipo_transacao__icontains='saida') | Q(tipo_transacao__icontains='despesa') | Q(tipo_transacao__icontains='debito')

        total_entrada = movimentos.filter(entrada_q).aggregate(total=Sum('valor'))['total'] or Decimal('0.00')
        total_saida = movimentos.filter(saida_q).aggregate(total=Sum('valor'))['total'] or Decimal('0.00')

        lucro = (total_entrada or Decimal('0.00')) - (total_saida or Decimal('0.00'))

        # Serializar como string com duas casas decimais para evitar problemas JSON
        response = {
            'total_entrada': f"{total_entrada:.2f}",
            'total_saida': f"{total_saida:.2f}",
            'lucro_liquido': f"{lucro:.2f}",
        }

        return Response(response, status=status.HTTP_200_OK)
