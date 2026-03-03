# Passo a Passo: Configuração do Fluxo n8n SCCS

Este documento foi totalmente reescrito para te dar as instruções exatas de **copiar e colar** em cada nó do seu n8n.
Se o n8n apresentou erros de "[undefined]" ou queixas de parâmetros vazios, a configuração exata abaixo soluciona todos.

## O Que Fazer
Você não precisa construir os blocos do zero. Você precisa **Importar** o arquivo, e **revisar/corrigir** os campos chaves conforme o guia abaixo.

---

### Passo 1: O Nó Gatilho (Email Trigger)
Este é o bloco verde com o raio `⚡`. Ele processa um e-mail imediatamente assim que ele chega.
*   **Action:** `Mark as Read` (Isto evita que o bot leia o e-mail dezenas de vezes).
*   **Download Attachments:** `Ativado / ON`
*   **Property Prefix Name:** `attachment_`

### Passo 2: O Nó de IA (AI Agent)
Este é o cérebro que lê a Nota Fiscal. Note a instrução (Prompt) que enviamos a ele:
*   Clique no nó **AI Agent**.
*   No campo de texto, cole EXATAMENTE:
```text
Você é um assistente financeiro. Leia o texto da nota fiscal e extraia estritamente 5 informações em formato JSON: 'fornecedor', 'numero_nota', 'data', 'valor_total' e 'termo_projeto'.
Responda APENAS o JSON bruto, sem blocos de código markdown ou explicações.
Texto da nota: {{ $json.text }}
```

### Passo 3: O Nó de Fusão (Merge)
Este é o nó onde os textos e arquivos se reúnem. É ele que causou erros antes.
*   Entre no nó **Merge**.
*   **Mode:** `Combine`
*   **Combination Mode:** Mude obrigatoriamente para `Merge By Position` (ou `Multiplex`).
*   *(O N8N não vai mais te pedir Input 1 e Input 2).*

### Passo 4: O Nó de Upload (Nextcloud)
Este nó sobe o PDF para o servidor do CasaOS.
*   Entre no nó **Upload a file** (nuvem azul).
*   **Operation:** `Upload`
*   **File Path** (Copie e cole isto no retângulo preto):
```text
/sccs_api/nf_sem_comprovante/NF_{{ $json.numero_nota }}_{{ String($json.fornecedor).replace(/\s+/g, '_') }}.pdf
```
*   **Binary Data:** `Ativado / ON` (Procure uma chavinha ou toggle com este nome)
*   **Binary Property:** `attachment_0` (Nunca use o campo "File Content" de texto puro, se ele existir deixe em branco).

### Passo 5: O Nó SCCS Web API (O Salvador do Banco de Dados)
Este é o nó final roxo (HTTP Request). É ele que envia os dados para o seu site (Next.js/PostgreSQL).
Como o nó anterior (Nextcloud) apagou os dados do PDF da esteira após o upload, se usarmos o código normal o Next.js vai gravar seu banco de dados vazio. 
Você precisa obrigatoriamente usar na aba **JSON** o código que busca os dados no passado (no nó Merge).

*   Entre no nó **SCCS Web API**.
*   URL: `http://192.168.15.4:3001/api/webhooks/invoice`
*   **Body Content Type:** `JSON`
*   **Specify Body:** `Using JSON`
*   No campo preto grande (JSON), **apague TUDO** e Cole EXATAMENTE este bloco abaixo:

```json
{
  "invoice_number": "{{ $node[\"Merge\"].json.numero_nota }}",
  "supplier": "{{ $node[\"Merge\"].json.fornecedor }}",
  "amount": "{{ $node[\"Merge\"].json.valor_total }}",
  "date": "{{ $node[\"Merge\"].json.data }}",
  "project_term": "{{ $node[\"Merge\"].json.termo_projeto }}",
  "file_url": "http://nextcloud.sccruzeirodosul.org/remote.php/dav/files/casaos/sccs_api/nf_sem_comprovante/NF_{{ $node[\"Merge\"].json.numero_nota }}_{{ String($node[\"Merge\"].json.fornecedor).replace(/\\s+/g, '_') }}.pdf"
}
```

> **Por que `$node["Merge"]`?** Isso diz ao N8N: *"Não tente pegar os dados que saíram do Nextcloud, porque eles estão em branco. Volte no tempo até o nó `Merge` e recupere as variáveis `numero_nota` e `fornecedor` lá de trás!"*. Isso previne 100% dos erros `[undefined]`.

---

### Passo Bônus: Salvando o Banco de Gravações
Sempre que você alterar um nó no n8n, você precisa clicar no grande botão laranja `Execute Step` (canto superior) ou no botão gigante do lado esquerdo `Execute Workflow` para rodar os dados do início ao fim e confirmar se as luzes verdes se acendem.
