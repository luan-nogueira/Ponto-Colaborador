# Sistema de Ponto Inteligente - Guia de Uso

## 📋 Visão Geral

O **Sistema de Ponto Inteligente** é uma plataforma web elegante e completa para controle de ponto eletrônico, com painéis distintos para colaboradores e gestores.

## 🚀 Como Começar

### 1. Acesso ao Sistema
- Acesse a URL do projeto
- Faça login com sua conta Manus OAuth
- O sistema reconhecerá automaticamente seu role (colaborador ou gestor/admin)

### 2. Painéis Disponíveis

#### **Painel do Colaborador**
Funcionalidades principais:
- **Visão Geral**: Dashboard com resumo do dia (status atual, horas trabalhadas)
- **Registrar**: Registro de ponto com geolocalização automática
- **Histórico**: Listagem de registros com filtros por data
- **Resumo**: Estatísticas mensais (dias trabalhados, atrasos, faltas)
- **Justificativas**: Solicitar ajuste de registro com descrição

#### **Painel do Gestor**
Funcionalidades principais:
- **Visão Geral**: Dashboard com métricas gerais (presentes, ausentes, atrasados)
- **Equipe**: Gestão de colaboradores com busca e filtros
- **Registros**: Visualização em tempo real com auto-refresh
- **Justificativas**: Análise e aprovação/rejeição de solicitações
- **Relatórios**: Geração de relatórios com filtros e exportação
- **Mapa**: Visualização de localização dos registros no mapa
- **Configurações**: Horários, tolerâncias e geofencing

## 🎯 Fluxos Principais

### Registro de Ponto (Colaborador)

1. Clique em **"Registrar"** na aba superior
2. O sistema solicitará permissão para acessar sua localização
3. Selecione o tipo de registro:
   - ✓ **Entrada**: Início do expediente
   - ⏸ **Intervalo**: Início do intervalo
   - ▶ **Retorno**: Fim do intervalo
   - ✕ **Saída**: Fim do expediente
4. Confirme o registro
5. A geolocalização será capturada automaticamente

**Validação de Sequência:**
- Entrada → Intervalo → Retorno → Saída
- O sistema valida automaticamente a sequência correta

### Solicitar Justificativa (Colaborador)

1. Acesse a aba **"Resumo"** ou **"Justificativas"**
2. Clique em **"Nova Justificativa"**
3. Preencha:
   - Tipo: Atraso, Esquecimento de Ponto, Saída Antecipada, etc.
   - Descrição: Explique o motivo
   - Data do Evento: Quando ocorreu
4. Envie para análise do gestor

### Aprovar Justificativa (Gestor)

1. Acesse a aba **"Justificativas"** no painel do gestor
2. Visualize solicitações pendentes
3. Clique em **"Analisar"** para expandir
4. Adicione um comentário (opcional)
5. Clique em **"Aprovar"** ou **"Rejeitar"**

### Gerar Relatório (Gestor)

1. Acesse a aba **"Relatórios"**
2. Selecione o período (data início e fim)
3. Clique em **"Gerar Relatório"**
4. Visualize as métricas:
   - Total de Registros
   - Dias Trabalhados
   - Atrasos
   - Faltas
5. Exporte em **PDF** ou **Excel** (opcional)

### Configurar Empresa (Gestor)

1. Acesse a aba **"Configurações"**
2. Configure:
   - **Horários**: Hora de entrada e saída padrão
   - **Tolerâncias**: Minutos permitidos de atraso
   - **Intervalo**: Duração padrão do intervalo
   - **Geofencing**: Raio permitido para registro (metros)
3. Clique em **"Salvar Configurações"**

## 🗺️ Mapa de Localização

- Visualize todos os registros de ponto no mapa
- Cores indicam tipo de registro:
  - 🟢 Verde: Entrada
  - 🔴 Vermelho: Saída
  - 🟠 Laranja: Intervalo
  - 🔵 Azul: Retorno
- Clique em um registro para ver detalhes
- Coordenadas e endereço são capturados automaticamente

## 📊 Métricas e Indicadores

### Dashboard do Colaborador
- **Status Atual**: Entrada, Intervalo, Saída ou Desativado
- **Horas Trabalhadas**: Total do dia
- **Próximo Evento**: Próxima ação esperada
- **Geolocalização Ativa**: Indica se a localização está sendo capturada

### Dashboard do Gestor
- **Total de Colaboradores**: Número total na empresa
- **Presentes Hoje**: Colaboradores que já registraram entrada
- **Ausentes**: Colaboradores que não registraram
- **Atrasados**: Colaboradores que entraram após o horário
- **Justificativas Pendentes**: Solicitações aguardando análise

## 🎨 Tema e Interface

- **Tema Claro/Escuro**: Alterne entre temas no menu
- **Responsividade**: Funciona perfeitamente em mobile e desktop
- **Sidebar**: Navegação principal sempre acessível
- **Notificações**: Toast notifications para feedback de ações

## ⚙️ Configurações Técnicas

### Geolocalização
- Requer permissão do navegador
- Captura: Latitude, Longitude, Precisão, Endereço
- Validação: Compara com raio permitido (geofencing)

### Banco de Dados
- Tabelas: Usuários, Registros de Ponto, Justificativas, Configurações
- Tipos de Registro: entrada, saída, intervalo_inicio, intervalo_fim
- Status de Justificativa: pendente, aprovada, rejeitada

### Autenticação
- OAuth com Manus
- Roles: colaborador, gestor, admin
- Controle de acesso por role

## 🔒 Segurança

- Autenticação obrigatória
- Controle de acesso por role
- Validação de sequência de ponto
- Geofencing para validar localização
- Dados de geolocalização armazenados com segurança

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se sua geolocalização está ativada
2. Confirme que está usando um navegador moderno
3. Verifique a conexão com a internet
4. Limpe o cache do navegador se necessário

## 📝 Notas Importantes

- A geolocalização é capturada no exato momento do registro
- A sequência de ponto é validada automaticamente
- Justificativas podem ser criadas a qualquer momento
- Relatórios podem ser gerados para qualquer período
- Configurações da empresa afetam todos os colaboradores

---

**Versão**: 1.3.0  
**Última Atualização**: 20 de Abril de 2026  
**Status**: Pronto para Produção
