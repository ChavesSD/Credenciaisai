# 🏥 Sistema de Cadastro de Credenciais

Sistema moderno e intuitivo para gerenciar credenciais de funcionários e configurar senhas para totem de atendimento.

## 🚀 Funcionalidades

### 📋 Gestão de Credenciais
- Cadastro de funcionários por categoria (Medicina, Odontologia, Laboratório, Recepção, etc.)
- Busca rápida e filtros inteligentes
- Exportação de dados em Excel
- Envio automático por email

### 🖥️ Configuração do Totem
- Configuração personalizada de senhas do totem
- Cores customizáveis para cada tipo de senha
- Preview em tempo real do totem
- Até 12 senhas diferentes

### 🎯 Tour Guiado
- **Novo!** Tour interativo para novos usuários
- Aparece automaticamente no primeiro acesso
- Botão "Fazer Tour" disponível sempre
- Sistema de spotlight para destacar funcionalidades
- Navegação fluída e responsiva

## 🌟 Características Técnicas

- **Interface Moderna**: Design clean e responsivo
- **Sem Backend**: Funciona totalmente no frontend
- **Armazenamento Local**: Dados salvos no localStorage
- **Responsivo**: Adapta-se a todos os dispositivos
- **PWA Ready**: Pode ser instalado como app

## 🛠️ Tecnologias Utilizadas

- **HTML5** - Estrutura semântica
- **CSS3** - Estilização moderna com variáveis CSS
- **JavaScript ES6+** - Funcionalidades interativas
- **SheetJS** - Exportação para Excel
- **FormSubmit** - Envio de emails

## 📱 Como Usar

### Primeiro Acesso
1. Acesse o sistema
2. O tour guiado iniciará automaticamente
3. Siga as instruções para conhecer todas as funcionalidades

### Cadastrando Funcionários
1. Clique em "Novo Cadastro"
2. Selecione o tipo de profissional
3. Preencha os dados conforme o tipo selecionado
4. Salve as informações

### Configurando o Totem
1. Clique na aba "Senhas do Totem"
2. Clique em "Nova Senha" 
3. Configure nome, cor e posição
4. Use "Ver Totem" para preview

### Exportando Dados
1. Clique em "Enviar por Email"
2. Preencha seus dados
3. Os arquivos serão gerados e enviados automaticamente

## 🔧 Instalação Local

```bash
# Clone o repositório
git clone https://github.com/ChavesSD/Credenciaisai.git

# Entre na pasta
cd Credenciaisai

# Inicie um servidor local
python -m http.server 8000

# Acesse http://localhost:8000
```

## 🌐 Deploy

### GitHub Pages
O projeto está configurado para deploy automático no GitHub Pages.

### Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ChavesSD/Credenciaisai)

## 📋 Tipos de Profissionais Suportados

- **Recepção Médica** - Gestão de funcionários da recepção médica
- **Recepção Odonto** - Gestão de funcionários da recepção odontológica  
- **Medicina** - Cadastro de médicos com especialidades
- **Odontologia** - Cadastro de dentistas com especialidades
- **Laboratório** - Gestão de funcionários do laboratório
- **Pós Consulta** - Funcionários do pós-atendimento
- **Tipos Personalizados** - Crie seus próprios tipos conforme necessário

## 🎨 Personalização

O sistema permite:
- Adicionar novos tipos de profissionais
- Personalizar cores do totem
- Configurar ordem das senhas
- Adaptar campos por tipo de profissional

## 📞 Suporte

Para suporte técnico ou dúvidas:
- **Email**: suporte.intelite@gmail.com
- **GitHub Issues**: [Abrir chamado](https://github.com/ChavesSD/Credenciaisai/issues)

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido com ❤️ para facilitar a gestão de credenciais em ambientes de saúde** 