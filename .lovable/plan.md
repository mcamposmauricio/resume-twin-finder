

## Plano: Seção "Sobre Nós" e Redesign da Página de Carreiras

### Visão Geral

Implementar duas melhorias principais:
1. Nova seção nas configurações para informações da empresa (Sobre Nós, benefícios, cultura)
2. Redesign completo da página de carreiras com layout moderno e mais customizações

---

### 1. Novas Informações da Empresa (Configurações)

**Campos a adicionar na tabela `profiles`:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `company_tagline` | text | Slogan/frase de impacto da empresa |
| `company_about` | text | Texto "Sobre Nós" (suporta quebras de linha) |
| `company_benefits` | jsonb | Lista de benefícios (ex: ["Home office", "Vale refeição"]) |
| `company_culture` | text | Texto sobre cultura/valores |
| `company_website` | text | URL do site da empresa |
| `company_linkedin` | text | URL do LinkedIn |
| `company_instagram` | text | URL do Instagram |
| `careers_hero_image_url` | text | Imagem de capa para a página de carreiras |
| `careers_cta_text` | text | Texto do botão de CTA (ex: "Venha fazer parte!") |

---

### 2. Nova Aba "Sobre a Empresa" em Configurações

A aba "Marca" fica focada em identidade visual, e criamos uma nova aba para conteúdo textual da empresa:

```text
Tabs:
[Marca] [Sobre a Empresa] [Página de Carreiras] [Pipeline]
```

**Conteúdo da aba "Sobre a Empresa":**

```text
+----------------------------------------------------------+
| Sobre a Empresa                                           |
+----------------------------------------------------------+
| Tagline / Slogan                                         |
| [Transformando a gestão de pessoas desde 2018          ] |
|                                                          |
| Sobre Nós                                                |
| [                                                       ]|
| [   Textarea grande para texto descritivo               ]|
| [                                                       ]|
|                                                          |
| Nossa Cultura                                            |
| [                                                       ]|
| [   Textarea para valores e cultura                     ]|
| [                                                       ]|
+----------------------------------------------------------+
| Benefícios                                               |
| [+ Adicionar benefício]                                  |
|                                                          |
| [x] Home office flexível                                 |
| [x] Vale refeição                                        |
| [x] Plano de saúde                                       |
| [x] Day off aniversário                                  |
+----------------------------------------------------------+
| Redes Sociais                                            |
|                                                          |
| Website: [https://empresa.com.br                       ] |
| LinkedIn: [https://linkedin.com/company/...            ] |
| Instagram: [https://instagram.com/...                  ] |
+----------------------------------------------------------+
```

---

### 3. Redesign da Página de Carreiras

**Layout atual → Layout proposto:**

```text
ANTES:
+------------------------------------------+
| Logo                    Trabalhe Conosco |
+------------------------------------------+
| Junte-se ao time!                        |
| Confira nossas vagas...                  |
|                                          |
| [Filtros]                                |
| [Card Vaga 1]                            |
| [Card Vaga 2]                            |
+------------------------------------------+
| Powered by CompareCV                     |
+------------------------------------------+


DEPOIS:
+----------------------------------------------------------+
| Logo                      [Site] [LinkedIn] [Instagram]  |
+----------------------------------------------------------+
|                                                          |
|  [                Hero Image                          ]  |
|                                                          |
|  "Tagline da empresa aqui"                               |
|                                                          |
|  [    Venha fazer parte do time!    ] <- CTA            |
|                                                          |
+----------------------------------------------------------+
| SOBRE NÓS                                                |
+----------------------------------------------------------+
| [Icone]                                                  |
| Texto sobre a empresa, história, missão...               |
|                                                          |
| NOSSA CULTURA                                            |
| Valores e forma de trabalhar...                          |
+----------------------------------------------------------+
| BENEFÍCIOS                                               |
+----------------------------------------------------------+
| [Icon] Home office    [Icon] Vale refeição              |
| [Icon] Plano saúde    [Icon] Day off                    |
+----------------------------------------------------------+
| VAGAS ABERTAS (5)                                        |
+----------------------------------------------------------+
| [Filtros: Tipo | Localização | Busca]                   |
|                                                          |
| +------------------------+ +------------------------+   |
| | Desenvolvedor React    | | Product Manager        |   |
| | Remote · São Paulo     | | Híbrido · SP           |   |
| | R$ 8-12k               | | R$ 15-20k              |   |
| | [Ver detalhes]         | | [Ver detalhes]         |   |
| +------------------------+ +------------------------+   |
|                                                          |
+----------------------------------------------------------+
| Powered by CompareCV powered by MarQ                     |
+----------------------------------------------------------+
```

---

### 4. Customizações Disponíveis

**Aba "Página de Carreiras" expandida:**

