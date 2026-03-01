# Tutorial: Integração SCCS com n8n

Este guia explica como configurar o fluxo fornecido no n8n para extrair notas fiscais recebidas por e-mail e enviá-las para a API do SCCS.

## 1. Importando o Fluxo

1. Abra o seu painel do n8n (geralmente em `http://<seu-ip-casaos>:5678`).
2. No menu lateral esquerdo, clique em **Workflows** e depois em **Add workflow**.
3. No canto superior direito, procure o ícone de engrenagem ou os três pontinhos (**...**) e selecione **Import from File**.
4. Selecione o arquivo `n8n_sccs.json` que está na pasta raiz do seu projeto.
5. O fluxo será carregado na tela, mostrando a conexão desde o recebimento do e-mail até o envio para a API da web.

## 2. Configurando as Credenciais

O fluxo precisa de acesso a três serviços diferentes. Se alguma credencial estiver faltando ou incorreta, o nó ficará com um aviso vermelho/amarelo. Você precisará reconfigurá-las:

1. **Email Read (IMAP):**
   - Dê um duplo clique no nó "Email Read (SCCS)".
   - Selecione a credencial IMAP apropriada (ou crie uma nova inserindo os detalhes de host, porta, e-mail e senha correspondentes à caixa de e-mail que receberá as notas). Mantenha a opção que busca apenas não lidos `"UNSEEN"`.
2. **NextCloud (Armazenamento de PDFs):**
   - Dê um duplo clique no nó "Upload a file" (nó do Nextcloud).
   - Configure a credencial do **NextCloud Api account**. Insira sua WebDAV URL (se `.../dav/files/` não funcionar, tente usar `http://nextcloud.sccruzeirodosul.org/remote.php/webdav/`), o usuário da sua conta Nextcloud e sua senha/token.
3. **Google Gemini (Extração de Dados com IA):**
   - Dê um duplo clique no nó "Google Gemini Chat Model".
   - Certifique-se de preencher a **Google Gemini(PaLM) Api account** com uma API Key válida do Google Gemini. A IA usará o prompt no nó "AI Agent" para extrair os 5 campos do PDF para o JSON final.

## 3. Configurando a Rota da sua API no Next.js

Certifique-se de que o webhook aponta para a URL correta na sua rede local ou servidor público:
1. Dê um duplo clique no nó "SCCS Web API" (nó do tipo `HTTP Request`).
2. No campo **URL**, verifique se o endereço bate com o lugar onde sua API está rodando. O padrão atual no arquivo é:
   `http://192.168.15.4:3001/api/webhooks/invoice`
   Se você usa outra porta (ex: 3000) ou outro IP, atualize aqui.

*(Nota: O erro de formatação duplo do `file_url` no JSON original já foi corrigido por você)*

## 4. Teste e Ativação

1. Com o sistema SCCS Next.js rodando (`npm run dev` ou container docker rodando), tente enviar um e-mail de teste com uma Nota Fiscal em PDF para o e-mail cadastrado no nó IMAP.
2. No n8n, clique em **Test Workflow** (na parte inferior da tela). Ele buscará o servidor de e-mail por algo novo e começará a procissão.
3. Se tudo estiver correto, o nó **SCCS Web API** retornará `Status 201: Created` com sucesso.
4. Você pode ativar permanentemente o Workflow acionando o botão de **Active** no canto superior direito para o fluxo operar sozinho em background.
