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

## Debug

Para ver logs detalhados do envio:
1. Abra o console do navegador (F12)
2. Tente enviar um email
3. Verifique os logs no console para identificar o problema

