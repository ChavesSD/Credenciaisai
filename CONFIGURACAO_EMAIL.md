# Configuração de Envio de Email

## Problema Atual

O sistema está usando FormSubmit, que pode não estar funcionando corretamente. O sistema mostra "enviado com sucesso", mas o email não chega.

## Solução Recomendada: EmailJS

EmailJS é mais confiável e permite envio de emails diretamente do navegador sem necessidade de servidor backend.

### Como Configurar EmailJS

1. **Criar conta no EmailJS**
   - Acesse: https://www.emailjs.com/
   - Crie uma conta gratuita (até 200 emails/mês)

2. **Configurar Email Service**
   - No dashboard, vá em "Email Services"
   - Adicione um serviço (Gmail, Outlook, etc.)
   - Anote o **Service ID**

3. **Criar Template de Email**
   - Vá em "Email Templates"
   - Crie um novo template
   - Use as variáveis:
     - `{{to_email}}` - Email de destino
     - `{{from_name}}` - Nome do remetente
     - `{{from_email}}` - Email do remetente
     - `{{subject}}` - Assunto
     - `{{message}}` - Mensagem
   - **IMPORTANTE para anexos**: 
     - O EmailJS envia anexos automaticamente quando você usa `sendForm()` com inputs de arquivo
     - Os anexos são enviados automaticamente - não é necessário configurar nada no template
     - **Verifique se o serviço de email suporta anexos**: Alguns serviços (como Gmail) podem ter limitações
     - Se os anexos não chegarem, verifique:
       1. Se o tamanho total dos arquivos não excede 50MB (plano gratuito)
       2. Se o serviço de email configurado suporta anexos
       3. Se há algum erro no console do navegador
   - Anote o **Template ID**

4. **Obter Public Key**
   - Vá em "Account" > "General"
   - Copie a **Public Key**

5. **Configurar no Sistema**
   - Abra o console do navegador (F12)
   - Execute o seguinte comando substituindo pelos seus valores:

```javascript
localStorage.setItem('emailjsConfig', JSON.stringify({
    publicKey: 'SUA_PUBLIC_KEY_AQUI',
    serviceId: 'SEU_SERVICE_ID_AQUI',
    templateId: 'SEU_TEMPLATE_ID_AQUI'
}));
```

6. **Testar**
   - Recarregue a página
   - Tente enviar um email
   - O sistema tentará usar EmailJS primeiro, e se não estiver configurado, usará FormSubmit como fallback

## Verificar Configuração Atual

Para verificar se EmailJS está configurado, execute no console:

```javascript
console.log(localStorage.getItem('emailjsConfig'));
```

## Limpar Configuração

Para limpar a configuração do EmailJS:

```javascript
localStorage.removeItem('emailjsConfig');
```

## Alternativa: Usar FormSubmit Corretamente

Se preferir continuar usando FormSubmit, verifique:

1. Se o email de destino está correto
2. Se não há bloqueio de CORS no navegador
3. Se o FormSubmit não está bloqueando o domínio
4. Verifique a pasta de spam do destinatário

## Envio de Anexos

O sistema agora suporta envio de anexos (arquivos Excel) via EmailJS:

- Os arquivos Excel são automaticamente convertidos e anexados ao email
- O EmailJS usa `sendForm()` para enviar os anexos
- Os anexos são nomeados como `attachment_1`, `attachment_2`, etc.
- **Limitações**: 
  - Plano gratuito: até 50MB por email
  - Verifique o tamanho total dos arquivos antes de enviar
  - Se os anexos não chegarem, verifique se o tamanho não excede o limite

## Debug

Para ver logs detalhados do envio:
1. Abra o console do navegador (F12)
2. Tente enviar um email
3. Verifique os logs no console para identificar o problema
4. Os logs mostrarão informações sobre os anexos preparados