```text
+----------------------------------------------------------+
| Página Pública de Carreiras                              |
+----------------------------------------------------------+
| [Switch] Habilitar página de carreiras                   |
|                                                          |
| URL: /carreiras/[slug]          [Copiar] [Abrir]        |
+----------------------------------------------------------+
| Personalização Visual                                    |
+----------------------------------------------------------+
| Imagem de capa (Hero)                                    |
| [https://...imagem.jpg                                 ] |
| Preview: [Imagem]                                        |
|                                                          |
| Texto do botão principal                                 |
| [Venha fazer parte!                                    ] |
|                                                          |
| [Switch] Exibir seção "Sobre Nós"                       |
| [Switch] Exibir seção "Benefícios"                      |
| [Switch] Exibir seção "Cultura"                         |
| [Switch] Exibir redes sociais                           |
+----------------------------------------------------------+
```

---

### 5. Detalhes Técnicos

**Migração de banco de dados:**

```sql
-- Adicionar campos na tabela profiles
ALTER TABLE profiles
ADD COLUMN company_tagline TEXT,
ADD COLUMN company_about TEXT,
ADD COLUMN company_benefits JSONB DEFAULT '[]',
ADD COLUMN company_culture TEXT,
ADD COLUMN company_website TEXT,
ADD COLUMN company_linkedin TEXT,
ADD COLUMN company_instagram TEXT,
ADD COLUMN careers_hero_image_url TEXT,
ADD COLUMN careers_cta_text TEXT DEFAULT 'Venha fazer parte!',
ADD COLUMN careers_show_about BOOLEAN DEFAULT true,
ADD COLUMN careers_show_benefits BOOLEAN DEFAULT true,
ADD COLUMN careers_show_culture BOOLEAN DEFAULT true,
ADD COLUMN careers_show_social BOOLEAN DEFAULT true;
```

---

### 6. Arquivos a Modificar

**1. `src/pages/Settings.tsx`**
- Adicionar nova aba "Sobre a Empresa"
- Campos para tagline, about, culture
- Editor de lista de benefícios (adicionar/remover)
- Campos para redes sociais
- Expandir aba "Página de Carreiras" com toggles de exibição

**2. `src/pages/PublicCareers.tsx`**
- Redesign completo do layout
- Hero section com imagem de capa
- Seção "Sobre Nós" condicional
- Grid de benefícios com ícones
- Seção de cultura/valores
- Links para redes sociais no header
- Cards de vagas em grid (2 colunas desktop)
- Melhor tipografia e espaçamento

---

### 7. Componentes da Página de Carreiras

**Hero Section:**
- Imagem de fundo (se configurada) ou gradiente com cor da marca
- Tagline em destaque
- Botão CTA que scrolla para vagas

**About Section:**
- Ícone e título "Sobre Nós"
- Texto formatado (whitespace-pre-wrap)
- Seção de cultura lado a lado ou abaixo

**Benefits Grid:**
- Grid responsivo 2x2, 3x3 ou 4x2
- Ícones (check ou custom) + texto
- Fundo sutil com cor da marca

**Jobs Grid:**
- Cards em grid de 2 colunas (1 no mobile)
- Mais informações visíveis (tipo, local, salário)
- Botão "Ver detalhes" mais destacado
- Barra de busca/filtro sticky

**Footer:**
- Links para redes sociais
- Powered by CompareCV powered by MarQ

---

### 8. Interface do Editor de Benefícios

```text
+------------------------------------------+
| Benefícios                [+ Adicionar]  |
+------------------------------------------+
| [x] Home office flexível        [Editar] |
| [x] Vale refeição               [Editar] |
| [x] Plano de saúde              [Editar] |
| [x] Gympass                     [Editar] |
|                                          |
+------------------------------------------+

Dialog "Adicionar Benefício":
+------------------------------------------+
| Adicionar Benefício                      |
|                                          |
| Texto: [Vale transporte                ] |
|                                          |
| [Cancelar]              [Adicionar]      |
+------------------------------------------+
```

---

### 9. Passos de Implementação

1. **Banco de dados:**
   - Executar migração para adicionar novos campos

2. **Settings - Aba "Sobre a Empresa":**
   - Criar componente para editor de benefícios
   - Adicionar campos de texto para about/culture
   - Campos para redes sociais

3. **Settings - Expandir aba "Carreiras":**
   - Campo para imagem hero
   - Campo para texto CTA
   - Toggles de exibição de seções

4. **PublicCareers - Redesign:**
   - Buscar novos campos do profile
   - Implementar Hero Section
   - Implementar About Section
   - Implementar Benefits Grid
   - Redesenhar Jobs Grid
   - Adicionar links sociais

5. **Responsividade:**
   - Testar em mobile, tablet e desktop
   - Ajustar grids e espaçamentos

---

### 10. Exemplos de Benefícios Pré-sugeridos

Ao adicionar benefícios, sugerir opções comuns:
- Home office / Trabalho remoto
- Vale refeição
- Vale alimentação
- Vale transporte
- Plano de saúde
- Plano odontológico
- Gympass / Academia
- Day off aniversário
- PLR / Bônus
- Cursos e capacitação
- Horário flexível
- Auxílio home office

