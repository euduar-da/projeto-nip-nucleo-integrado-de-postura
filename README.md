# NIP System - Núcleo Integrado de Postura

## 📋 Sobre o Projeto

O **NIP System** é uma plataforma web desenvolvida para modernizar e centralizar os processos administrativos e clínicos da **NIP – Núcleo Integrado de Postura**, substituindo métodos manuais por uma solução digital segura, eficiente e acessível.

O sistema foi desenvolvido como projeto da disciplina de **Engenharia de Software** da Universidade Federal Rural do Semi-Árido (UFERSA), visando melhorar a organização interna da clínica e proporcionar uma melhor experiência para colaboradores e pacientes.

---

## 🎯 Objetivo do Sistema

Desenvolver uma plataforma digital capaz de:

- Centralizar informações clínicas e administrativas;
- Automatizar processos de agendamento;
- Digitalizar fichas de pacientes;
- Disponibilizar exercícios prescritos online;
- Auxiliar no controle financeiro da clínica;
- Melhorar a comunicação entre pacientes e colaboradores.

---

## 🚨 Problema Identificado

Atualmente a clínica realiza diversos processos manualmente, ocasionando:

- Agendamentos em papel ou por telefone;
- Risco de perda de fichas clínicas físicas;
- Dificuldade de acesso ao histórico dos pacientes;
- Controle financeiro descentralizado;
- Falta de um ambiente digital para exercícios prescritos;
- Ausência de uma vitrine digital dos serviços oferecidos.

Esses problemas geram retrabalho, aumentam a possibilidade de erros e dificultam a gestão da clínica.

---

## ✨ Principais Funcionalidades

### 👤 Gestão de Usuários

- Login de colaboradores;
- Login de pacientes;
- Cadastro de colaboradores;
- Cadastro de pacientes;
- Controle de acesso por perfil.

### 📅 Gestão de Agendamentos

- Agendamento de sessões pelos pacientes;
- Visualização de horários disponíveis;
- Bloqueio automático de horários ocupados;
- Consulta dos agendamentos pelos colaboradores.

### 📄 Gestão de Fichas Clínicas

- Criação de fichas clínicas;
- Consulta de histórico do paciente;
- Atualização das informações clínicas;

### 📝 Evolução Clínica

- Registro de anotações clínicas;
- Histórico permanente das evoluções;
- Controle de autoria e data das anotações.

### 🏋️ Exercícios para Casa

- Visualização de exercícios prescritos;
- Exibição de imagens e vídeos explicativos;
- Informações sobre séries e repetições.

### 💰 Relatórios Financeiros

- Geração de relatórios por período;
- Consulta de movimentações financeiras.

### 🏥 Serviços da Clínica

- Catálogo de serviços;
- Informações detalhadas sobre cada atendimento;
- Redirecionamento para agendamento.

---

## 🛠️ Tecnologias Utilizadas

### Front-end

- React
- TypeScript
- Vite
- Tailwind CSS

### Back-end

- Python
- Django
- Django REST Framework

### Banco de Dados

- PostgreSQL

### Controle de Versão

- Git
- GitHub



---

## 📂 Estrutura do Projeto


---

## 🔄 Fluxo Básico de Funcionamento

1. O usuário realiza login no sistema;
2. O sistema identifica seu perfil (Paciente ou Colaborador);
3. O usuário é redirecionado para o painel correspondente;
4. Dependendo do perfil, poderá:
   - Agendar sessões;
   - Consultar serviços;
   - Visualizar exercícios;
   - Gerenciar fichas clínicas;
   - Registrar anotações;
   - Gerar relatórios financeiros.

---

## 🔐 Requisitos Não Funcionais

- Autenticação segura;
- Senhas criptografadas com hash;
- Responsividade para dispositivos móveis e desktops;
- Integridade dos dados;
- Disponibilidade mínima de 99%.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

- Python 3.12+
- Node.js 20+
- PostgreSQL
- Git

### 1. Clonar o Repositório

```bash
git clone https://github.com/SEU-USUARIO/projeto-nip.git

cd projeto-nip
```

### 2. Configurar o Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux
source venv/bin/activate

pip install -r requirements.txt
```

Configure as variáveis de ambiente e o banco PostgreSQL.

Execute as migrações:

```bash
python manage.py migrate
```

Inicie o servidor:

```bash
python manage.py runserver
```

### 3. Configurar o Frontend

```bash
cd frontend

npm install

npm run dev
```

---

## 📌 Backlog do MVP

| Funcionalidade | Prioridade | Status |
|---------------|------------|---------|
| Login de usuários | Alta | ✅ Implementado |
| Cadastro de usuários | Alta | ✅ Implementado |
| Agendamento de sessões | Alta | ✅ Implementado |
| Fichas clínicas | Alta | ✅ Implementado |
| Anotações clínicas | Alta | ✅ Implementado |
| Exercícios para casa | Média | ✅ Implementado |
| Relatórios financeiros | Baixa | 🚧 Em desenvolvimento |
| Catálogo de serviços | Baixa | ✅ Implementado |


---

## 📊 Status Atual do Desenvolvimento

🚧 **MVP em desenvolvimento**

### Funcionalidades já iniciadas

- Sistema de autenticação;
- Estrutura inicial do banco de dados;
- API REST com Django;
- Interface Web em React;
- Controle de usuários;
- Implementação de relatórios financeiros;
- Integração Front-end e Back-end.

### Próximas Etapas

- Finalizar módulo de agendamentos;
- Finalizar gerenciamento de fichas clínicas;
- Implementar exercícios prescritos;
- Concluir catálogo de serviços;
- Executar testes de integração;
- Preparar versão final do MVP.

---

## 📚 Disciplina

**PEX0162 - Engenharia de Software**

**Professora:** Huliane Medeiros da Silva

**Universidade Federal Rural do Semi-Árido (UFERSA)**

**Centro Multidisciplinar de Pau dos Ferros**

**Ano:** 2026

---


## 👥 Equipe

- Maria Eduarda da Silva Souza
- Francisco Daniel Costa de Souza
- Francisco Porfírio de Oliveira Neto
- Janieli Tainar da Silva

---