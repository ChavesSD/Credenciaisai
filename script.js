// Sistema de Cadastro de Credenciais
class SistemaCadastro {
    constructor() {
        this.credenciais = this.carregarDados();
        this.senhasTotem = this.carregarSenhasTotem();
        this.unidadeTotem = this.carregarUnidadeTotem();
        this.unidadeCredenciais = this.carregarUnidadeCredenciais();
        this.tiposPersonalizados = this.carregarTiposPersonalizados();
        this.credencialEditando = null;
        this.senhaTotemEditando = null;
        this.secaoAtual = 'credenciais';
        
        // Estado do cadastro via Milly
        this.millyCadastroEmAndamento = null;
        this.millyDadosColetados = {};
        this.millyAguardandoConfirmacao = false;
        this.millyCadastrosMultiplos = []; // Array para múltiplos cadastros
        
        this.inicializar();
    }

    inicializar() {
        this.configurarEventos();
        this.atualizarTabela();
        this.atualizarTabelaTotem();
        this.atualizarUnidadeAtual();
        this.atualizarUnidadeAtualCredenciais();
        this.atualizarUnidadeAtualCredenciaisInline();
        this.preencherUnidadeTotemInline();
        this.carregarTiposNoSelect();
        this.configurarOpcoesOrdemInline();
        this.atualizarPreviewTotemInline();
    }

