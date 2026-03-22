

# Plano: Corrigir Sincronização (API ML bloqueando browser)

## Problema
A API do Mercado Livre está retornando **403 Forbidden** para todas as requisições feitas do browser (preview do Lovable). A estratégia atual de buscar do lado do cliente não funciona porque o ML bloqueia origens não autorizadas.

## Solução
Mover toda a lógica de busca para a **Edge Function**, usando as credenciais OAuth (ML_CLIENT_ID / ML_CLIENT_SECRET) já configuradas. A Edge Function fará a autenticação e buscará os produtos diretamente.

## Passos

### 1. Reescrever Edge Function `sync-ml-products`
- Obter token OAuth via `https://api.mercadolibre.com/oauth/token` usando `ML_CLIENT_ID` e `ML_CLIENT_SECRET` (grant_type: client_credentials)
- Buscar produtos de cada categoria via `/sites/MLB/search?category={id}&sort=sold_quantity_desc&limit=30` incluindo header `Authorization: Bearer {token}`
- Upsert dos resultados na tabela `products`
- Não receber mais produtos do body — a função faz tudo sozinha

### 2. Simplificar `useSyncProducts.ts`
- Remover toda a lógica de fetch do browser
- Apenas chamar `supabase.functions.invoke("sync-ml-products")` sem body
- Retornar o total de produtos sincronizados

### 3. Corrigir build error
- Adicionar script `"build:dev"` ao `package.json` (alias para `"vite build"`)

## Detalhes Técnicos
- As credenciais `ML_CLIENT_ID` e `ML_CLIENT_SECRET` já estão nos secrets
- A Edge Function roda em Deno (IP de datacenter), mas com OAuth token a API do ML deve aceitar
- Categorias hardcoded na Edge Function (mesma lista de 6)