    configurarEventos() {
        // Navegação entre seções
        document.getElementById('btnCredenciais').addEventListener('click', () => this.alternarSecao('credenciais'));
        document.getElementById('btnSenhasTotem').addEventListener('click', () => this.alternarSecao('totem'));

        // Botões principais
        document.getElementById('btnNovoCadastro').addEventListener('click', () => this.abrirModal());
        document.getElementById('btnVerTotem').addEventListener('click', () => this.abrirModalTotemVisualizacao());
        document.getElementById('btnExportarExcel').addEventListener('click', () => this.exportarDados());
        // Botão de exportar removido
        document.getElementById('btnEnviarEmail').addEventListener('click', () => this.enviarPorEmail());

        // Modal de cadastro (mantido para edição)
        document.getElementById('btnCancelar').addEventListener('click', () => this.fecharModal());
        document.getElementById('formCadastro').addEventListener('submit', (e) => this.salvarCadastro(e));

        // Modal de senha do totem (mantido para edição)
        document.getElementById('btnCancelarTotem').addEventListener('click', () => this.fecharModal(document.getElementById('modalSenhaTotem')));
        document.getElementById('formSenhaTotem').addEventListener('submit', (e) => this.salvarSenhaTotem(e));
        
        // Formulários inline de cadastro
        const formCadastroInline = document.getElementById('formCadastroInline');
        if (formCadastroInline) {
            formCadastroInline.addEventListener('submit', (e) => this.salvarCadastroInline(e));
        }
        const btnLimparCredenciais = document.getElementById('btnLimparCredenciais');
        if (btnLimparCredenciais) {
            btnLimparCredenciais.addEventListener('click', () => this.limparFormularioCredenciais());
        }
        const tipoInline = document.getElementById('tipoInline');
        if (tipoInline) {
            tipoInline.addEventListener('change', (e) => this.alterarTipoInline(e.target.value));
        }

        // Formulários inline de senha do totem
        const formSenhaTotemInline = document.getElementById('formSenhaTotemInline');
        if (formSenhaTotemInline) {
            formSenhaTotemInline.addEventListener('submit', (e) => this.salvarSenhaTotemInline(e));
        }
        const btnLimparTotem = document.getElementById('btnLimparTotem');
        if (btnLimparTotem) {
            btnLimparTotem.addEventListener('click', () => this.limparFormularioTotem());
        }
        
        // Configurar eventos do totem inline
        this.configurarEventosTotemInline();
        
        // Botão alterar unidade
        document.getElementById('btnAlterarUnidade').addEventListener('click', () => this.permitirAlterarUnidade());

        // Controle do tipo de profissional (modal)
        document.getElementById('tipo').addEventListener('change', (e) => this.alterarTipo(e.target.value));

        // Eventos específicos do Totem
        this.configurarEventosTotem();

        // Busca
        document.getElementById('searchInput').addEventListener('input', (e) => this.filtrarTabela(e.target.value));
        document.getElementById('searchInputTotem').addEventListener('input', (e) => this.filtrarTabelaTotem(e.target.value));

        // Fechar modais
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.fecharModal(modal);
            });
        });

        // Modal de confirmação
        document.getElementById('btnCancelarExclusao').addEventListener('click', () => {
            this.fecharModal(document.getElementById('modalConfirmacao'));
        });
        
        document.getElementById('btnConfirmarExclusao').addEventListener('click', () => this.confirmarExclusao());

        // Modal de email
        document.getElementById('btnCancelarEmail').addEventListener('click', () => {
            this.fecharModal(document.getElementById('modalEmail'));
        });
        
        document.getElementById('formEmail').addEventListener('submit', (e) => this.enviarEmailComFormSubmit(e));
        
        // Modal de instruções
        document.getElementById('btnEntendido').addEventListener('click', () => {
            this.fecharModal(document.getElementById('modalInstrucoes'));
        });
        
        // Listener para resposta do FormSubmit (não mais necessário com nova abordagem)

        // Fechar modal clicando fora
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                    this.fecharModal(e.target);
            }
        });

        // Inicializar comportamento do switch Exibir no Totem
        const exibirSwitch = document.getElementById('exibirNoTotem');
        if (exibirSwitch) {
            exibirSwitch.addEventListener('change', () => this.atualizarVisibilidadeOrdemTotem());
        }
        this.atualizarVisibilidadeOrdemTotem();

        // Eventos da Assistente Milly
        this.inicializarMillyChat();
    }

    inicializarMillyChat() {
        const btnMilly = document.getElementById('btnMillyAssistente');
        const btnFechar = document.getElementById('btnFecharMillyChat');
        const btnEnviar = document.getElementById('btnEnviarMillyChat');
        const inputChat = document.getElementById('millyChatInput');
        const modalChat = document.getElementById('modalMillyChat');
        const suggestions = document.querySelectorAll('.suggestion-btn');

        // Abrir modal
        if (btnMilly) {
            btnMilly.addEventListener('click', () => {
                modalChat.style.display = 'block';
                inputChat.focus();
                // Mensagem de boas-vindas apenas se o chat estiver vazio
                const chatBody = document.getElementById('millyChatBody');
                if (chatBody && chatBody.children.length === 0) {
                    setTimeout(() => {
                        this.adicionarMensagemMilly('Olá! Eu sou a Milly, sua assistente virtual! 😊', 'texto');
                        setTimeout(() => {
                            this.adicionarMensagemMilly('Posso te ajudar com várias coisas:<br><br>• <strong>Cadastrar credenciais</strong> de funcionários e profissionais<br>• <strong>Cadastrar senhas do totem</strong> para exibição<br>• <strong>Exportar dados</strong> para Excel<br>• <strong>Enviar relatórios</strong> por email<br>• <strong>Ver estatísticas</strong> e visualizar o totem<br>• <strong>Tirar dúvidas</strong> sobre o sistema<br><br>O que você gostaria de fazer?', 'html');
                        }, 500);
                    }, 300);
                }
            });
        }

        // Fechar modal
        if (btnFechar) {
            btnFechar.addEventListener('click', () => {
                modalChat.style.display = 'none';
            });
        }

        // Enviar mensagem
        const enviarMensagem = () => {
            const mensagem = inputChat.value.trim();
            if (mensagem) {
                this.adicionarMensagemUsuario(mensagem);
                inputChat.value = '';
                this.processarMensagemMilly(mensagem);
            }
        };

        if (btnEnviar) {
            btnEnviar.addEventListener('click', enviarMensagem);
        }

        if (inputChat) {
            // Auto-resize do textarea
            inputChat.addEventListener('input', () => {
                inputChat.style.height = 'auto';
                inputChat.style.height = Math.min(inputChat.scrollHeight, 120) + 'px';
            });
            
            inputChat.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    enviarMensagem();
                }
                // Shift+Enter permite quebrar linha (comportamento padrão do textarea)
            });
        }

        // Botões de sugestão
        suggestions.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                this.processarAcaoRapida(action);
            });
        });

        // Fechar ao clicar fora
        if (modalChat) {
            modalChat.addEventListener('click', (e) => {
                if (e.target === modalChat) {
                    modalChat.style.display = 'none';
                }
            });
        }
    }

    adicionarMensagemUsuario(mensagem) {
        const chatBody = document.getElementById('millyChatBody');
        if (!chatBody) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'user-message-bubble user-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${this.escapeHtml(mensagem)}</p>
            </div>
        `;
        chatBody.appendChild(messageDiv);
        this.rolarChatParaBaixo();
    }

    adicionarMensagemMilly(mensagem, tipo = 'texto') {
        const chatBody = document.getElementById('millyChatBody');
        if (!chatBody) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'milly-message-bubble milly-message';
        
        let conteudo = '';
        if (tipo === 'texto') {
            conteudo = `<p>${mensagem}</p>`;
        } else if (tipo === 'html') {
            conteudo = mensagem;
        }

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <img src="Milly_semfundo.png" alt="Milly">
            </div>
            <div class="message-content">
                ${conteudo}
            </div>
        `;
        
        chatBody.appendChild(messageDiv);
        this.rolarChatParaBaixo();
    }

    rolarChatParaBaixo() {
        const chatBody = document.getElementById('millyChatBody');
        if (chatBody) {
            setTimeout(() => {
                chatBody.scrollTop = chatBody.scrollHeight;
            }, 100);
        }
    }

    processarMensagemMilly(mensagem) {
        const msg = mensagem.toLowerCase().trim();
        const palavras = msg.split(/\s+/);
        
        // Simular delay de resposta
        setTimeout(() => {
            // Detecção de palavras-chave principais
            const temCredencial = palavras.some(p => ['credencial', 'credenciais', 'usuário', 'usuarios', 'funcionário', 'funcionarios', 'profissional', 'profissionais'].includes(p));
            const temTotem = palavras.some(p => ['totem', 'senha', 'senhas'].includes(p));
            const temCadastrar = palavras.some(p => ['cadastrar', 'cadastro', 'adicionar', 'criar', 'novo', 'nova', 'inserir', 'incluir'].includes(p));
            const temExportar = palavras.some(p => ['exportar', 'excel', 'baixar', 'download', 'planilha', 'arquivo'].includes(p));
            const temEmail = palavras.some(p => ['email', 'e-mail', 'enviar', 'mandar', 'enviar por email'].includes(p));
            const temAjuda = palavras.some(p => ['ajuda', 'ajudar', 'dúvida', 'duvida', 'como', 'help', 'explicar', 'tutorial'].includes(p));
            const temVer = palavras.some(p => ['ver', 'visualizar', 'mostrar', 'exibir', 'abrir', 'ver o'].includes(p));
            const temListar = palavras.some(p => ['listar', 'lista', 'dados', 'tabela', 'quantos', 'quantas', 'estatística', 'estatisticas'].includes(p));
            
            // Verificar se está aguardando confirmação
            if (this.millyAguardandoConfirmacao) {
                const confirmacao = msg.includes('sim') || msg.includes('confirmar') || msg.includes('ok') || msg.includes('pode') || msg === 's';
                if (confirmacao) {
                    if (this.millyCadastroEmAndamento === 'credencial') {
                        if (this.millyCadastrosMultiplos.length > 1) {
                            this.executarCadastrosMultiplosMilly(this.millyCadastrosMultiplos);
                        } else {
                            this.executarCadastroCredencialMilly(this.millyDadosColetados);
                        }
                    } else if (this.millyCadastroEmAndamento === 'totem') {
                        this.executarCadastroTotemMilly(this.millyDadosColetados);
                    }
                    this.millyAguardandoConfirmacao = false;
                } else {
                    this.adicionarMensagemMilly('Cadastro cancelado. Posso ajudar com mais alguma coisa?', 'texto');
                    this.millyCadastroEmAndamento = null;
                    this.millyDadosColetados = {};
                    this.millyCadastrosMultiplos = [];
                    this.millyAguardandoConfirmacao = false;
                }
                return;
            }
            
            // Verificar se há cadastro em andamento
            if (this.millyCadastroEmAndamento) {
                this.processarDadosCadastroMilly(mensagem);
                return;
            }
            
            // Comandos de cadastro de TOTEM - verificar primeiro (mais específico)
            // Se mencionou totem/senha, assumir que quer cadastrar (a menos que seja para ver/listar)
            if (temTotem && !temVer && !temListar && (temCadastrar || msg.includes('senhas do totem') || msg === 'totem' || msg === 'senha' || msg === 'senhas' || msg.includes('cadastrar senha'))) {
                // Tentar processar dados diretos da mensagem
                const dadosExtraidos = this.extrairDadosTotem(mensagem);
                if (dadosExtraidos.completo) {
                    // Dados completos - mostrar resumo e pedir confirmação
                    this.millyDadosColetados = dadosExtraidos;
                    this.millyCadastroEmAndamento = 'totem';
                    this.adicionarMensagemMilly('Ótimo! Entendi os dados. Vou cadastrar com:', 'texto');
                    setTimeout(() => {
                        const resumo = `
                            <ul>
                                <li><strong>Empresa:</strong> ${dadosExtraidos.empresa}</li>
                                <li><strong>Senha:</strong> ${dadosExtraidos.nome}</li>
                                <li><strong>Ordem:</strong> ${dadosExtraidos.ordem}</li>
                                ${dadosExtraidos.cor ? `<li><strong>Cor:</strong> ${dadosExtraidos.cor}</li>` : ''}
                            </ul>
                            <p>Posso cadastrar agora? (Digite "sim" ou "confirmar")</p>
                        `;
                        this.adicionarMensagemMilly(resumo, 'html');
                        this.millyAguardandoConfirmacao = true;
                    }, 500);
                } else {
                    this.iniciarCadastroTotemMilly(mensagem);
                }
                return;
            }
            
            // Comandos de cadastro de CREDENCIAIS
            if (temCadastrar || (temCredencial && !temTotem) || (msg === 'credenciais' || msg === 'credencial')) {
                if (temCredencial || msg === 'credenciais' || msg === 'credencial') {
                    // Tentar extrair múltiplos cadastros primeiro
                    const cadastrosMultiplos = this.extrairMultiplosCadastros(mensagem);
                    
                    if (cadastrosMultiplos.length > 1) {
                        // Múltiplos cadastros encontrados
                        this.millyCadastrosMultiplos = cadastrosMultiplos;
                        this.millyCadastroEmAndamento = 'credencial';
                        this.adicionarMensagemMilly(`Ótimo! Encontrei <strong>${cadastrosMultiplos.length}</strong> cadastros para fazer! 📝`, 'html');
                        setTimeout(() => {
                            let resumo = '<p><strong>Cadastros encontrados:</strong></p><ol>';
                            cadastrosMultiplos.forEach((cad, index) => {
                                resumo += `<li>`;
                                resumo += `<strong>Empresa:</strong> ${cad.empresa}<br>`;
                                resumo += `<strong>Tipo:</strong> ${cad.tipo}${cad.tipoNovo ? ' <span style="color: #28a745;">(novo tipo criado)</span>' : ''}<br>`;
                                resumo += `<strong>Nome:</strong> ${cad.nome}`;
                                if (cad.especialidade) {
                                    resumo += `<br><strong>Especialidade:</strong> ${cad.especialidade}`;
                                }
                                resumo += `</li>`;
                            });
                            resumo += '</ol>';
                            resumo += '<p>Posso cadastrar todos agora? (Digite "sim" ou "confirmar")</p>';
                            this.adicionarMensagemMilly(resumo, 'html');
                            this.millyAguardandoConfirmacao = true;
                        }, 500);
                    } else {
                        // Tentar processar dados diretos da mensagem (cadastro único)
                        const dadosExtraidos = this.extrairDadosCredencial(mensagem);
                        if (dadosExtraidos.completo) {
                            // Dados completos - mostrar resumo e pedir confirmação
                            this.millyDadosColetados = dadosExtraidos;
                            this.millyCadastroEmAndamento = 'credencial';
                            this.millyCadastrosMultiplos = [dadosExtraidos];
                            
                            let mensagemTipo = '';
                            if (dadosExtraidos.tipoNovo) {
                                mensagemTipo = ' <span style="color: #28a745;">(novo tipo criado automaticamente)</span>';
                            }
                            
                            this.adicionarMensagemMilly('Ótimo! Entendi os dados. Vou cadastrar com:', 'texto');
                            setTimeout(() => {
                                const resumo = `
                                    <ul>
                                        <li><strong>Empresa:</strong> ${dadosExtraidos.empresa}</li>
                                        <li><strong>Tipo:</strong> ${dadosExtraidos.tipo}${mensagemTipo}</li>
                                        <li><strong>Nome:</strong> ${dadosExtraidos.nome}</li>
                                        ${dadosExtraidos.especialidade ? `<li><strong>Especialidade:</strong> ${dadosExtraidos.especialidade}</li>` : ''}
                                    </ul>
                                    <p>Posso cadastrar agora? (Digite "sim" ou "confirmar")</p>
                                `;
                                this.adicionarMensagemMilly(resumo, 'html');
                                this.millyAguardandoConfirmacao = true;
                            }, 500);
                        } else {
                            this.iniciarCadastroCredencialMilly(mensagem);
                        }
                    }
                } else {
                    this.adicionarMensagemMilly('O que você gostaria de cadastrar?', 'texto');
                    setTimeout(() => {
                        this.adicionarMensagemMilly('Posso te ajudar com:<br>• <strong>Credenciais</strong> - Cadastrar funcionários e profissionais<br>• <strong>Senhas do Totem</strong> - Configurar senhas para exibição no totem<br><br>💡 <strong>Dica:</strong> Você pode cadastrar vários usuários de uma vez! Ex: "Empresa Intelite, Recepção João, Medicina Maria, Odonto Pedro"', 'html');
                    }, 500);
                }
                return;
            }
            // Comandos de exportação - melhorado
            else if (temExportar || msg === 'excel' || msg === 'exportar') {
                this.adicionarMensagemMilly('Vou exportar os dados para Excel agora! 📊', 'texto');
                setTimeout(() => {
                    if (this.credenciais.length > 0 || this.senhasTotem.length > 0) {
                        this.exportarDados();
                        this.adicionarMensagemMilly('✅ Exportação concluída! Os arquivos Excel foram baixados com sucesso.', 'texto');
                    } else {
                        this.adicionarMensagemMilly('⚠️ Não há dados para exportar. Cadastre algumas credenciais ou senhas primeiro.', 'texto');
                    }
                }, 1000);
            }
            // Comandos de email - melhorado
            else if (temEmail || msg === 'email') {
                this.adicionarMensagemMilly('Vou preparar o envio por email! 📧', 'texto');
                setTimeout(() => {
                    this.prepararModalEmail();
                    const modalEmail = document.getElementById('modalEmail');
                    if (modalEmail) {
                        modalEmail.style.display = 'block';
                        this.adicionarMensagemMilly('✅ Modal de email aberto! Preencha seus dados e clique em enviar.', 'texto');
                    }
                }, 1000);
            }
            // Comandos de ajuda - melhorado
            else if (temAjuda || msg === 'ajuda' || msg === 'help') {
                this.adicionarMensagemMilly('Claro! Posso te ajudar com várias coisas! 😊', 'texto');
                setTimeout(() => {
                    this.adicionarMensagemMilly(`
                        <p><strong>Funcionalidades disponíveis:</strong></p>
                        <ul>
                            <li>📝 <strong>Cadastros:</strong> Ajudar a cadastrar credenciais e senhas do totem</li>
                            <li>📊 <strong>Exportação:</strong> Exportar dados para Excel</li>
                            <li>📧 <strong>Email:</strong> Enviar relatórios por email</li>
                            <li>🖥️ <strong>Visualização:</strong> Ver o totem e estatísticas</li>
                            <li>❓ <strong>Dúvidas:</strong> Explicar como usar cada funcionalidade</li>
                        </ul>
                        <p>O que você gostaria de fazer ou saber?</p>
                    `, 'html');
                }, 500);
            }
            // Comandos de visualização - melhorado
            else if (temVer && temTotem) {
                this.adicionarMensagemMilly('Vou abrir a visualização do totem para você! 🖥️', 'texto');
                setTimeout(() => {
                    this.abrirModalTotemVisualizacao();
                    this.adicionarMensagemMilly('✅ Totem aberto! Você pode ver como ficará a exibição das senhas.', 'texto');
                }, 1000);
            }
            // Comandos de listagem/estatísticas - melhorado
            else if (temListar || temCredencial || (msg === 'totem' && !temCadastrar)) {
                const totalCredenciais = this.credenciais.length;
                const totalSenhas = this.senhasTotem.length;
                const senhasAtivas = this.senhasTotem.filter(s => s.exibirNoTotem).length;
                
                this.adicionarMensagemMilly('Aqui estão as informações do sistema: 📊', 'texto');
                setTimeout(() => {
                    let info = `<p><strong>Estatísticas:</strong></p><ul>`;
                    info += `<li>📝 <strong>${totalCredenciais}</strong> credenciais cadastradas</li>`;
                    info += `<li>🎯 <strong>${totalSenhas}</strong> senhas do totem cadastradas</li>`;
                    if (totalSenhas > 0) {
                        info += `<li>✅ <strong>${senhasAtivas}</strong> senhas ativas no totem</li>`;
                    }
                    info += `</ul>`;
                    
                    if (totalCredenciais === 0 && totalSenhas === 0) {
                        info += `<p>💡 <strong>Dica:</strong> Comece cadastrando algumas credenciais ou senhas do totem!</p>`;
                    }
                    
                    this.adicionarMensagemMilly(info, 'html');
                }, 500);
            }
            // Palavras soltas - melhor interpretação
            else if (msg === 'credenciais' || msg === 'credencial') {
                this.adicionarMensagemMilly('Sobre credenciais! 📝', 'texto');
                setTimeout(() => {
                    this.adicionarMensagemMilly(`Você tem <strong>${this.credenciais.length}</strong> credenciais cadastradas.<br><br>O que você gostaria de fazer?<br>• Cadastrar novas credenciais<br>• Ver a lista de credenciais<br>• Exportar credenciais`, 'html');
                }, 500);
            }
            else if (msg === 'totem' || msg === 'senha' || msg === 'senhas' || msg.includes('senhas do totem')) {
                // Se mencionou totem/senha sem cadastrar, oferecer cadastro
                this.adicionarMensagemMilly('Sobre senhas do totem! 🎯', 'texto');
                setTimeout(() => {
                    this.adicionarMensagemMilly(`Você tem <strong>${this.senhasTotem.length}</strong> senhas cadastradas.<br><br>O que você gostaria de fazer?<br>• <strong>Cadastrar nova senha</strong> - Vou te guiar passo a passo<br>• Ver o totem<br>• Exportar senhas<br><br>Para cadastrar, me diga: "cadastrar senha do totem" ou me informe os dados!`, 'html');
                }, 500);
            }
            // Resposta padrão melhorada
            else {
                this.adicionarMensagemMilly('Entendi! Deixa eu te ajudar melhor. 😊', 'texto');
                setTimeout(() => {
                    this.adicionarMensagemMilly('Posso te ajudar com:<br><br>• <strong>Cadastrar</strong> credenciais ou senhas do totem<br>• <strong>Exportar</strong> dados para Excel<br>• <strong>Enviar</strong> relatórios por email<br>• <strong>Ver</strong> estatísticas e visualizar o totem<br>• <strong>Tirar dúvidas</strong> sobre o sistema<br><br>O que você gostaria de fazer?', 'html');
                }, 500);
            }
        }, 800);
    }

    processarAcaoRapida(acao) {
        switch(acao) {
            case 'cadastrar':
                this.adicionarMensagemUsuario('Quero cadastrar credenciais');
                this.processarMensagemMilly('cadastrar credenciais');
                break;
            case 'exportar':
                this.adicionarMensagemUsuario('Exportar para Excel');
                this.processarMensagemMilly('exportar excel');
                break;
            case 'email':
                this.adicionarMensagemUsuario('Enviar por email');
                this.processarMensagemMilly('enviar email');
                break;
            case 'ajuda':
                this.adicionarMensagemUsuario('Preciso de ajuda');
                this.processarMensagemMilly('ajuda');
                break;
            case 'totem':
                // Ação rápida para cadastrar senha do totem
                this.adicionarMensagemUsuario('Cadastrar senha do totem');
                this.processarMensagemMilly('cadastrar senha do totem');
                break;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    iniciarCadastroCredencialMilly(mensagem) {
        this.millyCadastroEmAndamento = 'credencial';
        this.millyDadosColetados = {};
        
        this.adicionarMensagemMilly('Vou te ajudar a cadastrar credenciais! 📝', 'texto');
        setTimeout(() => {
            this.adicionarMensagemMilly('Me informe os dados no seguinte formato:<br><br><strong>Empresa: [nome]<br>Tipo: [tipo]<br>Nome: [nome completo]<br>Especialidade: [se aplicável]</strong><br><br>Ou me diga os dados separadamente que eu vou coletando! 😊', 'html');
        }, 500);
        
        // Tentar extrair dados da mensagem inicial
        const dados = this.extrairDadosCredencial(mensagem);
        if (dados.empresa) this.millyDadosColetados.empresa = dados.empresa;
        if (dados.tipo) this.millyDadosColetados.tipo = dados.tipo;
        if (dados.nome) this.millyDadosColetados.nome = dados.nome;
        if (dados.especialidade) this.millyDadosColetados.especialidade = dados.especialidade;
    }

    iniciarCadastroTotemMilly(mensagem) {
        this.millyCadastroEmAndamento = 'totem';
        this.millyDadosColetados = {};
        
        // Tentar extrair dados da mensagem inicial
        const dados = this.extrairDadosTotem(mensagem);
        if (dados.empresa) this.millyDadosColetados.empresa = dados.empresa;
        if (dados.nome) this.millyDadosColetados.nome = dados.nome;
        if (dados.ordem) this.millyDadosColetados.ordem = dados.ordem;
        if (dados.cor) this.millyDadosColetados.cor = dados.cor;
        
        // Verificar se já temos dados suficientes
        const falta = this.verificarDadosFaltantesTotem();
        if (falta.length === 0) {
            // Dados completos - mostrar resumo e pedir confirmação
            this.adicionarMensagemMilly('Perfeito! Vou cadastrar com os seguintes dados:', 'texto');
            setTimeout(() => {
                const resumo = `
                    <ul>
                        <li><strong>Empresa:</strong> ${this.millyDadosColetados.empresa}</li>
                        <li><strong>Senha:</strong> ${this.millyDadosColetados.nome}</li>
                        <li><strong>Ordem:</strong> ${this.millyDadosColetados.ordem}</li>
                        ${this.millyDadosColetados.cor ? `<li><strong>Cor:</strong> ${this.millyDadosColetados.cor}</li>` : ''}
                    </ul>
                    <p>Posso cadastrar agora? (Digite "sim" ou "confirmar")</p>
                `;
                this.adicionarMensagemMilly(resumo, 'html');
                this.millyAguardandoConfirmacao = true;
            }, 500);
        } else {
            this.adicionarMensagemMilly('Vou te ajudar a cadastrar uma senha do totem! 🎯', 'texto');
            setTimeout(() => {
                let mensagemInstrucao = 'Preciso das seguintes informações:<br><br>';
                mensagemInstrucao += '<ol>';
                if (!this.millyDadosColetados.empresa) {
                    mensagemInstrucao += '<li><strong>Nome da empresa</strong></li>';
                }
                if (!this.millyDadosColetados.nome) {
                    mensagemInstrucao += '<li><strong>Nome da senha</strong> (ex: MEDICINA GERAL, CARDIOLOGIA)</li>';
                }
                if (!this.millyDadosColetados.ordem) {
                    mensagemInstrucao += '<li><strong>Ordem no totem</strong> (número de 1 a 12)</li>';
                }
                mensagemInstrucao += '<li><strong>Cor de fundo</strong> (opcional, padrão: azul)</li>';
                mensagemInstrucao += '</ol>';
                mensagemInstrucao += '<br>Você pode me informar tudo de uma vez ou separadamente! 😊';
                this.adicionarMensagemMilly(mensagemInstrucao, 'html');
            }, 500);
        }
    }

    processarDadosCadastroMilly(mensagem) {
        if (this.millyCadastroEmAndamento === 'credencial') {
            const dados = this.extrairDadosCredencial(mensagem);
            
            if (dados.empresa) this.millyDadosColetados.empresa = dados.empresa;
            if (dados.tipo) {
                // Verificar se o tipo existe, se não, criar automaticamente
                const tipoVerificado = this.verificarTipoExiste(dados.tipo);
                if (tipoVerificado.existe) {
                    this.millyDadosColetados.tipo = tipoVerificado.valor;
                } else {
                    // Tipo não existe - criar automaticamente
                    const nomeTipo = dados.tipo;
                    this.millyDadosColetados.tipo = this.criarTipoPersonalizado(nomeTipo);
                    this.millyDadosColetados.tipoNovo = true;
                    this.adicionarMensagemMilly(`✅ Tipo "<strong>${nomeTipo}</strong>" não existia, então criei automaticamente! 🆕`, 'html');
                }
            }
            if (dados.nome) this.millyDadosColetados.nome = dados.nome;
            if (dados.especialidade) this.millyDadosColetados.especialidade = dados.especialidade;
            
            // Verificar se temos dados suficientes
            const falta = this.verificarDadosFaltantesCredencial();
            if (falta.length === 0) {
                // Mostrar resumo e confirmar
                this.adicionarMensagemMilly(`Perfeito! Vou cadastrar com os seguintes dados:`, 'texto');
                setTimeout(() => {
                    let tipoDisplay = this.millyDadosColetados.tipo;
                    // Buscar nome do tipo se for personalizado
                    const tipoPersonalizado = this.tiposPersonalizados.find(t => t.valor === this.millyDadosColetados.tipo);
                    if (tipoPersonalizado) {
                        tipoDisplay = tipoPersonalizado.nome;
                    }
                    
                    const resumo = `
                        <ul>
                            <li><strong>Empresa:</strong> ${this.millyDadosColetados.empresa}</li>
                            <li><strong>Tipo:</strong> ${tipoDisplay}${this.millyDadosColetados.tipoNovo ? ' <span style="color: #28a745;">(novo tipo criado)</span>' : ''}</li>
                            <li><strong>Nome:</strong> ${this.millyDadosColetados.nome}</li>
                            ${this.millyDadosColetados.especialidade ? `<li><strong>Especialidade:</strong> ${this.millyDadosColetados.especialidade}</li>` : ''}
                        </ul>
                        <p>Posso cadastrar agora? (Digite "sim" ou "confirmar")</p>
                    `;
                    this.adicionarMensagemMilly(resumo, 'html');
                    this.millyAguardandoConfirmacao = true;
                }, 500);
            } else {
                this.adicionarMensagemMilly(`Ainda preciso de: <strong>${falta.join(', ')}</strong>. Pode me informar?`, 'html');
            }
        } else if (this.millyCadastroEmAndamento === 'totem') {
            const dados = this.extrairDadosTotem(mensagem);
            
            if (dados.empresa) this.millyDadosColetados.empresa = dados.empresa;
            if (dados.nome) this.millyDadosColetados.nome = dados.nome;
            if (dados.ordem) this.millyDadosColetados.ordem = dados.ordem;
            if (dados.cor) this.millyDadosColetados.cor = dados.cor;
            
            // Verificar se temos dados suficientes
            const falta = this.verificarDadosFaltantesTotem();
            if (falta.length === 0) {
                // Mostrar resumo e confirmar
                this.adicionarMensagemMilly(`Perfeito! Vou cadastrar com os seguintes dados:`, 'texto');
                setTimeout(() => {
                    const resumo = `
                        <ul>
                            <li><strong>Empresa:</strong> ${this.millyDadosColetados.empresa}</li>
                            <li><strong>Senha:</strong> ${this.millyDadosColetados.nome}</li>
                            <li><strong>Ordem:</strong> ${this.millyDadosColetados.ordem}</li>
                            ${this.millyDadosColetados.cor ? `<li><strong>Cor:</strong> ${this.millyDadosColetados.cor}</li>` : ''}
                        </ul>
                        <p>Posso cadastrar agora? (Digite "sim" ou "confirmar")</p>
                    `;
                    this.adicionarMensagemMilly(resumo, 'html');
                    this.millyAguardandoConfirmacao = true;
                }, 500);
            } else {
                this.adicionarMensagemMilly(`Ainda preciso de: <strong>${falta.join(', ')}</strong>. Pode me informar?`, 'html');
            }
        }
    }

    obterTiposDisponiveis() {
        // Tipos padrão
        const tiposPadrao = ['recepção', 'recepcao', 'recepcao médica', 'recepcao medica', 'recepcao-odonto', 'recepcao odonto', 'medicina', 'odonto', 'odontologia', 'laboratório', 'laboratorio', 'pós consulta', 'pos consulta', 'pos-consulta'];
        
        // Adicionar tipos personalizados
        const tiposPersonalizados = this.tiposPersonalizados.map(t => t.nome.toLowerCase());
        const tiposPersonalizadosValor = this.tiposPersonalizados.map(t => t.valor.toLowerCase());
        
        return [...tiposPadrao, ...tiposPersonalizados, ...tiposPersonalizadosValor];
    }

    verificarTipoExiste(tipoDigitado) {
        const tipoLower = tipoDigitado.toLowerCase().trim();
        
        // Verificar tipos padrão
        const tiposPadrao = {
            'recepção': 'recepcao',
            'recepcao': 'recepcao',
            'recepcao médica': 'recepcao',
            'recepcao medica': 'recepcao',
            'recepcao-odonto': 'recepcao-odonto',
            'recepcao odonto': 'recepcao-odonto',
            'medicina': 'medicina',
            'odonto': 'odonto',
            'odontologia': 'odonto',
            'laboratório': 'laboratorio',
            'laboratorio': 'laboratorio',
            'pós consulta': 'pos-consulta',
            'pos consulta': 'pos-consulta',
            'pos-consulta': 'pos-consulta'
        };
        
        if (tiposPadrao[tipoLower]) {
            return { existe: true, valor: tiposPadrao[tipoLower] };
        }
        
        // Verificar tipos personalizados
        const tipoPersonalizado = this.tiposPersonalizados.find(t => 
            t.nome.toLowerCase() === tipoLower || 
            t.valor.toLowerCase() === tipoLower
        );
        
        if (tipoPersonalizado) {
            return { existe: true, valor: tipoPersonalizado.valor };
        }
        
        // Tipo não existe
        return { existe: false, valor: null };
    }

    criarTipoPersonalizado(nomeTipo) {
        const nomeFormatado = nomeTipo.trim();
        const valorTipo = `tipo-${Date.now()}`;
        
        // Verificar se já existe
        const jaExiste = this.tiposPersonalizados.some(t => 
            t.nome.toLowerCase() === nomeFormatado.toLowerCase()
        );
        
        if (jaExiste) {
            const existente = this.tiposPersonalizados.find(t => 
                t.nome.toLowerCase() === nomeFormatado.toLowerCase()
            );
            return existente.valor;
        }
        
        // Criar novo tipo
        const novoTipo = {
            id: Date.now(),
            nome: nomeFormatado,
            valor: valorTipo,
            dataCriacao: new Date().toISOString()
        };
        
        this.tiposPersonalizados.push(novoTipo);
        this.salvarTiposPersonalizados();
        this.carregarTiposNoSelect();
        
        return valorTipo;
    }

    extrairDadosCredencial(mensagem) {
        const dados = {};
        const msg = mensagem.toLowerCase();
        const tipos = this.obterTiposDisponiveis();
        
        // Padrão comum: "Empresa X, Tipo Y, Nome Z" ou "Empresa: X, Tipo: Y, Nome: Z"
        const partes = mensagem.split(',').map(p => p.trim());
        
        // Extrair empresa - múltiplos padrões
        let empresaMatch = mensagem.match(/(?:empresa|unidade)[\s:]+([^,\n]+)/i);
        if (empresaMatch) {
            dados.empresa = empresaMatch[1].trim();
        } else if (partes.length >= 3) {
            // Padrão "Empresa X, Tipo Y, Nome Z"
            const primeiraParte = partes[0];
            if (primeiraParte.toLowerCase().includes('empresa')) {
                empresaMatch = primeiraParte.match(/empresa[\s:]+(.+)/i);
                if (empresaMatch) {
                    dados.empresa = empresaMatch[1].trim();
                } else {
                    // Se não encontrou padrão, a primeira parte pode ser a empresa
                    dados.empresa = primeiraParte.replace(/empresa[\s:]+/i, '').trim();
                }
            } else if (primeiraParte && primeiraParte[0] === primeiraParte[0].toUpperCase() && 
                       !tipos.some(t => primeiraParte.toLowerCase().includes(t))) {
                // Primeira parte capitalizada que não é tipo = empresa
                dados.empresa = primeiraParte;
            }
        } else if (partes.length === 1 && partes[0] && partes[0][0] === partes[0][0].toUpperCase()) {
            // Se só uma parte e começa com maiúscula, pode ser empresa
            if (!tipos.some(t => partes[0].toLowerCase().includes(t))) {
                dados.empresa = partes[0];
            }
        }
        
        // Extrair tipo - múltiplos padrões
        let tipoEncontrado = false;
        for (const tipo of tipos) {
            if (msg.includes(tipo)) {
                const tipoVerificado = this.verificarTipoExiste(tipo);
                if (tipoVerificado.existe) {
                    dados.tipo = tipoVerificado.valor;
                } else {
                    dados.tipo = this.criarTipoPersonalizado(tipo);
                    dados.tipoNovo = true;
                }
                tipoEncontrado = true;
                break;
            }
        }
        
        // Se não encontrou tipo, tentar em formato "Empresa X, Tipo Y, Nome Z"
        if (!tipoEncontrado && partes.length >= 2) {
            for (let i = 0; i < partes.length; i++) {
                const parte = partes[i].trim();
                const parteLower = parte.toLowerCase();
                
                // Verificar se é um tipo conhecido
                for (const tipo of tipos) {
                    if (parteLower.includes(tipo) || parteLower === tipo || parteLower === tipo.replace('ó', 'o').replace('ã', 'a')) {
                        const tipoVerificado = this.verificarTipoExiste(parte);
                        if (tipoVerificado.existe) {
                            dados.tipo = tipoVerificado.valor;
                        } else {
                            dados.tipo = this.criarTipoPersonalizado(parte);
                            dados.tipoNovo = true;
                        }
                        tipoEncontrado = true;
                        break;
                    }
                }
                
                // Se não encontrou tipo conhecido, mas a parte parece ser um tipo (capitalizada, não é empresa/nome)
                if (!tipoEncontrado && parte && parte[0] === parte[0].toUpperCase() && 
                    !parte.toLowerCase().includes('empresa') && 
                    !parte.toLowerCase().includes('unidade') &&
                    !parte.toLowerCase().includes('nome') &&
                    parte.length > 2) {
                    const tipoVerificado = this.verificarTipoExiste(parte);
                    if (tipoVerificado.existe) {
                        dados.tipo = tipoVerificado.valor;
                        tipoEncontrado = true;
                    } else {
                        // Criar tipo automaticamente
                        dados.tipo = this.criarTipoPersonalizado(parte);
                        dados.tipoNovo = true;
                        tipoEncontrado = true;
                    }
                    break;
                }
                
                if (tipoEncontrado) break;
            }
        }
        
        // Se ainda não encontrou e temos 3 partes, a segunda geralmente é o tipo
        if (!tipoEncontrado && partes.length === 3) {
            const segundaParte = partes[1].trim();
            const segundaParteLower = segundaParte.toLowerCase();
            
            // Verificar se o tipo existe
            const tipoVerificado = this.verificarTipoExiste(segundaParte);
            if (tipoVerificado.existe) {
                dados.tipo = tipoVerificado.valor;
                tipoEncontrado = true;
            } else {
                // Tipo não existe - criar automaticamente
                dados.tipo = this.criarTipoPersonalizado(segundaParte);
                dados.tipoNovo = true; // Flag para informar ao usuário
                tipoEncontrado = true;
            }
        }
        
        // Se ainda não encontrou tipo, tentar detectar como tipo novo
        if (!tipoEncontrado) {
            // Procurar por palavras que podem ser tipos (não são empresa nem nome)
            for (let i = 0; i < partes.length; i++) {
                const parte = partes[i].trim();
                if (parte && parte.length > 2 && 
                    !parte.toLowerCase().includes('empresa') && 
                    !parte.toLowerCase().includes('unidade') &&
                    !parte.toLowerCase().includes('nome') &&
                    !parte.toLowerCase().includes('especialidade') &&
                    parte[0] === parte[0].toUpperCase() &&
                    parte !== dados.empresa && parte !== dados.nome) {
                    
                    const tipoVerificado = this.verificarTipoExiste(parte);
                    if (tipoVerificado.existe) {
                        dados.tipo = tipoVerificado.valor;
                        tipoEncontrado = true;
                        break;
                    } else {
                        // Criar tipo automaticamente
                        dados.tipo = this.criarTipoPersonalizado(parte);
                        dados.tipoNovo = true;
                        tipoEncontrado = true;
                        break;
                    }
                }
            }
        }
        
        // Extrair nome - múltiplos padrões
        const nomeMatch = mensagem.match(/(?:nome|funcionário|profissional|funcionario)[\s:]+([^,\n]+)/i);
        if (nomeMatch) {
            dados.nome = nomeMatch[1].trim();
        } else if (partes.length >= 3) {
            // Padrão "Empresa X, Tipo Y, Nome Z" - a terceira parte geralmente é o nome
            const terceiraParte = partes[2].trim();
            if (terceiraParte && terceiraParte[0] === terceiraParte[0].toUpperCase() && 
                !tipos.some(t => terceiraParte.toLowerCase().includes(t)) &&
                !terceiraParte.toLowerCase().includes('empresa') && 
                !terceiraParte.toLowerCase().includes('unidade') &&
                !terceiraParte.toLowerCase().includes('tipo') &&
                !terceiraParte.toLowerCase().includes('nome:')) {
                dados.nome = terceiraParte;
            } else {
                // Se a terceira parte não servir, tentar a última
                for (let i = partes.length - 1; i >= 0; i--) {
                    const parte = partes[i].trim();
                    if (parte && parte[0] === parte[0].toUpperCase() && 
                        !tipos.some(t => parte.toLowerCase().includes(t)) &&
                        !parte.toLowerCase().includes('empresa') && 
                        !parte.toLowerCase().includes('unidade') &&
                        !parte.toLowerCase().includes('tipo') &&
                        !parte.toLowerCase().includes('nome:') &&
                        parte !== dados.empresa) {
                        dados.nome = parte;
                        break;
                    }
                }
            }
        } else {
            // Tentar identificar nomes próprios (palavras capitalizadas)
            for (const palavra of partes) {
                const p = palavra.trim();
                if (p && p[0] === p[0].toUpperCase() && p.length > 2 && !p.includes(':') && 
                    !tipos.some(t => p.toLowerCase().includes(t)) &&
                    !p.toLowerCase().includes('empresa') && 
                    !p.toLowerCase().includes('unidade') &&
                    p !== dados.empresa) {
                    if (!dados.nome) dados.nome = p;
                }
            }
        }
        
        // Extrair especialidade
        const especialidadeMatch = mensagem.match(/(?:especialidade|especialista)[\s:]+([^,\n]+)/i);
        if (especialidadeMatch) {
            dados.especialidade = especialidadeMatch[1].trim();
        }
        
        dados.completo = !!(dados.empresa && dados.tipo && dados.nome);
        return dados;
    }

    extrairMultiplosCadastros(mensagem) {
        const cadastros = [];
        const linhas = mensagem.split(/\n|;|e\s+/i).map(l => l.trim()).filter(l => l.length > 0);
        
        // Se a mensagem tem múltiplas linhas ou separadores, processar cada uma
        if (linhas.length > 1) {
            let empresaCompartilhada = null;
            
            for (const linha of linhas) {
                const dados = this.extrairDadosCredencial(linha);
                
                // Se não tem empresa nesta linha, usar a compartilhada
                if (!dados.empresa && empresaCompartilhada) {
                    dados.empresa = empresaCompartilhada;
                } else if (dados.empresa) {
                    empresaCompartilhada = dados.empresa;
                }
                
                if (dados.completo) {
                    cadastros.push(dados);
                }
            }
        } else {
            // Tentar extrair múltiplos cadastros de uma única linha
            // Padrão: "Empresa X, Tipo1 Nome1, Tipo2 Nome2, Tipo3 Nome3"
            const partes = mensagem.split(',').map(p => p.trim());
            
            if (partes.length >= 4) {
                // Primeira parte é empresa
                let empresa = null;
                const primeiraParte = partes[0];
                if (primeiraParte.toLowerCase().includes('empresa')) {
                    const match = primeiraParte.match(/empresa[\s:]+(.+)/i);
                    if (match) {
                        empresa = match[1].trim();
                    }
                } else if (primeiraParte[0] === primeiraParte[0].toUpperCase()) {
                    empresa = primeiraParte;
                }
                
                // Processar pares Tipo-Nome
                for (let i = 1; i < partes.length; i += 2) {
                    if (i + 1 < partes.length) {
                        const tipoParte = partes[i].trim();
                        const nomeParte = partes[i + 1].trim();
                        
                        if (tipoParte && nomeParte) {
                            const dados = {
                                empresa: empresa || this.millyDadosColetados.empresa,
                                tipo: null,
                                nome: nomeParte,
                                especialidade: null
                            };
                            
                            // Verificar e criar tipo se necessário
                            const tipoVerificado = this.verificarTipoExiste(tipoParte);
                            if (tipoVerificado.existe) {
                                dados.tipo = tipoVerificado.valor;
                            } else {
                                dados.tipo = this.criarTipoPersonalizado(tipoParte);
                                dados.tipoNovo = true;
                            }
                            
                            dados.completo = !!(dados.empresa && dados.tipo && dados.nome);
                            if (dados.completo) {
                                cadastros.push(dados);
                            }
                        }
                    }
                }
            }
        }
        
        return cadastros;
    }

    extrairDadosTotem(mensagem) {
        const dados = {};
        const partes = mensagem.split(',').map(p => p.trim());
        
        // Extrair empresa - múltiplos padrões
        let empresaMatch = mensagem.match(/(?:empresa|unidade)[\s:]+([^,\n]+)/i);
        if (empresaMatch) {
            dados.empresa = empresaMatch[1].trim();
        } else if (partes.length >= 3) {
            // Padrão "Empresa X, Senha Y, Ordem Z"
            const primeiraParte = partes[0];
            if (primeiraParte.toLowerCase().includes('empresa')) {
                empresaMatch = primeiraParte.match(/empresa[\s:]+(.+)/i);
                if (empresaMatch) {
                    dados.empresa = empresaMatch[1].trim();
                } else {
                    dados.empresa = primeiraParte.replace(/empresa[\s:]+/i, '').trim();
                }
            } else if (primeiraParte && primeiraParte[0] === primeiraParte[0].toUpperCase()) {
                // Primeira parte capitalizada pode ser empresa
                dados.empresa = primeiraParte;
            }
        }
        
        // Extrair nome da senha - múltiplos padrões
        let senhaMatch = mensagem.match(/(?:senha|nome da senha)[\s:]+([^,\n]+)/i);
        if (senhaMatch) {
            dados.nome = senhaMatch[1].trim().toUpperCase();
        } else if (partes.length >= 2) {
            // Padrão "Empresa X, Senha Y, Ordem Z" - segunda parte geralmente é a senha
            const segundaParte = partes[1];
            if (segundaParte.toLowerCase().includes('senha')) {
                senhaMatch = segundaParte.match(/senha[\s:]+(.+)/i);
                if (senhaMatch) {
                    dados.nome = senhaMatch[1].trim().toUpperCase();
                } else {
                    dados.nome = segundaParte.replace(/senha[\s:]+/i, '').trim().toUpperCase();
                }
            } else if (segundaParte && segundaParte.length > 2) {
                // Se não tem "senha:" mas tem texto, pode ser o nome da senha
                dados.nome = segundaParte.toUpperCase();
            }
        }
        
        // Extrair ordem - múltiplos padrões
        let ordemMatch = mensagem.match(/(?:ordem|posição|posicao)[\s:]+(\d+)/i);
        if (ordemMatch) {
            dados.ordem = parseInt(ordemMatch[1]);
        } else if (partes.length >= 3) {
            // Padrão "Empresa X, Senha Y, Ordem Z" - terceira parte pode ser ordem
            const terceiraParte = partes[2];
            const ordemNum = parseInt(terceiraParte);
            if (!isNaN(ordemNum) && ordemNum >= 1 && ordemNum <= 12) {
                dados.ordem = ordemNum;
            } else {
                ordemMatch = terceiraParte.match(/(?:ordem|posição|posicao)[\s:]+(\d+)/i);
                if (ordemMatch) {
                    dados.ordem = parseInt(ordemMatch[1]);
                }
            }
        } else {
            // Tentar encontrar número entre 1 e 12 na mensagem
            const numeros = mensagem.match(/\b([1-9]|1[0-2])\b/g);
            if (numeros && numeros.length > 0) {
                dados.ordem = parseInt(numeros[0]);
            }
        }
        
        // Extrair cor
        const corMatch = mensagem.match(/(?:cor|color)[\s:]+(#?[0-9a-f]{6})/i);
        if (corMatch) {
            dados.cor = corMatch[1].startsWith('#') ? corMatch[1] : '#' + corMatch[1];
        }
        
        dados.completo = !!(dados.empresa && dados.nome && dados.ordem);
        return dados;
    }

    verificarDadosFaltantesCredencial() {
        const falta = [];
        if (!this.millyDadosColetados.empresa) falta.push('Nome da empresa');
        if (!this.millyDadosColetados.tipo) falta.push('Tipo de usuário');
        if (!this.millyDadosColetados.nome) falta.push('Nome completo');
        return falta;
    }

    verificarDadosFaltantesTotem() {
        const falta = [];
        if (!this.millyDadosColetados.empresa) falta.push('Nome da empresa');
        if (!this.millyDadosColetados.nome) falta.push('Nome da senha');
        if (!this.millyDadosColetados.ordem) falta.push('Ordem no totem (1-12)');
        return falta;
    }

    executarCadastrosMultiplosMilly(cadastros) {
        try {
            let sucessos = 0;
            let erros = 0;
            
            this.adicionarMensagemMilly(`Processando ${cadastros.length} cadastros... ⏳`, 'texto');
            
            for (const dados of cadastros) {
                try {
                    this.executarCadastroCredencialMilly(dados, false); // false = não mostrar mensagem individual
                    sucessos++;
                } catch (error) {
                    console.error('Erro ao cadastrar:', error);
                    erros++;
                }
            }
            
            // Atualizar tabela uma vez no final
            this.atualizarTabela();
            
            // Mensagem final
            if (sucessos > 0) {
                this.adicionarMensagemMilly(`✅ ${sucessos} cadastro(s) realizado(s) com sucesso! 🎉`, 'texto');
                if (erros > 0) {
                    this.adicionarMensagemMilly(`⚠️ ${erros} cadastro(s) falharam. Verifique os dados.`, 'texto');
                }
                setTimeout(() => {
                    this.adicionarMensagemMilly(`Você tem agora <strong>${this.credenciais.length}</strong> credenciais cadastradas.`, 'html');
                }, 500);
            } else {
                this.adicionarMensagemMilly('❌ Não foi possível cadastrar nenhum registro. Verifique os dados informados.', 'texto');
            }
            
            this.millyCadastroEmAndamento = null;
            this.millyDadosColetados = {};
            this.millyCadastrosMultiplos = [];
            this.millyAguardandoConfirmacao = false;
            
        } catch (error) {
            console.error('Erro ao processar múltiplos cadastros:', error);
            this.adicionarMensagemMilly('❌ Ops! Ocorreu um erro ao processar os cadastros. Tente novamente.', 'texto');
            this.millyCadastroEmAndamento = null;
            this.millyDadosColetados = {};
            this.millyCadastrosMultiplos = [];
            this.millyAguardandoConfirmacao = false;
        }
    }

    executarCadastroCredencialMilly(dados, mostrarMensagem = true) {
        try {
            // Verificar se o tipo existe, se não, criar
            if (!dados.tipo) {
                // Tentar extrair tipo dos dados
                const tipoVerificado = this.verificarTipoExiste(dados.tipo || '');
                if (!tipoVerificado.existe && dados.tipo) {
                    dados.tipo = this.criarTipoPersonalizado(dados.tipo);
                }
            }
            
            // Mapear tipo (para compatibilidade)
            let tipo = dados.tipo;
            const tipoMap = {
                'recepção': 'recepcao',
                'recepcao': 'recepcao',
                'medicina': 'medicina',
                'odonto': 'odonto',
                'odontologia': 'odonto',
                'laboratório': 'laboratorio',
                'laboratorio': 'laboratorio',
                'pós consulta': 'pos-consulta',
                'pos consulta': 'pos-consulta'
            };
            tipo = tipoMap[tipo] || tipo;
            
            // Salvar unidade se fornecida
            if (dados.empresa) {
                this.unidadeCredenciais = dados.empresa;
                this.salvarUnidadeCredenciais();
                this.atualizarUnidadeAtualCredenciaisInline();
            }
            
            // Criar credencial
            const credencial = {
                id: Date.now(),
                tipo: tipo,
                unidade: this.unidadeCredenciais || dados.empresa,
                dataInclusao: new Date().toISOString()
            };
            
            // Adicionar dados específicos baseado no tipo
            if (['recepcao', 'recepcao-odonto', 'laboratorio', 'pos-consulta'].includes(credencial.tipo)) {
                credencial.funcionarios = [{
                    nome: dados.nome,
                    senhas: dados.especialidade || ''
                }];
            } else if (credencial.tipo === 'medicina' || credencial.tipo === 'odonto') {
                credencial.profissionais = [{
                    tratamento: credencial.tipo === 'medicina' ? 'Dr.' : 'Dra.',
                    nome: dados.nome,
                    especialidade: dados.especialidade || 'Geral'
                }];
            }
            
            // Validar
            if (!this.validarCadastro(credencial)) {
                this.adicionarMensagemMilly('⚠️ Não foi possível cadastrar. Verifique os dados informados.', 'texto');
                this.millyCadastroEmAndamento = null;
                this.millyDadosColetados = {};
                return;
            }
            
            // Salvar
            this.credenciais.push(credencial);
            this.salvarDados();
            
            if (mostrarMensagem) {
                this.atualizarTabela();
                this.adicionarMensagemMilly('✅ Credencial cadastrada com sucesso! 🎉', 'texto');
                setTimeout(() => {
                    this.adicionarMensagemMilly(`A credencial foi adicionada à tabela. Você tem agora <strong>${this.credenciais.length}</strong> credenciais cadastradas.`, 'html');
                }, 500);
                this.millyCadastroEmAndamento = null;
                this.millyDadosColetados = {};
                this.millyCadastrosMultiplos = [];
                this.millyAguardandoConfirmacao = false;
            }
            
        } catch (error) {
            console.error('Erro ao cadastrar via Milly:', error);
            this.adicionarMensagemMilly('❌ Ops! Ocorreu um erro ao cadastrar. Tente novamente.', 'texto');
            this.millyCadastroEmAndamento = null;
            this.millyDadosColetados = {};
        }
    }

    executarCadastroTotemMilly(dados) {
        try {
            // Salvar unidade se fornecida
            if (dados.empresa) {
                this.unidadeTotem = dados.empresa;
                this.salvarUnidadeTotem();
                this.atualizarUnidadeAtual();
            }
            
            // Criar senha do totem
            const senhaTotem = {
                id: (this.gerarId && typeof this.gerarId === 'function') ? this.gerarId() : Date.now(),
                nome: dados.nome.toUpperCase(),
                ordem: dados.ordem,
                exibir: true,
                exibirNoTotem: true, // Garantir compatibilidade
                unidade: this.unidadeTotem || dados.empresa,
                cor: dados.cor || '#0066cc',
                dataCriacao: new Date().toISOString()
            };
            
            // Validar
            const validacao = this.validarSenhaTotemComMensagem(senhaTotem);
            if (!validacao.valido) {
                this.adicionarMensagemMilly(`⚠️ ${validacao.mensagem}`, 'texto');
                setTimeout(() => {
                    this.adicionarMensagemMilly('Por favor, corrija os dados e tente novamente. Posso te ajudar a coletar os dados corretos! 😊', 'texto');
                }, 500);
                // Não limpar o estado para permitir correção
                return;
            }
            
            // Salvar
            this.senhasTotem.push(senhaTotem);
            this.salvarSenhasTotem();
            this.atualizarTabelaTotem();
            
            this.adicionarMensagemMilly('✅ Senha do totem cadastrada com sucesso! 🎉', 'texto');
            setTimeout(() => {
                this.adicionarMensagemMilly(`A senha foi adicionada. Você tem agora <strong>${this.senhasTotem.length}</strong> senhas cadastradas.`, 'html');
            }, 500);
            this.millyCadastroEmAndamento = null;
            this.millyDadosColetados = {};
            this.millyAguardandoConfirmacao = false;
            
        } catch (error) {
            console.error('Erro ao cadastrar totem via Milly:', error);
            this.adicionarMensagemMilly('❌ Ops! Ocorreu um erro ao cadastrar. Tente novamente.', 'texto');
            this.millyCadastroEmAndamento = null;
            this.millyDadosColetados = {};
        }
    }

    alternarSecao(secao) {
        // Atualizar seção ativa
        this.secaoAtual = secao;
        
        // Atualizar tabs de navegação
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        if (secao === 'credenciais') {
            document.getElementById('btnCredenciais').classList.add('active');
            document.getElementById('headerTitle').textContent = 'Cadastro de Credenciais';
            // Atualizar subtítulo com contagem de credenciais individuais
            const totalCredenciaisIndividuais = this.contarCredenciaisIndividuais();
            if (totalCredenciaisIndividuais > 0) {
                document.getElementById('headerSubtitle').textContent = `Gerencie credenciais de funcionários e senhas do totem - ${totalCredenciaisIndividuais} credenciais cadastradas`;
            } else {
                document.getElementById('headerSubtitle').textContent = 'Gerencie credenciais de funcionários e senhas do totem';
            }
            document.getElementById('btnNovoCadastro').innerHTML = `
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <line x1="19" y1="8" x2="19" y2="14"/>
                    <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                <span>Novo Cadastro</span>
            `;
            // Atualizar unidade no formulário inline
            this.atualizarUnidadeAtualCredenciaisInline();
        } else {
            document.getElementById('btnSenhasTotem').classList.add('active');
            document.getElementById('headerTitle').textContent = 'Senhas do Totem';
            document.getElementById('headerSubtitle').textContent = 'Configure até 12 senhas para exibição no totem';
            document.getElementById('btnNovoCadastro').innerHTML = `
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Nova Senha</span>
            `;
            // Atualizar opções de ordem no formulário inline
            this.configurarOpcoesOrdemInline();
            // Preencher unidade do totem se já estiver definida
            this.preencherUnidadeTotemInline();
        }

        // Atualizar seções de conteúdo
        document.querySelectorAll('.secao-conteudo').forEach(section => section.classList.remove('active'));
        
        // Controlar visibilidade do botão Ver Totem
        const btnVerTotem = document.getElementById('btnVerTotem');
        
        if (secao === 'credenciais') {
            document.getElementById('secaoCredenciais').classList.add('active');
            // Ocultar botão Ver Totem na aba de credenciais
            btnVerTotem.style.display = 'none';
        } else {
            document.getElementById('secaoSenhasTotem').classList.add('active');
            
            // Mostrar/ocultar botão Ver Totem baseado na quantidade de senhas (apenas na aba de totem)
            if (this.senhasTotem.length > 0) {
                btnVerTotem.style.display = 'inline-flex';
            } else {
                btnVerTotem.style.display = 'none';
            }
        }
    }

    abrirModalTotemVisualizacao() {
        const modal = document.getElementById('modalTotem');
        const totemOptions = document.getElementById('totemOptions');
        
        // Se existem senhas cadastradas, usar elas, senão usar senhas padrão
        let senhasParaExibir = [];
        
        if (this.senhasTotem.length > 0) {
            // Usar senhas cadastradas com suas cores personalizadas e ordenar por ordem
            senhasParaExibir = [...this.senhasTotem]
                .sort((a, b) => (a.ordem || 999) - (b.ordem || 999))
                .map(senha => ({
                    nome: (senha.nome || senha.nomeSenha || '').toUpperCase(),
                    classe: this.obterClassePorNome(senha.nome || senha.nomeSenha || ''),
                    cor: senha.cor || senha.corFundo || '#48c9b0'
                }));
        } else {
            // Gerar senhas padrão baseadas na imagem
            const senhasFixas = [
                { nome: 'ATENDIMENTO ODONTO', classe: 'odonto', cor: '#48c9b0' },
                { nome: 'ATENDIMENTO MÉDICO', classe: 'medicina', cor: '#48c9b0' },
                { nome: 'EXAMES', classe: 'exames', cor: '#48c9b0' },
                { nome: 'EXAMES PREFERENCIAL', classe: 'exames-preferencial', cor: '#e74c3c' },
                { nome: 'MÉDICO PREFERENCIAL', classe: 'medicina-preferencial', cor: '#e74c3c' },
                { nome: 'ODONTO PREFERENCIAL', classe: 'odonto-preferencial', cor: '#e74c3c' }
            ];
            senhasParaExibir = senhasFixas;
        }
        
        // Calcular altura dinâmica baseada na quantidade de senhas e tamanho da tela
        const quantidadeSenhas = senhasParaExibir.length;
        
        // Calcular tamanho da fonte baseado no tamanho da tela
        const larguraTela = window.innerWidth;
        
        let fonteMinima = 14;
        let fonteMaxima = 24;
        
        if (larguraTela <= 480) {
            fonteMinima = 12;
            fonteMaxima = 18;
        } else if (larguraTela <= 768) {
            fonteMinima = 13;
            fonteMaxima = 20;
        }
        
        // Usar fonte média para melhor legibilidade
        const tamanhoFonte = Math.min(Math.max((fonteMinima + fonteMaxima) / 2, fonteMinima), fonteMaxima);
        
        // Renderizar as senhas no totem com altura flexível
        totemOptions.innerHTML = senhasParaExibir.map((senha, index) => `
            <div class="totem-option-dynamic ${senha.classe}" 
                 style="background-color: ${senha.cor}; 
                        font-size: ${tamanhoFonte}px; 
                        padding: 18px 14px;">
                <span style="display: block; text-align: center; width: 100%;">${senha.nome}</span>
            </div>
        `).join('');
        
        modal.style.display = 'block';
    }
    
    obterClassePorNome(nomeSenha) {
        // Determinar classe baseada no nome da senha
        const nome = nomeSenha.toLowerCase();
        
        if (nome.includes('preferencial')) {
            // Senhas preferenciais
            if (nome.includes('odonto')) {
                return 'odonto-preferencial';
            } else if (nome.includes('medic') || nome.includes('médic')) {
                return 'medicina-preferencial';
            } else if (nome.includes('exam')) {
                return 'exames-preferencial';
            } else {
                return 'medicina-preferencial';
            }
        } else {
            // Senhas normais
            if (nome.includes('odonto')) {
                return 'odonto';
            } else if (nome.includes('medic') || nome.includes('médic')) {
                return 'medicina';
            } else if (nome.includes('exam')) {
                return 'exames';
            } else {
                return 'medicina';
            }
        }
    }

    atualizarUnidadeAtual() {
        const container = document.getElementById('unidadeAtualContainer');
        const textoUnidade = document.getElementById('unidadeAtualTexto');
        
        if (this.unidadeTotem) {
            textoUnidade.textContent = this.unidadeTotem;
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    permitirAlterarUnidade() {
        const novaUnidade = prompt('Digite o novo nome da empresa:', this.unidadeTotem || '');
        if (novaUnidade !== null && novaUnidade.trim() !== '') {
            this.unidadeTotem = novaUnidade.trim();
            this.salvarUnidadeTotem();
            this.atualizarUnidadeAtual();
            this.mostrarNotificacao('Empresa atualizada com sucesso!', 'success');
        }
    }



    carregarUnidadeTotem() {
        try {
            return localStorage.getItem('unidadeTotem') || '';
        } catch (error) {
            console.error('Erro ao carregar empresa do totem:', error);
            return '';
        }
    }

    salvarUnidadeTotem() {
        try {
            localStorage.setItem('unidadeTotem', this.unidadeTotem);
        } catch (error) {
            console.error('Erro ao salvar empresa do totem:', error);
            this.mostrarNotificacao('Erro ao salvar empresa do totem!', 'error');
        }
    }

    configurarEventosTotem() {
        const form = document.getElementById('formSenhaTotem');
        if (!form) return;
        // Listeners para atualizar a preview
        const nomeInput = document.getElementById('nomeSenhaTotem');
        const corInput = document.getElementById('corFundoTotem');
        const corTextoInput = document.getElementById('corFundoTextoTotem');
        if (nomeInput) nomeInput.addEventListener('input', () => this.atualizarPreviewTotemModal());
        if (corInput) corInput.addEventListener('input', (e) => {
            corTextoInput && (corTextoInput.value = e.target.value);
                this.atualizarPreviewTotemModal();
            });
        if (corTextoInput) corTextoInput.addEventListener('input', (e) => {
            corInput && (corInput.value = e.target.value);
                    this.atualizarPreviewTotemModal();
        });
    }

    atualizarVisibilidadeOrdemTotem() {
        const exibirSwitch = document.getElementById('exibirNoTotem');
        const grupoOrdem = document.querySelector('label[for="ordemTotem"]').closest('.form-group');
        const selectOrdem = document.getElementById('ordemTotem');
        if (!exibirSwitch || !grupoOrdem || !selectOrdem) return;
        const ativo = exibirSwitch.checked;
        grupoOrdem.style.display = ativo ? 'block' : 'none';
        selectOrdem.disabled = !ativo;
        selectOrdem.required = ativo;
    }

    atualizarPreviewTotemModal() {
        const nomeSenha = document.getElementById('nomeSenhaTotem')?.value || 'NOME DA SENHA';
        const corFundo = document.getElementById('corFundoTotem')?.value || '#0066cc';
        const previewSenha = document.getElementById('previewSenhaTotem');
        const previewTexto = document.getElementById('previewTextoTotem');

        previewTexto.textContent = nomeSenha.toUpperCase();
        previewSenha.style.backgroundColor = corFundo;
        
        // Ajustar cor do texto baseada no contraste
        const corTexto = this.obterCorTextoContraste(corFundo);
        previewSenha.style.color = corTexto;
    }

    obterCorTextoContraste(corHex) {
        // Converter hex para RGB
        const r = parseInt(corHex.slice(1, 3), 16);
        const g = parseInt(corHex.slice(3, 5), 16);
        const b = parseInt(corHex.slice(5, 7), 16);
        
        // Calcular luminância
        const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Retornar cor contrastante
        return luminancia > 0.5 ? '#000000' : '#FFFFFF';
    }

    abrirModal(credencial = null) {
        if (this.secaoAtual === 'totem') {
            this.abrirModalTotem(credencial);
            return;
        }

        const modal = document.getElementById('modalCadastro');
        const titulo = document.getElementById('modalTitulo');
        const form = document.getElementById('formCadastro');

        // Atualizar exibição da unidade
        this.atualizarUnidadeAtualCredenciais();

        if (credencial) {
            // Modo edição
            titulo.textContent = 'Editar Cadastro';
            this.credencialEditando = credencial;
            this.preencherFormulario(credencial);
        } else {
            // Modo criação
            titulo.textContent = 'Novo Cadastro';
            this.credencialEditando = null;
            form.reset();
            this.alterarTipo('');
        }

        modal.style.display = 'block';
        
        // Focar no campo apropriado
        setTimeout(() => {
            try {
                if (this.unidadeCredenciais && this.unidadeCredenciais.trim() !== '') {
                    const tipoField = document.getElementById('tipo');
                    if (tipoField && tipoField.offsetParent !== null) {
                        tipoField.focus();
                        console.log('Foco no campo tipo');
                    }
                } else {
                    const unidadeField = document.getElementById('unidadeCredenciais');
                    const campoUnidade = document.getElementById('campoUnidadeCredenciais');
                    if (unidadeField && campoUnidade && 
                        campoUnidade.style.display !== 'none' && 
                        unidadeField.offsetParent !== null) {
                        unidadeField.focus();
                        console.log('Foco no campo unidade');
                    }
                }
            } catch (error) {
                console.log('Erro ao focar campo:', error);
            }
        }, 150);
    }

    abrirModalTotem(senhaTotem = null) {
        // Verificar limite de 12 senhas apenas para novos cadastros
        if (!senhaTotem && this.senhasTotem.length >= 12) {
            this.mostrarNotificacao('Limite máximo de 12 senhas do totem atingido!', 'error');
            return;
        }

        const modal = document.getElementById('modalSenhaTotem');
        const titulo = document.getElementById('modalTituloTotem');
        const form = document.getElementById('formSenhaTotem');

        // Preencher unidade (sempre)
        const unidadeInput = document.getElementById('unidadeTotem');
        if (this.unidadeTotem) {
            unidadeInput.value = this.unidadeTotem;
            unidadeInput.disabled = true;
        } else {
            unidadeInput.disabled = false;
            unidadeInput.focus();
        }

        // Configurar opções de ordem
        this.configurarOpcoesOrdem();

        if (senhaTotem) {
            // Modo edição
            titulo.textContent = 'Editar Senha do Totem';
            this.senhaTotemEditando = senhaTotem;
            this.preencherFormularioTotem(senhaTotem);
        } else {
            // Modo criação
            titulo.textContent = 'Nova Senha do Totem';
            this.senhaTotemEditando = null;
            form.reset();
            // Resetar valores padrão
            document.getElementById('corFundoTotem').value = '#0066cc';
            document.getElementById('corFundoTextoTotem').value = '#0066cc';
            
            // Preencher unidade novamente após reset
            if (this.unidadeTotem) {
                unidadeInput.value = this.unidadeTotem;
                unidadeInput.disabled = true;
            }
            
            this.atualizarPreviewTotemModal();
        }

        modal.style.display = 'block';
        
        // Focar no campo apropriado
        if (this.unidadeTotem) {
            document.getElementById('nomeSenhaTotem').focus();
        } else {
            document.getElementById('unidadeTotem').focus();
        }
    }

    configurarOpcoesOrdem() {
        const selectOrdem = document.getElementById('ordemTotem');
        selectOrdem.innerHTML = '<option value="">Selecione a posição</option>';
        
        // Criar opções de 1 a 12
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('option');
            option.value = i;
            
            // Verificar se a posição está ocupada
            const posicaoOcupada = this.senhasTotem.some(s => 
                s.exibir !== false && s.ordem === i && (!this.senhaTotemEditando || s.id !== this.senhaTotemEditando.id)
            );
            
            if (posicaoOcupada) {
                const senhaNaPosicao = this.senhasTotem.find(s => s.ordem === i);
                option.textContent = `${i}ª posição (Ocupada: ${senhaNaPosicao.nome || ''})`;
                option.disabled = true;
            } else {
                option.textContent = `${i}ª posição`;
            }
            
            selectOrdem.appendChild(option);
        }
    }

    preencherFormularioTotem(senhaTotem = {}) {
        // Preencher dados no formulário do totem
        document.getElementById('unidadeTotem').value = this.unidadeTotem || senhaTotem.unidade || '';
        document.getElementById('ordemTotem').value = senhaTotem.ordem || 1;
        const exibirSwitch = document.getElementById('exibirNoTotem');
        if (exibirSwitch) {
            exibirSwitch.checked = senhaTotem.exibir !== false; // padrão true
            this.atualizarVisibilidadeOrdemTotem();
        }
        document.getElementById('corFundoTotem').value = senhaTotem.cor || '#0066cc';
        document.getElementById('corFundoTextoTotem').value = senhaTotem.cor || '#0066cc';
        document.getElementById('nomeSenhaTotem').value = senhaTotem.nome || '';
        setTimeout(() => this.atualizarPreviewTotemModal(), 100);
    }

    fecharModal(modal = null) {
        if (!modal) {
            modal = document.getElementById('modalCadastro');
        }
        modal.style.display = 'none';
        
        if (modal.id === 'modalCadastro') {
            document.getElementById('formCadastro').reset();
            this.alterarTipo('');
            this.credencialEditando = null;
        }
    }

    alterarTipo(tipo) {
        const camposRecepcao = document.getElementById('camposRecepcao');
        const camposMedOdonto = document.getElementById('camposMedOdonto');
        const campoNovoTipo = document.getElementById('campoNovoTipo');

        // Esconder todos os campos específicos
        camposRecepcao.style.display = 'none';
        camposMedOdonto.style.display = 'none';
        campoNovoTipo.style.display = 'none';

        // Verificar se é um tipo personalizado
        const tipoPersonalizado = this.tiposPersonalizados.find(t => t.valor === tipo);

        // Mostrar campos específicos baseado no tipo
        if (tipo === 'novo-tipo') {
            // Mostrar campo para criar novo tipo
            campoNovoTipo.style.display = 'block';
            document.getElementById('novoTipoNome').required = true;
        } else if (tipoPersonalizado || ['recepcao', 'recepcao-odonto', 'laboratorio', 'pos-consulta'].includes(tipo)) {
            // Para tipos personalizados ou tipos de funcionários padrão
            camposRecepcao.style.display = 'block';
            this.inicializarTabelaFuncionarios();
            document.getElementById('novoTipoNome').required = false;
        } else if (tipo === 'medicina' || tipo === 'odonto') {
            // Para medicina/odonto (sempre usar tabela de profissionais)
            camposMedOdonto.style.display = 'block';
            this.inicializarTabelaProfissionais();
            document.getElementById('novoTipoNome').required = false;
        } else {
            document.getElementById('novoTipoNome').required = false;
        }
    }

    inicializarTabelaProfissionais() {
        const tbody = document.getElementById('profissionaisTableBody');
        tbody.innerHTML = '';
        
        // Gerar 3 linhas iniciais ao invés de 10
        for (let i = 0; i < 3; i++) {
            this.adicionarLinhaProfissional();
        }

        // Configurar botão para mais linhas - adicionar apenas 1 linha
        const btnMaisLinhas = document.getElementById('btnMaisLinhas');
        btnMaisLinhas.onclick = () => {
            this.adicionarLinhaProfissional();
        };
    }

    adicionarLinhaProfissional() {
        const tbody = document.getElementById('profissionaisTableBody');
        const index = tbody.children.length;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <select name="tratamento_${index}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">Selecione...</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Dra.">Dra.</option>
                    <option value="Prof.">Prof.</option>
                    <option value="Prof.ª">Prof.ª</option>
                    <option value="Sr.">Sr.</option>
                    <option value="Sra.">Sra.</option>
                </select>
            </td>
            <td>
                <input type="text" name="nome_${index}" placeholder="Nome e sobrenome do profissional" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td>
                <input type="text" name="especialidade_${index}" placeholder="Especialidade" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
        `;
        
        tbody.appendChild(tr);
    }

    inicializarTabelaFuncionarios() {
        const tbody = document.getElementById('funcionariosTableBody');
        tbody.innerHTML = '';
        
        // Gerar 3 linhas iniciais ao invés de 10
        for (let i = 0; i < 3; i++) {
            this.adicionarLinhaFuncionario();
        }

        // Configurar botão para mais linhas - adicionar apenas 1 linha
        const btnMaisLinhas = document.getElementById('btnMaisLinhasFuncionarios');
        btnMaisLinhas.onclick = () => {
            this.adicionarLinhaFuncionario();
        };
    }

    adicionarLinhaFuncionario() {
        const tbody = document.getElementById('funcionariosTableBody');
        const index = tbody.children.length;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <input type="text" name="nome_funcionario_${index}" placeholder="Nome e sobrenome do funcionário" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td>
                <input type="text" name="senhas_funcionario_${index}" placeholder="Ex: Medicina Geral, Cardiologia..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
        `;
        
        tbody.appendChild(tr);
    }

    coletarDadosProfissionais(formData) {
        const profissionais = [];
        const tbody = document.getElementById('profissionaisTableBody');
        
        for (let i = 0; i < tbody.children.length; i++) {
            const tratamento = formData.get(`tratamento_${i}`);
            const nome = formData.get(`nome_${i}`)?.trim();
            const especialidade = formData.get(`especialidade_${i}`)?.trim();
            
            // Só adicionar se pelo menos o nome estiver preenchido
            if (nome) {
                profissionais.push({
                    tratamento: tratamento || '',
                    nome: nome,
                    especialidade: especialidade || ''
                });
            }
        }
        
        return profissionais;
    }

    preencherTabelaProfissionais(profissionais) {
        const tbody = document.getElementById('profissionaisTableBody');
        
        // Preencher os dados existentes
        profissionais.forEach((profissional, index) => {
            if (index < tbody.children.length) {
                const row = tbody.children[index];
                const tratamentoSelect = row.querySelector(`select[name="tratamento_${index}"]`);
                const nomeInput = row.querySelector(`input[name="nome_${index}"]`);
                const especialidadeInput = row.querySelector(`input[name="especialidade_${index}"]`);
                
                if (tratamentoSelect) tratamentoSelect.value = profissional.tratamento || '';
                if (nomeInput) nomeInput.value = profissional.nome || '';
                if (especialidadeInput) especialidadeInput.value = profissional.especialidade || '';
            }
        });
    }

    coletarDadosFuncionarios(formData) {
        const funcionarios = [];
        const tbody = document.getElementById('funcionariosTableBody');
        
        for (let i = 0; i < tbody.children.length; i++) {
            const nome = formData.get(`nome_funcionario_${i}`)?.trim();
            const senhas = formData.get(`senhas_funcionario_${i}`)?.trim();
            
            // Só adicionar se pelo menos o nome estiver preenchido
            if (nome) {
                funcionarios.push({
                    nome: nome,
                    senhas: senhas || ''
                });
            }
        }
        
        return funcionarios;
    }

    preencherTabelaFuncionarios(funcionarios) {
        const tbody = document.getElementById('funcionariosTableBody');
        
        // Preencher os dados existentes
        funcionarios.forEach((funcionario, index) => {
            if (index < tbody.children.length) {
                const row = tbody.children[index];
                const nomeInput = row.querySelector(`input[name="nome_funcionario_${index}"]`);
                const senhasInput = row.querySelector(`input[name="senhas_funcionario_${index}"]`);
                
                if (nomeInput) nomeInput.value = funcionario.nome || '';
                if (senhasInput) senhasInput.value = funcionario.senhas || '';
            }
        });
    }

    preencherFormulario(credencial) {
        document.getElementById('tipo').value = credencial.tipo;
        
        // Garantir que a unidade esteja definida
        if (credencial.unidade && !this.unidadeCredenciais) {
            this.unidadeCredenciais = credencial.unidade;
        }

        this.alterarTipo(credencial.tipo);

        if (['recepcao', 'recepcao-odonto', 'laboratorio', 'pos-consulta'].includes(credencial.tipo)) {
            // Para outros tipos, preencher a tabela de funcionários
            this.preencherTabelaFuncionarios(credencial.funcionarios || []);
        } else if (credencial.tipo === 'medicina' || credencial.tipo === 'odonto') {
            // Para medicina/odonto, preencher a tabela de profissionais
            this.preencherTabelaProfissionais(credencial.profissionais || []);
        }
    }

    salvarCadastro(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Processar tipo personalizado se necessário
        let tipoSelecionado = formData.get('tipo');
        if (tipoSelecionado === 'novo-tipo') {
            const novoTipoValor = this.processarNovoTipo(formData);
            if (!novoTipoValor) {
                return; // Erro no processamento do novo tipo
            }
            tipoSelecionado = novoTipoValor;
        }
        


        // Verificar e salvar unidade se fornecida
        const campoUnidadeVisivel = document.getElementById('campoUnidadeCredenciais');
        const inputUnidade = document.getElementById('unidadeCredenciais');
        
        // Só tentar coletar se o campo estiver realmente visível e acessível
        if (campoUnidadeVisivel && 
            campoUnidadeVisivel.style.display !== 'none' && 
            inputUnidade && 
            !inputUnidade.disabled) {
            
            const unidadeInput = inputUnidade.value || formData.get('unidadeCredenciais');
            if (unidadeInput && unidadeInput.trim()) {
                this.unidadeCredenciais = unidadeInput.trim();
                this.salvarUnidadeCredenciais();
                this.atualizarUnidadeAtualCredenciais();
            }
        }
        
        const credencial = {
            id: this.credencialEditando ? this.credencialEditando.id : Date.now(),
            tipo: tipoSelecionado,
            unidade: this.unidadeCredenciais,
            dataInclusao: this.credencialEditando ? this.credencialEditando.dataInclusao : new Date().toISOString()
        };

        // Verificar se é um tipo personalizado
        const tipoPersonalizado = this.tiposPersonalizados.find(t => t.valor === tipoSelecionado);

        // Adicionar campos específicos baseado no tipo
        if (tipoPersonalizado || ['recepcao', 'recepcao-odonto', 'laboratorio', 'pos-consulta'].includes(credencial.tipo)) {
            credencial.funcionarios = this.coletarDadosFuncionarios(formData);
        } else if (credencial.tipo === 'medicina' || credencial.tipo === 'odonto') {
            credencial.profissionais = this.coletarDadosProfissionais(formData);
        }

        // Validar dados
        if (!this.validarCadastro(credencial)) {
            return;
        }

        // Salvar ou atualizar
        if (this.credencialEditando) {
            const index = this.credenciais.findIndex(c => c.id === this.credencialEditando.id);
            this.credenciais[index] = credencial;
        } else {
            this.credenciais.push(credencial);
        }

        this.salvarDados();
        this.atualizarTabela();
        this.fecharModal();
        
        this.mostrarNotificacao(
            this.credencialEditando ? 'Cadastro atualizado com sucesso!' : 'Cadastro criado com sucesso!',
            'success'
        );
    }

    validarCadastro(credencial) {
        if (!credencial.tipo) {
            this.mostrarNotificacao('Tipo é obrigatório!', 'error');
            return false;
        }



        // Verificar se a unidade está definida (globalmente ou no cadastro)
        if (!this.unidadeCredenciais && !credencial.unidade) {
            this.mostrarNotificacao('Nome da empresa é obrigatório!', 'error');
            return false;
        }

        // Verificar se é um tipo personalizado
        const tipoPersonalizado = this.tiposPersonalizados.find(t => t.valor === credencial.tipo);

        // Validação específica por tipo
        if (tipoPersonalizado || ['recepcao', 'recepcao-odonto', 'laboratorio', 'pos-consulta'].includes(credencial.tipo)) {
            if (!credencial.funcionarios || credencial.funcionarios.length === 0) {
                this.mostrarNotificacao('Pelo menos um funcionário deve ser cadastrado!', 'error');
                return false;
            }
        } else if (credencial.tipo === 'medicina' || credencial.tipo === 'odonto') {
            if (!credencial.profissionais || credencial.profissionais.length === 0) {
                this.mostrarNotificacao('Pelo menos um profissional deve ser cadastrado!', 'error');
                return false;
            }
        }

        if (credencial.tipo === 'totem' && !credencial.nomeSenha) {
            this.mostrarNotificacao('Nome da senha é obrigatório para Totem!', 'error');
            return false;
        }

        // Não há mais validação de nome duplicado já que não temos campo nomeCompleto único

        return true;
    }

    excluirCadastro(id) {
        const credencial = this.credenciais.find(c => c.id === id);
        if (!credencial) return;

        // Determinar o nome a ser exibido baseado no tipo
        let nomeExibicao = '';
        if (credencial.tipo === 'medicina' || credencial.tipo === 'odonto') {
            if (credencial.profissionais && credencial.profissionais.length > 0) {
                nomeExibicao = credencial.profissionais.length === 1 
                    ? `${credencial.profissionais[0].tratamento} ${credencial.profissionais[0].nome}`
                    : `${credencial.profissionais.length} profissionais`;
            } else {
                nomeExibicao = credencial.nomeCompleto || 'Cadastro';
            }
        } else {
            if (credencial.funcionarios && credencial.funcionarios.length > 0) {
                nomeExibicao = credencial.funcionarios.length === 1 
                    ? credencial.funcionarios[0].nome
                    : `${credencial.funcionarios.length} funcionários`;
            } else {
                nomeExibicao = credencial.nomeCompleto || 'Cadastro';
            }
        }

        document.getElementById('nomeExclusao').textContent = nomeExibicao;
        document.getElementById('modalConfirmacao').style.display = 'block';
        this.credencialParaExcluir = id;
    }

    confirmarExclusao() {
        if (this.credencialParaExcluir) {
            this.credenciais = this.credenciais.filter(c => c.id !== this.credencialParaExcluir);
            this.salvarDados();
            this.atualizarTabela();
            this.fecharModal(document.getElementById('modalConfirmacao'));
            this.mostrarNotificacao('Cadastro excluído com sucesso!', 'success');
            this.credencialParaExcluir = null;
        } else if (this.senhaTotemParaExcluir) {
            this.senhasTotem = this.senhasTotem.filter(s => s.id !== this.senhaTotemParaExcluir);
            this.salvarSenhasTotem();
            this.atualizarTabelaTotem();
            this.fecharModal(document.getElementById('modalConfirmacao'));
            this.mostrarNotificacao('Senha do totem excluída com sucesso!', 'success');
            this.senhaTotemParaExcluir = null;
            
            // Atualizar visibilidade do botão Ver Totem
            if (this.secaoAtual === 'totem') {
                const btnVerTotem = document.getElementById('btnVerTotem');
                if (this.senhasTotem.length > 0) {
                    btnVerTotem.style.display = 'inline-flex';
                } else {
                    btnVerTotem.style.display = 'none';
                }
            }
        }
    }

    atualizarTabela() {
        const tbody = document.getElementById('corpoTabela');
        const mensagemVazia = document.getElementById('mensagemVazia');
        const tableContainer = document.querySelector('.table-container');

        if (this.credenciais.length === 0) {
            tableContainer.style.display = 'none';
            mensagemVazia.style.display = 'block';
            // Atualizar subtítulo quando não há credenciais
            if (this.secaoAtual === 'credenciais') {
                document.getElementById('headerSubtitle').textContent = 'Gerencie credenciais de funcionários e senhas do totem';
            }
            return;
        }

        tableContainer.style.display = 'block';
        mensagemVazia.style.display = 'none';
        
        // Atualizar subtítulo com contagem de credenciais individuais
        if (this.secaoAtual === 'credenciais') {
            const totalCredenciaisIndividuais = this.contarCredenciaisIndividuais();
            document.getElementById('headerSubtitle').textContent = `Gerencie credenciais de funcionários e senhas do totem - ${totalCredenciaisIndividuais} credenciais cadastradas`;
        }

        tbody.innerHTML = this.credenciais.map(credencial => {
            const especialidade = this.formatarEspecialidade(credencial);
            const badge = this.obterBadge(credencial.tipo);
            const nomeCompleto = this.formatarNomeCompleto(credencial);
            
            return `
                <tr>
                    <td>${nomeCompleto}</td>
                    <td>${badge}</td>
                    <td style="color: #000; font-weight: normal; font-size: 14px;">${(credencial.unidade || '').toUpperCase()}</td>
                    <td>${especialidade}</td>
                    <td>
                        <div class="acoes-btn">
                            <button class="btn btn-secondary btn-sm" data-acao="editar" data-index="${credencial.id}">
                                <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </button>
                            <button class="btn btn-danger btn-sm" data-acao="excluir" data-index="${credencial.id}">
                                <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Delegação de eventos para botões
        tbody.querySelectorAll('.acoes-btn button').forEach(btn => {
            btn.onclick = (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-index'));
                const acao = e.currentTarget.getAttribute('data-acao');
                if (acao === 'editar') this.editarCredencial(id);
                if (acao === 'excluir') this.excluirCadastro(id);
            };
        });
    }

    formatarNomeCompleto(credencial) {
        let nomeTexto = '';
        
        if (credencial.tipo === 'medicina' || credencial.tipo === 'odonto') {
            if (credencial.profissionais && credencial.profissionais.length > 0) {
                const count = credencial.profissionais.length;
                nomeTexto = count === 1 
                    ? `${credencial.profissionais[0].tratamento} ${credencial.profissionais[0].nome}`
                    : `${count} PROFISSIONAIS`;
            } else {
                // Compatibilidade com formato antigo
                const tratamento = credencial.tratamento || 'Dr.';
                nomeTexto = `${tratamento} ${credencial.nomeCompleto || 'Nome não informado'}`;
            }
        } else {
            if (credencial.funcionarios && credencial.funcionarios.length > 0) {
                const count = credencial.funcionarios.length;
                nomeTexto = count === 1 
                    ? credencial.funcionarios[0].nome
                    : `${count} FUNCIONÁRIOS`;
            } else {
                // Compatibilidade com formato antigo
                nomeTexto = credencial.nomeCompleto || 'Nome não informado';
            }
        }
        
        return `<span style="color: #000; font-weight: normal; font-size: 14px;">${nomeTexto.toUpperCase()}</span>`;
    }

    formatarEspecialidade(credencial) {
        switch (credencial.tipo) {
            case 'recepcao':
            case 'recepcao-odonto':
            case 'laboratorio':
            case 'pos-consulta':
                if (credencial.funcionarios && credencial.funcionarios.length > 0) {
                    const count = credencial.funcionarios.length;
                    const primeiro = credencial.funcionarios[0];
                    const texto = count === 1 
                        ? `${primeiro.nome}${primeiro.senhas ? ' - ' + primeiro.senhas : ''}`
                        : `${count} funcionários cadastrados`;
                    return `<div class="detalhes-recepcao" style="color: #000; font-weight: normal; font-size: 14px;">${texto.toUpperCase()}</div>`;
                }
                // Compatibilidade com formato antigo
                return `<div class="detalhes-recepcao" style="color: #000; font-weight: normal; font-size: 14px;">SENHAS: ${(credencial.senhasRecepcao || '-').toString().toUpperCase()}</div>`;
            case 'medicina':
            case 'odonto':
                if (credencial.profissionais && credencial.profissionais.length > 0) {
                    // Extrair todas as especialidades únicas
                    const especialidades = credencial.profissionais
                        .map(p => p.especialidade)
                        .filter(esp => esp && esp.trim())
                        .filter((esp, index, arr) => arr.indexOf(esp) === index); // remover duplicatas
                    
                    const textoEspecialidades = especialidades.length > 0 
                        ? especialidades.join(', ')
                        : 'ESPECIALIDADE NÃO INFORMADA';
                    
                    return `<div class="detalhes-profissional" style="color: #000; font-weight: normal; font-size: 14px;">${textoEspecialidades.toUpperCase()}</div>`;
                }
                // Compatibilidade com formato antigo
                return `<div class="detalhes-profissional" style="color: #000; font-weight: normal; font-size: 14px;">${(credencial.especialidade || '-').toString().toUpperCase()}</div>`;
            case 'totem':
                return `<div class="detalhes-totem" style="color: #000; font-weight: normal; font-size: 14px;">
                    <div class="cor-totem" style="background-color: ${credencial.corFundo}"></div>
                    <span class="nome-senha-totem">${credencial.nomeSenha.toUpperCase()}</span>
                </div>`;
            default:
                return `<span style="color: #000; font-weight: normal; font-size: 14px;">-</span>`;
        }
    }

    // Método antigo mantido para compatibilidade com exportação
    formatarDetalhes(credencial) {
        switch (credencial.tipo) {
            case 'recepcao':
            case 'recepcao-odonto':
            case 'laboratorio':
            case 'pos-consulta':
                if (credencial.funcionarios && credencial.funcionarios.length > 0) {
                    return credencial.funcionarios.map(f => 
                        `${f.nome}${f.senhas ? ' - ' + f.senhas : ''}`
                    ).join(', ');
                }
                // Compatibilidade com formato antigo
                return `Senhas: ${credencial.senhasRecepcao || '-'}`;
            case 'medicina':
            case 'odonto':
                if (credencial.profissionais && credencial.profissionais.length > 0) {
                    return credencial.profissionais.map(p => 
                        `${p.tratamento} ${p.nome}${p.especialidade ? ' - ' + p.especialidade : ''}`
                    ).join(', ');
                }
                // Compatibilidade com formato antigo
                return `${credencial.tratamento || 'Dr.'} ${credencial.especialidade || '-'}`;
            case 'totem':
                return `${credencial.nomeSenha} (${credencial.corFundo})`;
            default:
                return '-';
        }
    }

    obterBadge(tipo) {
        const badges = {
            'recepcao': '<span class="badge badge-recepcao" style="color: #000; background-color: #f8f9fa; font-weight: normal; font-size: 14px;">RECEPÇÃO MÉDICA</span>',
            'recepcao-odonto': '<span class="badge badge-recepcao" style="color: #000; background-color: #f8f9fa; font-weight: normal; font-size: 14px;">RECEPÇÃO ODONTO</span>',
            'medicina': '<span class="badge badge-medicina" style="color: #000; background-color: #f8f9fa; font-weight: normal; font-size: 14px;">MEDICINA</span>',
            'odonto': '<span class="badge badge-odonto" style="color: #000; background-color: #f8f9fa; font-weight: normal; font-size: 14px;">ODONTOLOGIA</span>',
            'laboratorio': '<span class="badge badge-laboratorio" style="color: #000; background-color: #f8f9fa; font-weight: normal; font-size: 14px;">LABORATÓRIO</span>',
            'pos-consulta': '<span class="badge badge-pos-consulta" style="color: #000; background-color: #f8f9fa; font-weight: normal; font-size: 14px;">PÓS CONSULTA</span>',
            'totem': '<span class="badge badge-totem" style="color: #000; background-color: #f8f9fa; font-weight: normal; font-size: 14px;">TOTEM</span>'
        };
        return badges[tipo] || `<span style="color: #000; background-color: #f8f9fa; font-weight: normal; font-size: 14px;">${tipo.toUpperCase()}</span>`;
    }

    filtrarTabela(termo) {
        const rows = document.querySelectorAll('#corpoTabela tr');
        termo = termo.toLowerCase();

        rows.forEach(row => {
            const texto = row.textContent.toLowerCase();
            row.style.display = texto.includes(termo) ? '' : 'none';
        });
    }

    atualizarTabelaTotem() {
        const tbody = document.getElementById('corpoTabelaTotem');
        const mensagemVazia = document.getElementById('mensagemVaziaTotem');
        const tableContainer = document.querySelector('#secaoSenhasTotem .table-container');

        if (this.senhasTotem.length === 0) {
            tableContainer.style.display = 'none';
            mensagemVazia.style.display = 'block';
            return;
        }

        tableContainer.style.display = 'block';
        mensagemVazia.style.display = 'none';

        // Adicionar contador de senhas
        let contadorHtml = '';
        if (this.senhasTotem.length > 0) {
            const isLimiteProximo = this.senhasTotem.length >= 10;
            const isLimiteAtingido = this.senhasTotem.length >= 12;
            
            contadorHtml = `
                <div class="totem-contador ${isLimiteAtingido ? 'limite-atingido' : ''}">
                    <strong>${this.senhasTotem.length}/12</strong> senhas cadastradas
                    ${isLimiteAtingido ? '<br><strong>Limite máximo atingido!</strong>' : 
                      isLimiteProximo ? `<br>Restam apenas <strong>${12 - this.senhasTotem.length}</strong> senhas` : ''}
                </div>
            `;
        }

        // Inserir contador antes da tabela
        if (contadorHtml) {
            const searchBar = document.querySelector('#secaoSenhasTotem .search-bar');
            const existingCounter = document.querySelector('#secaoSenhasTotem .totem-contador');
            if (existingCounter) {
                existingCounter.remove();
            }
            searchBar.insertAdjacentHTML('afterend', contadorHtml);
        }

        // Ordenar senhas por ordem antes de renderizar
        const senhasOrdenadas = [...this.senhasTotem].sort((a, b) => {
            const aKey = (a.exibir === false || !a.ordem) ? 999 : a.ordem;
            const bKey = (b.exibir === false || !b.ordem) ? 999 : b.ordem;
            return aKey - bKey;
        });

        tbody.innerHTML = senhasOrdenadas.map((senhaTotem, index) => {
            const dataFormatada = senhaTotem.dataCriacao 
                ? new Date(senhaTotem.dataCriacao).toLocaleDateString('pt-BR')
                : new Date().toLocaleDateString('pt-BR');
            const exibir = senhaTotem.exibir !== false;
            return `
                <tr>
                    <td><strong>${senhaTotem.ordem || '-'}ª</strong></td>
                    <td><strong>${senhaTotem.nome || ''}</strong></td>
                    <td>
                        <div class="detalhes-totem">
                            <div class="cor-totem" style="background-color: ${senhaTotem.cor || '#0066cc'}"></div>
                            <span>${senhaTotem.cor || '#0066cc'}</span>
                        </div>
                    </td>
                    <td>
                        <div class="preview-senha" style="background-color: ${senhaTotem.cor || '#0066cc'}; color: ${this.obterCorTextoContraste(senhaTotem.cor || '#0066cc')}; padding: 8px 16px; border-radius: 4px; font-size: 12px; text-align: center; font-weight: bold;">
                            ${(senhaTotem.nome || '').toUpperCase()}
                        </div>
                    </td>
                    <td>${exibir ? 'Sim' : 'Não'}</td>
                    <td>${dataFormatada}</td>
                    <td>
                        <div class="acoes-btn">
                            <button class="btn btn-secondary btn-sm" data-acao="editar" data-index="${index}">
                                <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </button>
                            <button class="btn btn-danger btn-sm" data-acao="excluir" data-index="${index}">
                                <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Delegação de eventos para botões
        tbody.querySelectorAll('.acoes-btn button').forEach(btn => {
            btn.onclick = (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                const acao = e.currentTarget.getAttribute('data-acao');
                const item = senhasOrdenadas[idx];
                if (!item) return;
                const originalIndex = this.senhasTotem.findIndex(s => s.id === item.id);
                if (acao === 'editar') this.editarSenhaTotem(item.id);
                if (acao === 'excluir') this.excluirSenhaTotem(item.id);
            };
        });
    }

    excluirSenhaTotem(id) {
        const senhaTotem = this.senhasTotem.find(s => s.id === id);
        if (!senhaTotem) return;

        document.getElementById('nomeExclusao').textContent = senhaTotem.nome || senhaTotem.nomeSenha || 'Senha';
        document.getElementById('modalConfirmacao').style.display = 'block';
        this.senhaTotemParaExcluir = id;
    }

    filtrarTabelaTotem(termo) {
        const rows = document.querySelectorAll('#corpoTabelaTotem tr');
        termo = termo.toLowerCase();

        rows.forEach(row => {
            const texto = row.textContent.toLowerCase();
            row.style.display = texto.includes(termo) ? '' : 'none';
        });
    }

    exportarExcel() {
        if (this.secaoAtual === 'totem') {
            this.exportarExcelTotem();
            return;
        }

        if (this.credenciais.length === 0) {
            this.mostrarNotificacao('Não há dados para exportar!', 'error');
            return;
        }

        // Preparar dados agrupados por tipo
        const dadosExportacao = [];
        
        // Adicionar nome da unidade no topo
        if (this.unidadeCredenciais) {
            dadosExportacao.push([this.unidadeCredenciais]);
            dadosExportacao.push(['']); // Linha vazia
        }

        // Agrupar credenciais por tipo
        const credenciaisPorTipo = {
            medicina: this.credenciais.filter(c => c.tipo === 'medicina'),
            recepcao: this.credenciais.filter(c => c.tipo === 'recepcao'),
            'recepcao-odonto': this.credenciais.filter(c => c.tipo === 'recepcao-odonto'),
            odonto: this.credenciais.filter(c => c.tipo === 'odonto'),
            laboratorio: this.credenciais.filter(c => c.tipo === 'laboratorio'),
            'pos-consulta': this.credenciais.filter(c => c.tipo === 'pos-consulta')
        };

        // Exportar cada tipo
        Object.entries(credenciaisPorTipo).forEach(([tipo, credenciais]) => {
            if (credenciais.length > 0) {
                // Adicionar cabeçalho do tipo
                const tipoTexto = this.obterTipoTexto(tipo).toLowerCase();
                dadosExportacao.push([`tipo (${tipoTexto})`]);

                // Adicionar credenciais do tipo
                credenciais.forEach(credencial => {
                    let textoCredencial = '';
                    
                    if (tipo === 'medicina' || tipo === 'odonto') {
                        if (credencial.profissionais && credencial.profissionais.length > 0) {
                            // Novo formato com múltiplos profissionais
                            credencial.profissionais.forEach(profissional => {
                                const tratamento = profissional.tratamento || '';
                                const nome = profissional.nome || '';
                                const especialidade = profissional.especialidade || '';
                                
                                let profissionalFormatado = '';
                                if (tratamento && nome && especialidade) {
                                    profissionalFormatado = `${tratamento} ${nome} - ${especialidade}`;
                                } else if (nome && especialidade) {
                                    profissionalFormatado = `${nome} - ${especialidade}`;
                                } else if (nome) {
                                    profissionalFormatado = nome;
                                }
                                
                                if (profissionalFormatado) {
                                    dadosExportacao.push([profissionalFormatado]);
                                }
                            });
                            return; // Pular o push individual abaixo
                        } else {
                            // Formato antigo (compatibilidade)
                            const tratamento = (credencial.tratamento || 'dr.').toLowerCase();
                            const especialidadeFormatada = tipo === 'odonto' ? 'dentista' : 
                                                          credencial.especialidade?.toLowerCase() || 'especialista';
                            textoCredencial = `${tratamento} ${credencial.nomeCompleto.toLowerCase()} - ${especialidadeFormatada}`;
                        }
                    } else {
                        // Para recepção, recepção odonto, laboratório e pós consulta
                        if (credencial.funcionarios && credencial.funcionarios.length > 0) {
                            // Novo formato com múltiplos funcionários
                            credencial.funcionarios.forEach(funcionario => {
                                const senhas = funcionario.senhas ? funcionario.senhas.toLowerCase() : 'geral';
                                const textoFuncionario = `${funcionario.nome.toLowerCase()} - ${senhas}`;
                                dadosExportacao.push([textoFuncionario]);
                            });
                            return; // Pular o push individual abaixo
                        } else {
                            // Formato antigo (compatibilidade)
                            const senhas = credencial.senhasRecepcao ? 
                                          credencial.senhasRecepcao.toLowerCase() : 'geral';
                            textoCredencial = `${credencial.nomeCompleto.toLowerCase()} - ${senhas}`;
                        }
                    }

                    dadosExportacao.push([textoCredencial]);
                });

                // Linha vazia entre tipos
                dadosExportacao.push(['']);
            }
        });

        // Criar workbook e worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(dadosExportacao);

        // Ajustar largura da coluna
        ws['!cols'] = [{ wch: 60 }];

        // Adicionar worksheet ao workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Credenciais');

        // Gerar nome do arquivo com unidade e data atual
        const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        const unidadeNome = this.unidadeCredenciais ? 
            this.unidadeCredenciais.replace(/[<>:"/\\|?*]/g, '') : 'SemUnidade';
        const nomeArquivo = `${unidadeNome}_credenciais_${dataAtual}.xlsx`;

        // Fazer download
        XLSX.writeFile(wb, nomeArquivo);
        
        this.mostrarNotificacao('Arquivo Excel exportado com sucesso!', 'success');
    }

    exportarExcelTotem() {
        if (this.senhasTotem.length === 0) {
            this.mostrarNotificacao('Não há senhas do totem para exportar!', 'error');
            return;
        }

        // Preparar dados para exportação no formato solicitado
        const dadosExportacao = [];
        
        // Adicionar nome da unidade no topo se existir
        if (this.unidadeTotem) {
            dadosExportacao.push([this.unidadeTotem, '']);
            dadosExportacao.push(['', '']); // Linha vazia
        }

        // Função para gerar código aleatório
        const gerarCodigo = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let codigo = '#';
            for (let i = 0; i < 6; i++) {
                codigo += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return codigo;
        };

        // Adicionar cada senha com código
        this.senhasTotem.forEach(senhaTotem => {
            const nomeSenhaUpper = (senhaTotem.nome || senhaTotem.nomeSenha || '').toUpperCase();
            const codigo = gerarCodigo();
            dadosExportacao.push([nomeSenhaUpper, codigo]);
        });

        // Criar workbook e worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(dadosExportacao);

        // Ajustar largura das colunas
        ws['!cols'] = [
            { wch: 30 }, // Nome da Senha
            { wch: 15 }  // Código
        ];

        // Adicionar worksheet ao workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Senhas do Totem');

        // Gerar nome do arquivo com unidade e data atual
        const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        const unidadeNome = this.unidadeTotem ? 
            this.unidadeTotem.replace(/[<>:"/\\|?*]/g, '') : 'SemUnidade';
        const nomeArquivo = `${unidadeNome}_senhas_totem_${dataAtual}.xlsx`;

        // Fazer download
        XLSX.writeFile(wb, nomeArquivo);
        
        this.mostrarNotificacao('Arquivo Excel de senhas do totem exportado com sucesso!', 'success');
    }

    async exportarDados() {
        try {
            const temCredenciais = this.credenciais.length > 0;
            const temSenhasTotem = this.senhasTotem.length > 0;

            if (!temCredenciais && !temSenhasTotem) {
                this.mostrarNotificacao('Não há dados para exportar!', 'error');
                return;
            }

            this.mostrarNotificacao('Preparando arquivos para download...', 'info');

            // Gerar e baixar arquivo de credenciais se existir dados
            if (temCredenciais) {
                const workbookCredenciais = this.gerarExcelCredenciais();
                const blobCredenciais = new Blob([workbookCredenciais], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
                
                const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
                const unidadeNome = this.unidadeCredenciais ? 
                    this.unidadeCredenciais.replace(/[<>:"/\\|?*]/g, '') : 'SemUnidade';
                const nomeArquivoCredenciais = `${unidadeNome}_credenciais_${dataAtual}.xlsx`;
                
                const urlCredenciais = URL.createObjectURL(blobCredenciais);
                const aCredenciais = document.createElement('a');
                aCredenciais.href = urlCredenciais;
                aCredenciais.download = nomeArquivoCredenciais;
                document.body.appendChild(aCredenciais);
                aCredenciais.click();
                document.body.removeChild(aCredenciais);
                URL.revokeObjectURL(urlCredenciais);
                
                // Pequeno delay entre downloads
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Gerar e baixar arquivo de senhas do totem se existir dados
            if (temSenhasTotem) {
                const workbookTotem = this.gerarExcelTotem();
                const blobTotem = new Blob([workbookTotem], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
                
                const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
                const unidadeNome = this.unidadeTotem ? 
                    this.unidadeTotem.replace(/[<>:"/\\|?*]/g, '') : 'SemUnidade';
                const nomeArquivoTotem = `${unidadeNome}_senhas_totem_${dataAtual}.xlsx`;
                
                const urlTotem = URL.createObjectURL(blobTotem);
                const aTotem = document.createElement('a');
                aTotem.href = urlTotem;
                aTotem.download = nomeArquivoTotem;
                document.body.appendChild(aTotem);
                aTotem.click();
                document.body.removeChild(aTotem);
                URL.revokeObjectURL(urlTotem);
            }

            // Mensagem de sucesso específica
            let mensagem = 'Arquivos exportados com sucesso!';
            if (temCredenciais && temSenhasTotem) {
                mensagem = 'Arquivos de credenciais e senhas do totem exportados com sucesso!';
            } else if (temCredenciais) {
                mensagem = 'Arquivo de credenciais exportado com sucesso!';
            } else if (temSenhasTotem) {
                mensagem = 'Arquivo de senhas do totem exportado com sucesso!';
            }

            this.mostrarNotificacao(mensagem, 'success');

        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            this.mostrarNotificacao('Erro ao exportar arquivos. Tente novamente.', 'error');
        }
    }

    obterTipoTexto(tipo) {
        const tipos = {
            'recepcao': 'RECEPÇÃO MÉDICA',
            'recepcao-odonto': 'RECEPÇÃO ODONTO',
            'medicina': 'MEDICINA',
            'odonto': 'ODONTOLOGIA',
            'laboratorio': 'LABORATÓRIO',
            'pos-consulta': 'PÓS CONSULTA',
            'totem': 'TOTEM'
        };
        
        // Verificar se é um tipo personalizado
        const tipoPersonalizado = this.tiposPersonalizados.find(t => t.valor === tipo);
        if (tipoPersonalizado) {
            return tipoPersonalizado.nome.toUpperCase();
        }
        
        return tipos[tipo] || tipo.toUpperCase();
    }

    mostrarNotificacao(mensagem, tipo = 'info') {
        // Remover notificação anterior se existir
        const notificacaoAnterior = document.querySelector('.notificacao');
        if (notificacaoAnterior) {
            notificacaoAnterior.remove();
        }

        // Criar nova notificação
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao notificacao-${tipo}`;
        notificacao.textContent = mensagem;

        // Adicionar estilos
        Object.assign(notificacao.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 25px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            maxWidth: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            animation: 'slideInRight 0.3s ease'
        });

        // Definir cor baseada no tipo
        const cores = {
            success: '#38a169',
            error: '#e53e3e',
            warning: '#f59e0b',
            info: '#3182ce'
        };
        notificacao.style.background = cores[tipo] || cores.info;
        notificacao.style.fontSize = '14px';
        notificacao.style.lineHeight = '1.5';
        notificacao.style.zIndex = '99999'; // Aumentar z-index para garantir visibilidade

        // Adicionar ao DOM
        document.body.appendChild(notificacao);

        // Remover após 5 segundos (aumentado para garantir visibilidade)
        setTimeout(() => {
            if (notificacao.parentNode) {
                notificacao.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notificacao.parentNode) {
                        notificacao.remove();
            }
                }, 300);
            }
        }, 5000);
    }

    carregarDados() {
        try {
            const dados = localStorage.getItem('cadastroCredenciais');
            return dados ? JSON.parse(dados) : [];
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            return [];
        }
    }

    salvarDados() {
        try {
            localStorage.setItem('cadastroCredenciais', JSON.stringify(this.credenciais));
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            this.mostrarNotificacao('Erro ao salvar dados!', 'error');
        }
    }

    carregarSenhasTotem() {
        try {
            const dados = localStorage.getItem('senhasTotem');
            const senhas = dados ? JSON.parse(dados) : [];
            
            // Adicionar ordem padrão para senhas que não têm
            let ordemAtual = 1;
            senhas.forEach(senha => {
                if (!senha.ordem) {
                    // Encontrar a próxima ordem disponível
                    while (senhas.some(s => s.ordem === ordemAtual)) {
                        ordemAtual++;
                    }
                    senha.ordem = ordemAtual;
                    ordemAtual++;
                }
            });
            
            return senhas;
        } catch (error) {
            console.error('Erro ao carregar senhas do totem:', error);
            return [];
        }
    }

        salvarSenhaTotem(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const unidadeFormulario = formData.get('unidadeTotem');
        if (unidadeFormulario && unidadeFormulario.trim()) {
            this.unidadeTotem = unidadeFormulario.trim();
            this.salvarUnidadeTotem();
            this.atualizarUnidadeAtual();
        }

        const exibir = document.getElementById('exibirNoTotem')?.checked ?? true;
        const novaSenha = {
            id: this.gerarId(),
            nome: formData.get('nomeSenhaTotem') || '',
            ordem: exibir ? parseInt(formData.get('ordemTotem') || '0') : null,
            exibir,
            unidade: this.unidadeTotem,
            cor: formData.get('corFundoTotem') || '#0066cc',
            dataCriacao: new Date().toISOString()
        };

        // Validar dados
        if (!this.validarSenhaTotem(novaSenha)) {
            return;
        }

        // Salvar ou atualizar
        if (this.senhaTotemEditando) {
            const index = this.senhasTotem.findIndex(s => s.id === this.senhaTotemEditando.id);
            this.senhasTotem[index] = novaSenha;
        } else {
            this.senhasTotem.push(novaSenha);
        }

                         this.salvarSenhasTotem();
        this.atualizarTabelaTotem();
        this.fecharModal(document.getElementById('modalSenhaTotem'));
        
        // Atualizar visibilidade do botão Ver Totem
        if (this.secaoAtual === 'totem') {
            const btnVerTotem = document.getElementById('btnVerTotem');
            if (this.senhasTotem.length > 0) {
                btnVerTotem.style.display = 'inline-flex';
            } else {
                btnVerTotem.style.display = 'none';
            }
        }
        
        this.mostrarNotificacao(
            this.senhaTotemEditando ? 'Senha do totem atualizada com sucesso!' : 'Senha do totem criada com sucesso!',
            'success'
        );
    }

    validarSenhaTotem(senhaTotem) {
        if (!senhaTotem.unidade) {
            this.mostrarNotificacao('Nome da empresa é obrigatório!', 'error');
            return false;
        }

        if (!senhaTotem.nome) {
            this.mostrarNotificacao('Nome da senha é obrigatório!', 'error');
            return false;
        }

        if (!senhaTotem.cor) {
            this.mostrarNotificacao('Cor de fundo é obrigatória!', 'error');
            return false;
        }

        // Ordem só é obrigatória se a senha for exibida no totem
        if (senhaTotem.exibir !== false) {
        if (!senhaTotem.ordem || senhaTotem.ordem < 1 || senhaTotem.ordem > 12) {
            this.mostrarNotificacao('Ordem deve estar entre 1 e 12!', 'error');
            return false;
            }
        }

                 // Validar formato da cor
        if (!/^#[0-9A-Fa-f]{6}$/.test(senhaTotem.cor)) {
             this.mostrarNotificacao('Formato de cor inválido! Use o formato #RRGGBB', 'error');
             return false;
         }

        // Verificar se já existe nome duplicado (apenas para novos cadastros)
        if (!this.senhaTotemEditando) {
            const nomeExiste = this.senhasTotem.some(s => 
                (s.nome || '').toLowerCase() === senhaTotem.nome.toLowerCase()
            );
            
            if (nomeExiste) {
                this.mostrarNotificacao('Já existe uma senha do totem com este nome!', 'error');
                return false;
            }
        }

        if (senhaTotem.exibir !== false && senhaTotem.ordem) {
        const ordemOcupada = this.senhasTotem.some(s => 
            s.ordem === senhaTotem.ordem && s.id !== senhaTotem.id
        );
        if (ordemOcupada) {
            this.mostrarNotificacao('Esta posição já está ocupada! Escolha outra ordem.', 'error');
            return false;
            }
        }

        return true;
    }

    validarSenhaTotemComMensagem(senhaTotem) {
        if (!senhaTotem.unidade) {
            return { valido: false, mensagem: 'Nome da empresa é obrigatório!' };
        }

        if (!senhaTotem.nome) {
            return { valido: false, mensagem: 'Nome da senha é obrigatório!' };
        }

        if (!senhaTotem.cor) {
            return { valido: false, mensagem: 'Cor de fundo é obrigatória!' };
        }

        // Ordem só é obrigatória se a senha for exibida no totem
        if (senhaTotem.exibir !== false) {
            if (!senhaTotem.ordem || senhaTotem.ordem < 1 || senhaTotem.ordem > 12) {
                return { valido: false, mensagem: 'Ordem deve estar entre 1 e 12!' };
            }
        }

        // Validar formato da cor
        if (!/^#[0-9A-Fa-f]{6}$/.test(senhaTotem.cor)) {
            return { valido: false, mensagem: 'Formato de cor inválido! Use o formato #RRGGBB' };
        }

        // Verificar se já existe nome duplicado (apenas para novos cadastros)
        if (!this.senhaTotemEditando) {
            const nomeExiste = this.senhasTotem.some(s => 
                (s.nome || '').toLowerCase() === senhaTotem.nome.toLowerCase()
            );
            
            if (nomeExiste) {
                return { valido: false, mensagem: 'Já existe uma senha do totem com este nome!' };
            }
        }

        if (senhaTotem.exibir !== false && senhaTotem.ordem) {
            const ordemOcupada = this.senhasTotem.some(s => 
                s.ordem === senhaTotem.ordem && s.id !== senhaTotem.id
            );
            if (ordemOcupada) {
                return { valido: false, mensagem: 'Esta posição já está ocupada! Escolha outra ordem.' };
            }
        }

        return { valido: true, mensagem: '' };
    }

    salvarSenhasTotem() {
        try {
            localStorage.setItem('senhasTotem', JSON.stringify(this.senhasTotem));
        } catch (error) {
            console.error('Erro ao salvar senhas do totem:', error);
            this.mostrarNotificacao('Erro ao salvar senhas do totem!', 'error');
        }
    }

    // ========== FUNÇÕES PARA FORMULÁRIOS INLINE ==========
    
    salvarCadastroInline(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Processar tipo personalizado se necessário
        let tipoSelecionado = formData.get('tipo');
        if (tipoSelecionado === 'novo-tipo') {
            const novoTipoValor = this.processarNovoTipoInline(formData);
            if (!novoTipoValor) {
                return; // Erro no processamento do novo tipo
            }
            tipoSelecionado = novoTipoValor;
        }

        // Verificar e salvar unidade se fornecida
        const campoUnidadeVisivel = document.getElementById('campoUnidadeCredenciaisInline');
        const inputUnidade = document.getElementById('unidadeCredenciaisInline');
        
        if (campoUnidadeVisivel && 
            campoUnidadeVisivel.style.display !== 'none' && 
            inputUnidade && 
            !inputUnidade.disabled) {
            
            const unidadeInput = inputUnidade.value || formData.get('unidadeCredenciais');
            if (unidadeInput && unidadeInput.trim()) {
                this.unidadeCredenciais = unidadeInput.trim();
                this.salvarUnidadeCredenciais();
                this.atualizarUnidadeAtualCredenciaisInline();
            }
        }
        
        const credencial = {
            id: Date.now(),
            tipo: tipoSelecionado,
            unidade: this.unidadeCredenciais,
            dataInclusao: new Date().toISOString()
        };

        // Verificar se é um tipo personalizado
        const tipoPersonalizado = this.tiposPersonalizados.find(t => t.valor === tipoSelecionado);

        // Adicionar campos específicos baseado no tipo
        if (tipoPersonalizado || ['recepcao', 'recepcao-odonto', 'laboratorio', 'pos-consulta'].includes(credencial.tipo)) {
            credencial.funcionarios = this.coletarDadosFuncionariosInline(formData);
        } else if (credencial.tipo === 'medicina' || credencial.tipo === 'odonto') {
            credencial.profissionais = this.coletarDadosProfissionaisInline(formData);
        }

        // Validar dados
        if (!this.validarCadastro(credencial)) {
            return;
        }

        // Salvar
        this.credenciais.push(credencial);
        this.salvarDados();
        this.atualizarTabela();
        this.limparFormularioCredenciais();
        
        this.mostrarNotificacao('Cadastro criado com sucesso!', 'success');
    }

    salvarSenhaTotemInline(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const unidadeFormulario = formData.get('unidadeTotem');
        if (unidadeFormulario && unidadeFormulario.trim()) {
            this.unidadeTotem = unidadeFormulario.trim();
            this.salvarUnidadeTotem();
            this.atualizarUnidadeAtual();
        }

        const exibir = document.getElementById('exibirNoTotemInline')?.checked ?? true;
        const novaSenha = {
            id: this.gerarId(),
            nome: formData.get('nomeSenhaTotem') || '',
            ordem: exibir ? parseInt(formData.get('ordemTotem') || '0') : null,
            exibir,
            unidade: this.unidadeTotem,
            cor: formData.get('corFundoTotem') || '#0066cc',
            dataCriacao: new Date().toISOString()
        };

        // Validar dados
        if (!this.validarSenhaTotem(novaSenha)) {
            return;
        }

        // Verificar limite de 12 senhas
        if (this.senhasTotem.length >= 12) {
            this.mostrarNotificacao('Limite máximo de 12 senhas do totem atingido!', 'error');
            return;
        }

        // Salvar
        this.senhasTotem.push(novaSenha);
        this.salvarSenhasTotem();
        this.atualizarTabelaTotem();
        this.limparFormularioTotem();
        
        // Atualizar visibilidade do botão Ver Totem
        if (this.secaoAtual === 'totem') {
            const btnVerTotem = document.getElementById('btnVerTotem');
            if (this.senhasTotem.length > 0) {
                btnVerTotem.style.display = 'inline-flex';
            } else {
                btnVerTotem.style.display = 'none';
            }
        }
        
        this.mostrarNotificacao('Senha do totem criada com sucesso!', 'success');
    }

    alterarTipoInline(tipo) {
        const camposRecepcao = document.getElementById('camposRecepcaoInline');
        const camposMedOdonto = document.getElementById('camposMedOdontoInline');
        const campoNovoTipo = document.getElementById('campoNovoTipoInline');

        // Esconder todos os campos específicos
        camposRecepcao.style.display = 'none';
        camposMedOdonto.style.display = 'none';
        campoNovoTipo.style.display = 'none';

        // Verificar se é um tipo personalizado
        const tipoPersonalizado = this.tiposPersonalizados.find(t => t.valor === tipo);

        // Mostrar campos específicos baseado no tipo
        if (tipo === 'novo-tipo') {
            campoNovoTipo.style.display = 'block';
            document.getElementById('novoTipoNomeInline').required = true;
        } else if (tipoPersonalizado || ['recepcao', 'recepcao-odonto', 'laboratorio', 'pos-consulta'].includes(tipo)) {
            camposRecepcao.style.display = 'block';
            this.inicializarTabelaFuncionariosInline();
            document.getElementById('novoTipoNomeInline').required = false;
        } else if (tipo === 'medicina' || tipo === 'odonto') {
            camposMedOdonto.style.display = 'block';
            this.inicializarTabelaProfissionaisInline();
            document.getElementById('novoTipoNomeInline').required = false;
        } else {
            document.getElementById('novoTipoNomeInline').required = false;
        }
    }

    processarNovoTipoInline(formData) {
        const novoTipoNome = formData.get('novoTipoNome')?.trim();
        if (!novoTipoNome) {
            this.mostrarNotificacao('Nome do novo tipo é obrigatório!', 'error');
            return null;
        }

        // Verificar se já existe um tipo com esse nome
        const tipoExistente = this.tiposPersonalizados.find(t => 
            t.nome.toLowerCase() === novoTipoNome.toLowerCase()
        );

        if (tipoExistente) {
            this.mostrarNotificacao('Já existe um tipo com este nome!', 'error');
            return null;
        }

        // Criar novo tipo personalizado
        const novoTipo = {
            id: Date.now(),
            nome: novoTipoNome,
            valor: `tipo-${Date.now()}`
        };

        this.tiposPersonalizados.push(novoTipo);
        this.salvarTiposPersonalizados();
        this.carregarTiposNoSelect();

        return novoTipo.valor;
    }

    coletarDadosProfissionaisInline(formData) {
        const profissionais = [];
        const tbody = document.getElementById('profissionaisTableBodyInline');
        
        for (let i = 0; i < tbody.children.length; i++) {
            const tratamento = formData.get(`tratamento_${i}`);
            const nome = formData.get(`nome_${i}`)?.trim();
            const especialidade = formData.get(`especialidade_${i}`)?.trim();
            
            if (nome) {
                profissionais.push({
                    tratamento: tratamento || '',
                    nome: nome,
                    especialidade: especialidade || ''
                });
            }
        }
        
        return profissionais;
    }

    coletarDadosFuncionariosInline(formData) {
        const funcionarios = [];
        const tbody = document.getElementById('funcionariosTableBodyInline');
        
        for (let i = 0; i < tbody.children.length; i++) {
            const nome = formData.get(`nome_funcionario_${i}`)?.trim();
            const senhas = formData.get(`senhas_funcionario_${i}`)?.trim();
            
            if (nome) {
                funcionarios.push({
                    nome: nome,
                    senhas: senhas || ''
                });
            }
        }
        
        return funcionarios;
    }

    inicializarTabelaProfissionaisInline() {
        const tbody = document.getElementById('profissionaisTableBodyInline');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        for (let i = 0; i < 3; i++) {
            this.adicionarLinhaProfissionalInline();
        }

        const btnMaisLinhas = document.getElementById('btnMaisLinhasInline');
        if (btnMaisLinhas) {
            btnMaisLinhas.onclick = () => this.adicionarLinhaProfissionalInline();
        }
    }

    adicionarLinhaProfissionalInline() {
        const tbody = document.getElementById('profissionaisTableBodyInline');
        if (!tbody) return;
        const index = tbody.children.length;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <select name="tratamento_${index}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">Selecione...</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Dra.">Dra.</option>
                    <option value="Prof.">Prof.</option>
                    <option value="Prof.ª">Prof.ª</option>
                    <option value="Sr.">Sr.</option>
                    <option value="Sra.">Sra.</option>
                </select>
            </td>
            <td>
                <input type="text" name="nome_${index}" placeholder="Nome e sobrenome do profissional" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td>
                <input type="text" name="especialidade_${index}" placeholder="Especialidade" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
        `;
        
        tbody.appendChild(tr);
    }

    inicializarTabelaFuncionariosInline() {
        const tbody = document.getElementById('funcionariosTableBodyInline');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        for (let i = 0; i < 3; i++) {
            this.adicionarLinhaFuncionarioInline();
        }

        const btnMaisLinhas = document.getElementById('btnMaisLinhasFuncionariosInline');
        if (btnMaisLinhas) {
            btnMaisLinhas.onclick = () => this.adicionarLinhaFuncionarioInline();
        }
    }

    adicionarLinhaFuncionarioInline() {
        const tbody = document.getElementById('funcionariosTableBodyInline');
        if (!tbody) return;
        const index = tbody.children.length;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <input type="text" name="nome_funcionario_${index}" placeholder="Nome e sobrenome do funcionário" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td>
                <input type="text" name="senhas_funcionario_${index}" placeholder="Ex: Medicina Geral, Cardiologia..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
        `;
        
        tbody.appendChild(tr);
    }

    limparFormularioCredenciais() {
        const form = document.getElementById('formCadastroInline');
        if (form) {
            form.reset();
        }
        this.alterarTipoInline('');
        this.atualizarUnidadeAtualCredenciaisInline();
    }

    limparFormularioTotem() {
        const form = document.getElementById('formSenhaTotemInline');
        if (form) {
            form.reset();
        }
        document.getElementById('corFundoTotemInline').value = '#0066cc';
        document.getElementById('corFundoTextoTotemInline').value = '#0066cc';
        document.getElementById('exibirNoTotemInline').checked = true;
        this.configurarOpcoesOrdemInline();
        this.atualizarPreviewTotemInline();
    }

    atualizarUnidadeAtualCredenciaisInline() {
        const container = document.getElementById('unidadeAtualCredenciaisInline');
        const campo = document.getElementById('campoUnidadeCredenciaisInline');
        const texto = document.getElementById('unidadeAtualTextoCredenciaisInline');
        const inputUnidade = document.getElementById('unidadeCredenciaisInline');
        
        if (this.unidadeCredenciais && this.unidadeCredenciais.trim() !== '') {
            if (container) container.style.display = 'block';
            if (campo) campo.style.display = 'none';
            if (texto) texto.textContent = this.unidadeCredenciais;
            // Remover required quando o campo está oculto
            if (inputUnidade) {
                inputUnidade.removeAttribute('required');
            }
        } else {
            if (container) container.style.display = 'none';
            if (campo) campo.style.display = 'block';
            // Adicionar required quando o campo está visível
            if (inputUnidade) {
                inputUnidade.setAttribute('required', 'required');
            }
        }
    }

    permitirAlterarUnidadeCredenciaisInline() {
        const container = document.getElementById('unidadeAtualCredenciaisInline');
        const campo = document.getElementById('campoUnidadeCredenciaisInline');
        const input = document.getElementById('unidadeCredenciaisInline');
        
        if (container) container.style.display = 'none';
        if (campo) campo.style.display = 'block';
        if (input) {
            input.value = this.unidadeCredenciais || '';
            // Adicionar required quando o campo for exibido
            input.setAttribute('required', 'required');
            input.focus();
        }
    }

    configurarEventosTotemInline() {
        const nomeInput = document.getElementById('nomeSenhaTotemInline');
        const corInput = document.getElementById('corFundoTotemInline');
        const corTextoInput = document.getElementById('corFundoTextoTotemInline');
        const exibirSwitch = document.getElementById('exibirNoTotemInline');
        
        if (nomeInput) {
            nomeInput.addEventListener('input', () => this.atualizarPreviewTotemInline());
        }
        if (corInput) {
            corInput.addEventListener('input', (e) => {
                if (corTextoInput) corTextoInput.value = e.target.value;
                this.atualizarPreviewTotemInline();
            });
        }
        if (corTextoInput) {
            corTextoInput.addEventListener('input', (e) => {
                if (corInput) corInput.value = e.target.value;
                this.atualizarPreviewTotemInline();
            });
        }
        if (exibirSwitch) {
            exibirSwitch.addEventListener('change', () => this.atualizarVisibilidadeOrdemTotemInline());
        }
        
        this.configurarOpcoesOrdemInline();
        this.atualizarVisibilidadeOrdemTotemInline();
    }

    atualizarPreviewTotemInline() {
        const nomeSenha = document.getElementById('nomeSenhaTotemInline')?.value || 'NOME DA SENHA';
        const cor = document.getElementById('corFundoTotemInline')?.value || '#0066cc';
        const preview = document.getElementById('previewSenhaTotemInline');
        const previewTexto = document.getElementById('previewTextoTotemInline');
        
        if (preview) {
            preview.style.backgroundColor = cor;
            preview.style.color = this.obterCorTextoContraste(cor);
        }
        if (previewTexto) {
            previewTexto.textContent = nomeSenha.toUpperCase();
        }
    }

    atualizarVisibilidadeOrdemTotemInline() {
        const exibirSwitch = document.getElementById('exibirNoTotemInline');
        const grupoOrdem = document.querySelector('label[for="ordemTotemInline"]')?.closest('.form-group-inline');
        const selectOrdem = document.getElementById('ordemTotemInline');
        
        if (!exibirSwitch || !grupoOrdem || !selectOrdem) return;
        
        const ativo = exibirSwitch.checked;
        grupoOrdem.style.display = ativo ? 'block' : 'none';
        selectOrdem.disabled = !ativo;
        selectOrdem.required = ativo;
    }

    configurarOpcoesOrdemInline() {
        const selectOrdem = document.getElementById('ordemTotemInline');
        if (!selectOrdem) return;
        
        selectOrdem.innerHTML = '<option value="">Selecione a posição</option>';
        
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('option');
            option.value = i;
            
            const posicaoOcupada = this.senhasTotem.some(s => 
                s.exibir !== false && s.ordem === i
            );
            
            if (posicaoOcupada) {
                const senhaNaPosicao = this.senhasTotem.find(s => s.ordem === i);
                option.textContent = `${i}ª posição (Ocupada: ${senhaNaPosicao.nome || ''})`;
                option.disabled = true;
            } else {
                option.textContent = `${i}ª posição`;
            }
            
            selectOrdem.appendChild(option);
        }
    }

    preencherUnidadeTotemInline() {
        const inputUnidade = document.getElementById('unidadeTotemInline');
        if (inputUnidade && this.unidadeTotem && this.unidadeTotem.trim() !== '') {
            inputUnidade.value = this.unidadeTotem;
        }
    }



    // Métodos para gerenciar unidade de credenciais
    carregarUnidadeCredenciais() {
        try {
            return localStorage.getItem('unidadeCredenciais') || '';
        } catch (error) {
            console.error('Erro ao carregar empresa de credenciais:', error);
            return '';
        }
    }

    salvarUnidadeCredenciais() {
        try {
            localStorage.setItem('unidadeCredenciais', this.unidadeCredenciais);
        } catch (error) {
            console.error('Erro ao salvar empresa de credenciais:', error);
            this.mostrarNotificacao('Erro ao salvar empresa de credenciais!', 'error');
        }
    }



    atualizarUnidadeAtualCredenciais() {
        const containerAtual = document.getElementById('unidadeAtualCredenciais');
        const textoUnidade = document.getElementById('unidadeAtualTextoCredenciais');
        const campoUnidade = document.getElementById('campoUnidadeCredenciais');
        const inputUnidade = document.getElementById('unidadeCredenciais');
        
        console.log('Atualizando unidade. Unidade atual:', this.unidadeCredenciais);
        
        if (this.unidadeCredenciais && this.unidadeCredenciais.trim() !== '') {
            // Mostrar unidade atual e ocultar campo de entrada
            if (textoUnidade) textoUnidade.textContent = this.unidadeCredenciais;
            if (containerAtual) containerAtual.style.display = 'block';
            if (campoUnidade) campoUnidade.style.display = 'none';
            if (inputUnidade) {
                inputUnidade.removeAttribute('required');
                inputUnidade.value = '';
            }
            console.log('Exibindo unidade atual:', this.unidadeCredenciais);
        } else {
            // Mostrar campo de entrada e ocultar unidade atual
            if (containerAtual) containerAtual.style.display = 'none';
            if (campoUnidade) campoUnidade.style.display = 'block';
            if (inputUnidade) {
                inputUnidade.setAttribute('required', 'required');
                inputUnidade.value = '';
            }
            console.log('Exibindo campo de entrada da unidade');
        }
    }

    permitirAlterarUnidadeCredenciais() {
        const novaUnidade = prompt('Digite o novo nome da empresa:', this.unidadeCredenciais || '');
        if (novaUnidade !== null && novaUnidade.trim() !== '') {
            this.unidadeCredenciais = novaUnidade.trim();
            this.salvarUnidadeCredenciais();
            this.atualizarUnidadeAtualCredenciais();
            this.mostrarNotificacao('Empresa atualizada com sucesso!', 'success');
        }
    }

    // Funções para gerenciar tipos personalizados
    carregarTiposPersonalizados() {
        try {
            const tipos = localStorage.getItem('tiposPersonalizados');
            return tipos ? JSON.parse(tipos) : [];
        } catch (error) {
            console.error('Erro ao carregar tipos personalizados:', error);
            return [];
        }
    }

    salvarTiposPersonalizados() {
        try {
            localStorage.setItem('tiposPersonalizados', JSON.stringify(this.tiposPersonalizados));
        } catch (error) {
            console.error('Erro ao salvar tipos personalizados:', error);
            this.mostrarNotificacao('Erro ao salvar tipo personalizado!', 'error');
        }
    }

    carregarTiposNoSelect() {
        const selectTipo = document.getElementById('tipo');
        const selectTipoInline = document.getElementById('tipoInline');
        
        // Salvar opções padrão se não existirem
        if (!this.optionsPadraoSelect) {
            this.optionsPadraoSelect = [
                { value: '', text: 'Selecione o tipo de usuário' },
                { value: 'recepcao', text: 'Recepção Médica' },
                { value: 'recepcao-odonto', text: 'Recepção Odonto' },
                { value: 'medicina', text: 'Medicina' },
                { value: 'odonto', text: 'Odontologia' },
                { value: 'laboratorio', text: 'Laboratório' },
                { value: 'pos-consulta', text: 'Pós Consulta' }
            ];
        }

        // Função auxiliar para preencher um select
        const preencherSelect = (select) => {
            if (!select) return;
            select.innerHTML = '';
        
        // Adicionar opções padrão
        this.optionsPadraoSelect.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
                select.appendChild(option);
        });

        // Adicionar tipos personalizados
        this.tiposPersonalizados.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.valor;
            option.textContent = tipo.nome;
            option.style.color = '#28a745';
            option.style.fontStyle = 'italic';
                select.appendChild(option);
        });

        // Adicionar opção "Novo Tipo" no final
        const novoTipoOption = document.createElement('option');
        novoTipoOption.value = 'novo-tipo';
        novoTipoOption.textContent = '+ Novo Tipo';
        novoTipoOption.style.color = '#007bff';
        novoTipoOption.style.fontWeight = 'bold';
            select.appendChild(novoTipoOption);
        };

        // Preencher ambos os selects
        preencherSelect(selectTipo);
        preencherSelect(selectTipoInline);
    }

    criarNovoTipo(nomeNovoTipo) {
        // Gerar valor único baseado no nome
        const valorTipo = this.gerarValorTipo(nomeNovoTipo);
        
        // Verificar se já existe
        const jaExiste = this.tiposPersonalizados.some(t => t.valor === valorTipo);
        if (jaExiste) {
            this.mostrarNotificacao('Este tipo já existe!', 'error');
            return null;
        }

        // Criar novo tipo
        const novoTipo = {
            valor: valorTipo,
            nome: nomeNovoTipo.trim(),
            dataCriacao: new Date().toISOString(),
            ehPersonalizado: true
        };

        // Adicionar à lista
        this.tiposPersonalizados.push(novoTipo);
        this.salvarTiposPersonalizados();
        this.carregarTiposNoSelect();

        return novoTipo;
    }

    gerarValorTipo(nome) {
        // Converter nome para valor único
        return nome.toLowerCase()
            .trim()
            .replace(/[áàãâä]/g, 'a')
            .replace(/[éèêë]/g, 'e')
            .replace(/[íìîï]/g, 'i')
            .replace(/[óòõôö]/g, 'o')
            .replace(/[úùûü]/g, 'u')
            .replace(/[ç]/g, 'c')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    processarNovoTipo(formData) {
        const novoTipoNome = formData.get('novoTipoNome')?.trim();
        
        if (!novoTipoNome) {
            this.mostrarNotificacao('Digite o nome do novo tipo!', 'error');
            return null;
        }

        if (novoTipoNome.length < 2) {
            this.mostrarNotificacao('O nome do tipo deve ter pelo menos 2 caracteres!', 'error');
            return null;
        }

        if (novoTipoNome.length > 50) {
            this.mostrarNotificacao('O nome do tipo deve ter no máximo 50 caracteres!', 'error');
            return null;
        }

        // Criar o novo tipo
        const novoTipo = this.criarNovoTipo(novoTipoNome);
        if (novoTipo) {
            this.mostrarNotificacao(`Tipo "${novoTipo.nome}" criado com sucesso!`, 'success');
            
            // Limpar campo e selecionar o novo tipo
            document.getElementById('novoTipoNome').value = '';
            document.getElementById('tipo').value = novoTipo.valor;
            
            // Atualizar interface para o novo tipo
            this.alterarTipo(novoTipo.valor);
            
            return novoTipo.valor;
        }
        
        return null;
    }

    // Métodos para editar por ID
    editarCredencial(id) {
        const credencial = this.credenciais.find(c => c.id === id);
        if (credencial) {
            this.abrirModal(credencial);
        } else {
            this.mostrarNotificacao('Credencial não encontrada!', 'error');
        }
    }

    editarSenhaTotem(id) {
        const senhaTotem = this.senhasTotem.find(s => s.id === id);
        if (senhaTotem) {
            this.abrirModalTotem(senhaTotem);
        } else {
            this.mostrarNotificacao('Senha do totem não encontrada!', 'error');
        }
    }

    async enviarPorEmail() {
        try {
            // Verificar se há dados para exportar
            const temCredenciais = this.credenciais.length > 0;
            const temSenhasTotem = this.senhasTotem.length > 0;

            if (!temCredenciais && !temSenhasTotem) {
                this.mostrarNotificacao('Não há dados para enviar!', 'error');
                return;
            }

            this.mostrarNotificacao('Preparando modal de envio...', 'info');

            // Preparar dados para o modal
            await this.prepararModalEmail();

        } catch (error) {
            console.error('Erro ao preparar modal de email:', error);
            this.mostrarNotificacao('Erro ao preparar envio por email!', 'error');
        }
    }

    async prepararModalEmail() {
        try {
            // Verificar dados disponíveis
            const temCredenciais = this.credenciais.length > 0;
            const temSenhasTotem = this.senhasTotem.length > 0;

            // Gerar arquivos Excel
            this.arquivosParaEnvio = [];
            let nomeArquivos = [];

            // Obter nome da unidade para usar nos arquivos
            const unidade = this.unidadeCredenciais || this.unidadeTotem || 'SemUnidade';
            const unidadeNome = unidade.replace(/[<>:"/\\|?*]/g, '');
            const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

            if (temCredenciais) {
                const workbookCredenciais = this.gerarExcelCredenciais();
                const nomeArquivoCredenciais = `${unidadeNome}_credenciais_${dataAtual}.xlsx`;
                this.arquivosParaEnvio.push({
                    nome: nomeArquivoCredenciais,
                    dados: workbookCredenciais,
                    tipo: 'Planilha de Credenciais',
                    tamanho: this.formatarTamanhoArquivo(workbookCredenciais.length || 0)
                });
                nomeArquivos.push(nomeArquivoCredenciais);
            }

            if (temSenhasTotem) {
                const workbookTotem = this.gerarExcelTotem();
                const nomeArquivoTotem = `${unidadeNome}_senhas_totem_${dataAtual}.xlsx`;
                this.arquivosParaEnvio.push({
                    nome: nomeArquivoTotem,
                    dados: workbookTotem,
                    tipo: 'Planilha de Senhas do Totem',
                    tamanho: this.formatarTamanhoArquivo(workbookTotem.length || 0)
                });
                nomeArquivos.push(nomeArquivoTotem);
            }

            // Preparar conteúdo do email
            const dataFormatada = new Date().toLocaleDateString('pt-BR');
            
            const assunto = `Planilhas de Credenciais - ${unidade} - ${dataFormatada}`;
            
            const totalCredenciaisIndividuais = this.contarCredenciaisIndividuais();
            
            const corpo = `Segue em anexo as planilhas de credenciais:

Unidade: ${unidade}
Data de geração: ${dataFormatada}

Total de credenciais: ${totalCredenciaisIndividuais}
Total de senhas do totem: ${this.senhasTotem.length}`;

            // Preencher campos do modal (com verificação de null)
            const assuntoEmail = document.getElementById('assuntoEmail');
            const corpoEmail = document.getElementById('corpoEmail');
            const totalCredenciais = document.getElementById('totalCredenciais');
            const emailRemetente = document.getElementById('emailRemetente');
            const nomeRemetente = document.getElementById('nomeRemetente');
            
            if (assuntoEmail) assuntoEmail.value = assunto;
            if (corpoEmail) corpoEmail.value = corpo;
            if (totalCredenciais) totalCredenciais.value = `${totalCredenciaisIndividuais} credenciais, ${this.senhasTotem.length} senhas do totem`;

            // Limpar campos do remetente
            if (emailRemetente) emailRemetente.value = '';
            if (nomeRemetente) nomeRemetente.value = '';

            // Gerar lista de anexos e campos de arquivo
            this.atualizarListaAnexos();
            this.criarCamposArquivos();

            // Abrir modal
            document.getElementById('modalEmail').style.display = 'block';

        } catch (error) {
            console.error('Erro ao preparar modal:', error);
            this.mostrarNotificacao('Erro ao preparar dados do email!', 'error');
        }
    }

    formatarTamanhoArquivo(bytes) {
        if (bytes === 0) return '0 KB';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    atualizarListaAnexos() {
        const listaAnexos = document.getElementById('listaAnexos');
        
        if (!this.arquivosParaEnvio || this.arquivosParaEnvio.length === 0) {
            listaAnexos.innerHTML = '<div class="lista-anexos-vazia">Nenhum arquivo para anexar</div>';
            return;
        }

        listaAnexos.innerHTML = this.arquivosParaEnvio.map(arquivo => `
            <div class="anexo-item">
                <div class="anexo-info">
                    <svg class="anexo-icone" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    <div class="anexo-detalhes">
                        <h4>${arquivo.nome}</h4>
                        <p>${arquivo.tipo} • ${arquivo.tamanho}</p>
                    </div>
                </div>
                <div class="anexo-status">
                    <svg class="anexo-status-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                    </svg>
                    Pronto
                </div>
            </div>
        `).join('');
    }

    criarCamposArquivos() {
        const camposArquivos = document.getElementById('camposArquivos');
        camposArquivos.innerHTML = '';

        this.arquivosParaEnvio.forEach((arquivo, index) => {
            // Converter arquivo para Blob e depois para File
            const blob = new Blob([arquivo.dados], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            // Criar input file oculto
            const input = document.createElement('input');
            input.type = 'file';
            input.name = `arquivo_${index + 1}`;
            input.style.display = 'none';

            // Criar DataTransfer para simular seleção de arquivo
            const dt = new DataTransfer();
            const file = new File([blob], arquivo.nome, {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            dt.items.add(file);
            input.files = dt.files;

            camposArquivos.appendChild(input);
        });
    }

    async enviarEmailComFormSubmit(e) {
        e.preventDefault();
        
        const emailRemetente = document.getElementById('emailRemetente').value.trim();
        const nomeRemetente = document.getElementById('nomeRemetente').value.trim();
        const assunto = document.getElementById('assuntoEmail')?.value || '';
        const corpo = document.getElementById('corpoEmail')?.value || '';
        const emailDestino = document.getElementById('emailDestino')?.value || 'suporte.intelite@gmail.com';
        
        if (!emailRemetente || !nomeRemetente) {
            this.mostrarNotificacao('Por favor, preencha todos os campos obrigatórios!', 'error');
            return;
        }

            const btnEnviar = document.getElementById('btnEnviarEmailModal');
        if (btnEnviar) {
            btnEnviar.classList.add('btn-loading');
            btnEnviar.disabled = true;
        }

        try {
            this.mostrarNotificacao('Preparando e enviando email...', 'info');

            // Criar FormData para enviar ao FormSubmit
            const formData = new FormData();
            
            // Campos do FormSubmit
            formData.append('_to', emailDestino);
            formData.append('_subject', assunto);
            formData.append('_template', 'box');
            formData.append('_captcha', 'false');
            formData.append('_autoresponse', 'Recebemos sua mensagem! Obrigado pelo contato.');
            
            // Campos do formulário
            formData.append('email', emailRemetente);
            formData.append('nome', nomeRemetente);
            formData.append('mensagem', corpo);
            
            // Adicionar arquivos Excel como anexos
            if (this.arquivosParaEnvio && this.arquivosParaEnvio.length > 0) {
            this.arquivosParaEnvio.forEach((arquivo, index) => {
                const blob = new Blob([arquivo.dados], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
                    formData.append(`attachment_${index + 1}`, blob, arquivo.nome);
                });
            }

            // Enviar via fetch para FormSubmit
            const response = await fetch('https://formsubmit.co/ajax/suporte.intelite@gmail.com', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                // Verificar o tipo de conteúdo antes de fazer parse JSON
                const contentType = response.headers.get('content-type');
                let result = null;
                
                if (contentType && contentType.includes('application/json')) {
                    try {
                        const text = await response.text();
                        if (text.trim()) {
                            result = JSON.parse(text);
                        }
                    } catch (parseError) {
                        console.warn('Resposta não é JSON válido, mas o envio pode ter sido bem-sucedido:', parseError);
                        // Se não conseguir fazer parse, assumir sucesso se status for OK
                        result = { success: true };
                    }
                } else {
                    // Se não for JSON, assumir sucesso se status for OK
                    result = { success: true };
                }

            // Fechar modal
                const modalEmail = document.getElementById('modalEmail');
                if (modalEmail) {
                    this.fecharModal(modalEmail);
                }
            
            this.mostrarNotificacao('Email enviado com sucesso! ✅', 'success');
            
            setTimeout(() => {
                    this.mostrarNotificacao('O email foi enviado para ' + emailDestino, 'info');
            }, 2000);
            } else {
                const errorText = await response.text().catch(() => 'Erro desconhecido');
                throw new Error('Erro ao enviar email. Status: ' + response.status + ' - ' + errorText);
            }
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            let mensagemErro = 'Erro ao enviar email. Tente novamente.';
            
            if (error.message && error.message.includes('JSON')) {
                mensagemErro = 'Erro ao processar resposta do servidor. O email pode ter sido enviado. Verifique sua caixa de entrada.';
            } else if (error.message && error.message.includes('Status:')) {
                mensagemErro = 'Erro ao enviar email. Verifique sua conexão e tente novamente.';
            }
            
            this.mostrarNotificacao(mensagemErro, 'error');
        } finally {
            if (btnEnviar) {
            btnEnviar.classList.remove('btn-loading');
            btnEnviar.disabled = false;
            }
        }
    }

    prepararAnexosParaFormSubmit() {
        // Converter arquivos Excel para File objects e adicionar ao formulário
        const camposArquivos = document.getElementById('camposArquivos');
        if (!camposArquivos) return;

        // Limpar campos anteriores
        camposArquivos.innerHTML = '';

        if (!this.arquivosParaEnvio || this.arquivosParaEnvio.length === 0) {
            return;
        }

        this.arquivosParaEnvio.forEach((arquivo, index) => {
            // Converter dados do arquivo para Blob
            const blob = new Blob([arquivo.dados], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            // Criar File object a partir do Blob
            const file = new File([blob], arquivo.nome, { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });

            // Criar input file e adicionar ao formulário
            const input = document.createElement('input');
            input.type = 'file';
            input.name = `anexo_${index + 1}`;
            input.style.display = 'none';
            
            // Criar DataTransfer para adicionar o arquivo ao input
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;
            
            camposArquivos.appendChild(input);
        });
    }
    
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async enviarViaMailto(emailRemetente, nomeRemetente) {
        try {
            const btnEnviar = document.getElementById('btnEnviarEmailModal');
            if (btnEnviar) {
            btnEnviar.classList.add('btn-loading');
            btnEnviar.disabled = true;
            }

            this.mostrarNotificacao('Preparando arquivos para download...', 'info');
            
            // Pequeno delay para garantir que a notificação apareça
            await new Promise(resolve => setTimeout(resolve, 500));

            // Fazer download dos arquivos primeiro
            for (let i = 0; i < this.arquivosParaEnvio.length; i++) {
                const arquivo = this.arquivosParaEnvio[i];
                const blob = new Blob([arquivo.dados], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
                
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = arquivo.nome;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // Pequeno delay entre downloads
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // Preparar email com dados atualizados
            const assunto = document.getElementById('assuntoEmail').value;
            let corpo = document.getElementById('corpoEmail').value;
            
            // Adicionar informações do remetente no corpo
            corpo = `${corpo}

===============================
INFORMAÇÕES DO REMETENTE:
===============================
Nome: ${nomeRemetente}
Email: ${emailRemetente}

ARQUIVOS ANEXADOS:
${this.arquivosParaEnvio.map(arquivo => `- ${arquivo.nome} (${arquivo.tamanho})`).join('\n')}

Por favor, anexe os arquivos baixados a este email antes de enviar.`;

            // Aguardar um pouco antes de abrir o email
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Abrir cliente de email
            const emailUrl = `mailto:suporte.intelite@gmail.com?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
            
            const linkEmail = document.createElement('a');
            linkEmail.href = emailUrl;
            linkEmail.target = '_blank';
            document.body.appendChild(linkEmail);
            linkEmail.click();
            document.body.removeChild(linkEmail);
            
            // Notificar que o email foi aberto
            setTimeout(() => {
                this.mostrarNotificacao('Cliente de email aberto! Verifique sua caixa de entrada.', 'info');
            }, 2000);

            // Fechar modal
            const modalEmail = document.getElementById('modalEmail');
            if (modalEmail) {
                this.fecharModal(modalEmail);
            }

            // Aguardar um pouco antes de mostrar a próxima notificação
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.mostrarNotificacao('Arquivos baixados com sucesso! ✅', 'success');
            
            setTimeout(() => {
                this.mostrarNotificacao('Cliente de email será aberto automaticamente...', 'info');
            }, 1500);
            
            setTimeout(() => {
                this.mostrarNotificacao('⚠️ IMPORTANTE: Anexe os arquivos baixados ao email antes de enviar!', 'warning');
            }, 3000);

        } catch (error) {
            console.error('Erro ao enviar via mailto:', error);
            this.mostrarNotificacao('Erro ao preparar envio. Tente novamente.', 'error');
            
            // Tentar abrir email mesmo em caso de erro parcial
            try {
                const assunto = document.getElementById('assuntoEmail')?.value || 'Planilhas de Credenciais';
                const emailUrl = `mailto:suporte.intelite@gmail.com?subject=${encodeURIComponent(assunto)}`;
                window.location.href = emailUrl;
            } catch (e) {
                console.error('Erro ao abrir cliente de email:', e);
            }
        } finally {
            const btnEnviar = document.getElementById('btnEnviarEmailModal');
            if (btnEnviar) {
            btnEnviar.classList.remove('btn-loading');
            btnEnviar.disabled = false;
            }
        }
    }

    // Função para contar credenciais individuais (cada linha)
    contarCredenciaisIndividuais() {
        let total = 0;
        
        this.credenciais.forEach(credencial => {
            if (credencial.tipo === 'medicina' || credencial.tipo === 'odonto') {
                if (credencial.profissionais && credencial.profissionais.length > 0) {
                    total += credencial.profissionais.length;
                }
            } else {
                if (credencial.funcionarios && credencial.funcionarios.length > 0) {
                    total += credencial.funcionarios.length;
                }
            }
        });
        
        return total;
    }

    gerarExcelCredenciais() {
        // Reutilizar a lógica da função exportarExcel existente
        const dadosExportacao = [];
        
        if (this.unidadeCredenciais) {
            dadosExportacao.push([this.unidadeCredenciais]);
            dadosExportacao.push([]);
        }

        // Exportar cada tipo
        const tipos = ['recepcao', 'recepcao-odonto', 'medicina', 'odonto', 'laboratorio', 'pos-consulta'];
        
        tipos.forEach(tipo => {
            const credenciaisTipo = this.credenciais.filter(c => c.tipo === tipo);
            if (credenciaisTipo.length > 0) {
                const tipoTexto = this.obterTipoTexto(tipo);
                dadosExportacao.push([`=== ${tipoTexto.toUpperCase()} ===`]);
                dadosExportacao.push([]);

                if (tipo === 'medicina' || tipo === 'odonto') {
                    dadosExportacao.push(['Profissional']);
                    credenciaisTipo.forEach(credencial => {
                        if (credencial.profissionais && credencial.profissionais.length > 0) {
                            credencial.profissionais.forEach(prof => {
                                // Formato: "Dr. Deyvison - Geral"
                                const tratamento = prof.tratamento || '';
                                const nome = prof.nome || '';
                                const especialidade = prof.especialidade || '';
                                
                                let profissionalFormatado = '';
                                if (tratamento && nome && especialidade) {
                                    profissionalFormatado = `${tratamento} ${nome} - ${especialidade}`;
                                } else if (nome && especialidade) {
                                    profissionalFormatado = `${nome} - ${especialidade}`;
                                } else if (nome) {
                                    profissionalFormatado = nome;
                                }
                                
                                if (profissionalFormatado) {
                                    dadosExportacao.push([profissionalFormatado]);
                                }
                            });
                        }
                    });
                } else {
                    dadosExportacao.push(['Nome', 'Senhas que irá chamar']);
                    credenciaisTipo.forEach(credencial => {
                        if (credencial.funcionarios && credencial.funcionarios.length > 0) {
                            credencial.funcionarios.forEach(func => {
                                dadosExportacao.push([
                                    func.nome || '',
                                    func.senhas || ''
                                ]);
                            });
                        }
                    });
                }
                dadosExportacao.push([]);
            }
        });

        return this.criarArquivoExcel(dadosExportacao, 'Credenciais');
    }

    gerarExcelTotem() {
        const dadosTotem = [];
        
        if (this.unidadeTotem) {
            dadosTotem.push([this.unidadeTotem]);
            dadosTotem.push([]);
        }

        dadosTotem.push(['=== SENHAS DO TOTEM ===']);
        dadosTotem.push([]);
        dadosTotem.push(['Ordem', 'Nome da Senha', 'Cor']);

        const senhasOrdenadas = [...this.senhasTotem].sort((a, b) => a.ordem - b.ordem);
        senhasOrdenadas.forEach(senha => {
            dadosTotem.push([
                senha.ordem,
                senha.nome || senha.nomeSenha || '',
                senha.cor || senha.corFundo || '#48c9b0'
            ]);
        });

        return this.criarArquivoExcel(dadosTotem, 'Senhas do Totem');
    }

    // ===========================

    criarArquivoExcel(dados, nomeAba) {
        try {
            // Usar SheetJS para criar arquivo Excel real
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(dados);
            
            // Adicionar a planilha ao workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, nomeAba);
            
            // Gerar buffer do arquivo Excel
            const wbout = XLSX.write(workbook, {
                bookType: 'xlsx',
                type: 'array'
            });
            
            return wbout;
        } catch (error) {
            console.error('Erro ao criar arquivo Excel:', error);
            // Fallback para CSV se SheetJS não estiver disponível
            let csvContent = '';
            dados.forEach(linha => {
                const linhaFormatada = linha.map(cell => {
                    if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                        return `"${cell.replace(/"/g, '""')}"`;
                    }
                    return cell;
                }).join(',');
                csvContent += linhaFormatada + '\n';
            });

            const encoder = new TextEncoder();
            return encoder.encode(csvContent);
        }
    }
}

// Adicionar estilos para animações de notificação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===========================
// INICIALIZAÇÃO DO SISTEMA
// ===========================

// Inicializar sistema quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.sistema = new SistemaCadastro();
}); 

// Garantir que exista um gerador de IDs para registros
if (typeof SistemaCadastro !== 'undefined' && !SistemaCadastro.prototype.gerarId) {
    SistemaCadastro.prototype.gerarId = function() {
        const randomPart = Math.random().toString(36).slice(2, 8);
        const timePart = Date.now().toString(36);
        return `id_${timePart}_${randomPart}`;
    };
}

