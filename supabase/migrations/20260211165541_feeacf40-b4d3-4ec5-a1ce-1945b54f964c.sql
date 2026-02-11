
-- Create job_templates table
CREATE TABLE public.job_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  requirements text,
  salary_range text,
  work_type text,
  location text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_templates ENABLE ROW LEVEL SECURITY;

-- Only allow SELECT for authorized emails
CREATE POLICY "Authorized users can view job templates"
ON public.job_templates
FOR SELECT
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
    'rebeca.liberato@letsmake.com.br',
    'mauricio@marqponto.com.br',
    'thaina@marqponto.com.br'
  )
);

-- Seed 9 templates from PDFs
INSERT INTO public.job_templates (title, description, requirements, salary_range) VALUES

('Analista de Área de Gente',
'Responsável por apoiar a Área de Gente em duas frentes principais: saúde emocional e processos de RH (Área de Gente). Realiza acolhimentos organizacionais individuais com escuta qualificada, efetua encaminhamentos quando necessário e promove ações de bem-estar e qualidade de vida no trabalho, assegurando conformidade com a NR1. Atua também na condução de processos de recrutamento e seleção, integração, acompanhamento de indicadores de clima e iniciativas que fortalecem a cultura e o engajamento dos colaboradores.

Atividades:
- Realizar atendimentos de acolhimento aos colaboradores, com escuta qualificada e encaminhamentos quando necessário.
- Conduzir processos seletivos de vagas operacionais e administrativas, apoiando também recrutamentos estratégicos.
- Apoiar programas de integração, treinamentos e desenvolvimento humano.
- Planejar e facilitar palestras e treinamentos sobre saúde mental, inteligência emocional, comunicação e comportamento organizacional.
- Elaborar registros e pareceres técnicos exigidos pela NR1, mantendo conformidade legal.
- Acompanhar e analisar indicadores de clima, engajamento e saúde emocional.
- Contribuir em iniciativas de endomarketing e fortalecimento da cultura organizacional.
- Apoiar rotinas de RH de forma integrada às demais áreas da empresa.',
'Habilidades: Escuta Ativa, Empatia, Ética Profissional, Discrição, Comunicação clara e acolhedora, Organização e Atenção aos detalhes, Capacidade de Análise e Síntese, Proatividade, Iniciativa, Facilidade para conduzir grupos e treinamentos, Sensibilidade.',
'R$ 3.120,00'),

('Analista de Manutenção',
'Responsável por realizar a gestão das demandas de manutenção das lojas, garantindo o bom funcionamento das estruturas, equipamentos e mobiliários. Atuar na negociação e relacionamento com fornecedores, execução de cotações, compra de materiais e acompanhamento de ordens de serviço. Realizar análise das necessidades de manutenção preventiva e corretiva, bem como executar pequenos reparos quando necessário.

Atividades:
- Gerir todas as demandas relacionadas à manutenção das lojas e dos estoques;
- Realizar cotações de serviços e materiais de manutenção;
- Manter relacionamento com fornecedores, negociando prazos, custos e qualidade;
- Identificar e analisar necessidades de manutenção preventiva e corretiva nas lojas;
- Comprar materiais de manutenção;
- Executar pequenos reparos e manutenções simples quando necessário;
- Interagir com administradoras de shopping centers para buscar indicações e contatos de prestadores de serviço;
- Controlar e acompanhar ordens de serviço (OS) garantindo a execução dentro do prazo;
- Apoiar na organização de chamados e na priorização das demandas de manutenção.',
'Habilidades: Boa Comunicação, Capacidade de Negociação, Perfil "Mão na Massa", Paciente, Proativo, Ágil, Atencioso, Ter iniciativa, Organizado, Bom relacionamento interpessoal.',
'R$ 3.120,00'),

('Assistente da Área de Gente',
'Responsável por apoiar as atividades da Área de Gente, com foco em Recrutamento & Seleção, integração de novos colaboradores, comunicação interna e ações de endomarketing. Atua no acompanhamento dos processos seletivos, desde a triagem até o feedback aos candidatos, elabora relatórios para a gestão e garante a atualização dos controles da área. Também organiza eventos internos, celebrações e iniciativas que promovam engajamento e fortalecimento da cultura da empresa.

Atividades:
- Conduzir as etapas operacionais do Recrutamento & Seleção: triagem de currículos, agendamento e realização de entrevistas, comunicação com candidatos e fornecimento de feedbacks.
- Elaborar e enviar relatórios periódicos sobre os processos seletivos para a Gerência da Área de Gente e setor de Operações.
- Apoiar o processo de admissão: envio das informações ao Departamento Pessoal e comunicação com os gestores sobre datas de início.
- Realizar acolhimento e comunicação com novos colaboradores, garantindo uma experiência positiva desde a aprovação até o primeiro dia.
- Agendar e conduzir integrações, aplicar o teste de conhecimento posterior e atualizar controles relacionados.
- Manter atualizadas as planilhas de controle e sistemas da área.
- Participar de reuniões da área e elaborar atas.
- Apoiar a organização e execução de ações de endomarketing e eventos internos.
- Enviar comunicados da Área de Gente nos canais oficiais.',
'Habilidades: Boa Comunicação, Atenção aos detalhes, Colaborativo, Proativo, Dinâmico, Ter energia, Fácil aprendizado, Organizado, Ágil, Bom relacionamento interpessoal.',
'R$ 2.080,00'),

('Gerente de Loja',
'Responsável por gerenciar a operação da unidade, garantindo o cumprimento de metas, acompanhamento de vendas e desempenho da equipe. Suas atividades incluem a gestão da abertura e fechamento da loja, organização de mercadorias, alinhamento com as diretrizes comerciais e de Visual Merchandising, além do desenvolvimento e engajamento do time por meio de treinamentos e comunicação de estratégias.

Atividades:
- Distribuir metas, acompanhar e monitorar vendas;
- Gerir a abertura e fechamento da loja;
- Comunicar a equipe sobre campanhas de incentivo de vendas;
- Coordenar recebimento, abastecimento e organização de mercadorias;
- Orientar a equipe sobre a exposição dos produtos, conforme diretrizes das áreas Comercial e de Visual Merchandising;
- Acompanhar os indicadores de desempenho da loja;
- Garantir o cumprimento dos padrões de Visual Merchandising;
- Incentivar a equipe a seguir as normas e metas da empresa;
- Realizar a integração de novos colaboradores;
- Desenvolver e engajar a equipe, promovendo uma gestão eficiente;
- Assegurar a comunicação clara das ações e estratégias para o time.',
'Habilidades: Liderança, Pacote Office (Word, Excel, PowerPoint), Agilidade, Boa Comunicação, Proativo, Atencioso, Organizado, Trabalho em Equipe, Bom relacionamento interpessoal, Dinâmico, Flexibilidade.',
NULL),

('Gerente Regional Comercial',
'Responsável por gerenciar as operações de todas as unidades do estado de atuação, garantindo a eficiência, o cumprimento de metas, o acompanhamento das vendas da região, desempenho das equipes e a padronização e rentabilidade das operações. Este profissional atua como elo entre a Gerência de Operações e as unidades locais promovendo a cultura organizacional.

Atividades:
- Gerenciar presencialmente as equipes de supervisão e operações das lojas da regional, definindo metas, estratégias e acompanhando a execução dos processos e políticas da empresa;
- Acompanhar os principais indicadores da operação (GI, taxa de conversão, ruptura, ticket médio, entre outros), analisando resultados e propondo ações corretivas;
- Visitar as lojas do estado e a concorrência para avaliar a exposição de produtos, atendimento e abastecimento;
- Coordenar o abastecimento das lojas, assegurando que todos os produtos em estoque estejam disponíveis para venda;
- Validar a implantação de campanhas, promoções e ações comerciais nas lojas;
- Elaborar relatórios quinzenais com análise SWOT sobre concorrentes;
- Garantir a manutenção da infraestrutura das lojas;
- Desenvolver, acompanhar e orientar as equipes de supervisão, promovendo feedbacks contínuos;
- Enviar as escalas mensais ao Departamento Pessoal até o dia 20;
- Consolidar e apresentar os resultados mensais da regional;
- Corrigir e redirecionar as ações de vendas com base nos resultados obtidos.',
'Requisitos: Ensino Superior cursando ou concluído; Experiência com gestão de indicadores e melhoria contínua; Conhecimento em Excel e PowerPoint; Vivência com gestão de pessoas e liderança de equipe; Disponibilidade para trabalhar em escala de shopping; Disponibilidade para viagens e flexibilidade de horário; Desejável conhecimento em atendimento consultivo; Experiência em operação de loja será um diferencial.

Habilidades: Liderança e Gestão de Equipes, Habilidade de Comunicação, Bom relacionamento interpessoal, Visão Estratégica, Capacidade de Resolução de Problemas, Conhecimento em Gestão de Operações, Conhecimento em Logística e Cadeia de Suprimentos, Habilidade de Análise de Dados, Habilidade de Interpretar Resultados Financeiros, Adaptabilidade e Flexibilidade, Dinâmico, Proativo, Atencioso, Organizado.',
'R$ 4.368,00'),

('Motorista',
'Responsável por atender demandas da diretoria, áreas administrativas e operacionais, realizando o transporte de pessoas, cargas e valores com segurança e responsabilidade. É essencial zelar pela conservação dos veículos, realizar manutenções básicas, manter boa apresentação pessoal e garantir um atendimento de qualidade aos clientes internos e externos.

Atividades:
- Atender às demandas de transporte da diretoria, áreas administrativas e operacionais.
- Dirigir e manobrar veículos, transportando pessoas, cargas ou valores com segurança.
- Realizar carga e descarga de mercadorias.
- Realizar verificações e manutenções básicas nos veículos.
- Preencher diariamente o checklist das condições básicas de manutenção.
- Manter boa aparência e higiene pessoal.
- Zelar pela qualidade das mercadorias transportadas e entregues.
- Prezar pelo bom relacionamento com clientes internos e externos.
- Conduzir o veículo de forma defensiva, respeitando todas as normas de trânsito.
- Executar outras atividades correlatas e inerentes à função.',
'Requisitos: Ensino médio completo; Necessário ter experiência com rotas e entregas; Foco em resultados e senso de urgência; Forte resistência à pressão e capacidade de coordenação; Alta capacidade analítica e conhecimento de rotas; Carteira de motorista definitiva (categoria B).

Habilidades: Boa Comunicação, Proativo, Ágil, Atencioso, Ter iniciativa, Organizado, Bom relacionamento interpessoal, Paciente, Bom condutor de veículos.',
'R$ 1.666,01'),

('Operador(a) de Loja',
'Responsável pelo atendimento humanizado ao cliente, aplicação de técnicas de vendas, alcance de metas e operação de caixa. Suas atividades incluem abertura e fechamento da loja, organização e reposição de produtos, controle de estoque, apoio no recebimento de mercadorias e alinhamento com as diretrizes comerciais e de Visual Merchandising, garantindo a excelência na experiência do cliente e o bom funcionamento da loja.

Atividades:
- Realizar atendimento humanizado e atencioso aos clientes, garantindo uma experiência de compra positiva.
- Aplicar técnicas de vendas consultivas, buscando entender as necessidades dos clientes e oferecendo os produtos mais adequados.
- Cumprir as metas de vendas individuais e/ou coletivas.
- Operar o caixa: registrar vendas, processar pagamentos, emitir notas fiscais e realizar o fechamento de caixa.
- Realizar abertura ou fechamento da loja, conforme escala.
- Organizar e manter a limpeza da loja, incluindo exposição adequada dos produtos e reposição de mercadorias.
- Zelar pela organização e controle do estoque.
- Receber e conferir mercadorias entregues pelos fornecedores.
- Informar os clientes sobre promoções vigentes.
- Apoiar os demais departamentos da loja quando necessário.',
'Requisitos: Ensino Médio completo; Idade a partir de 25 anos; Disponibilidade de horário para trabalhar em escala 6x1; Noções básicas de informática; Gostar de trabalhar com atendimento ao público e vendas.

Diferenciais: Experiência anterior no varejo, especialmente em lojas de moda, beleza, cosméticos ou perfumaria; Conhecimento básico em maquiagem e produtos de beleza.

Habilidades: Boa comunicação e simpatia no contato com o público, Foco em resultados e no atendimento ao cliente, Proatividade, Atenção e cuidado, Organização e atenção a detalhes, Trabalho em equipe, Flexibilidade e adaptabilidade.',
NULL),

('Operador(a) de Monitoramento',
'Responsável por analisar as imagens captadas pela central de monitoramento da empresa, reportando-se diretamente à diretoria. Esse profissional realiza a verificação do funcionamento de todos os equipamentos de segurança, incluindo câmeras, monitores, gravadores, cabos e demais dispositivos integrados ao sistema de CFTV. Deverá atuar de forma preventiva e analítica, colaborando com a identificação de ocorrências e oportunidades de melhoria nos processos de segurança.

Atividades:
- Monitorar as imagens captadas pelas câmeras da central, utilizando a mesa controladora e os sistemas de CFTV.
- Analisar em tempo real as informações transmitidas pelas câmeras, identificando situações suspeitas ou anormais.
- Realizar retrocesso de imagens para verificar ocorrências específicas, com base em data, horário e local.
- Resgatar e armazenar gravações relevantes em mídias externas para fins de registro ou investigação.
- Ativar e desativar alarmes de segurança conforme os procedimentos estabelecidos.
- Analisar mensagens e alertas emitidos automaticamente pelo sistema de monitoramento.
- Gerenciar o sistema de segurança eletrônico, garantindo seu pleno funcionamento.
- Auxiliar as equipes de segurança com informações precisas captadas pelas câmeras.
- Realizar todas as atividades com alto nível de concentração, foco e capacidade analítica.',
'Habilidades: Conhecimento em tecnologia para monitoramento, Domínio em redes, configurações e equipamentos de segurança, Intermediário em informática, Alta capacidade analítica, Atencioso, Paciente, Organizado, Proativo, Ágil.',
'R$ 1.690,93'),

('Supervisor(a) de Loja',
'Responsável por liderar a equipe da loja e acompanhar o desempenho individual e coletivo, garantindo o alcance das metas estabelecidas. Atua no atendimento humanizado ao cliente, aplicando técnicas de vendas e desenvolvendo campanhas de incentivo, além de controlar relatórios e indicadores da operação. Também apoia as atividades comerciais, de organização, reposição, exposição de produtos e operação de caixa, assegurando a excelência na experiência do cliente e o bom funcionamento da loja.

Atividades:
- Liderar a equipe, acompanhando desempenho individual e coletivo;
- Garantir o cumprimento das metas e indicadores da loja;
- Atuar no atendimento humanizado ao cliente, aplicando técnicas de vendas;
- Desenvolver campanhas de incentivo e ações para alavancar resultados;
- Apoiar na organização da loja, reposição e exposição de produtos;
- Realizar abertura e fechamento da loja;
- Operar o caixa, registrando vendas e recebendo pagamentos;
- Controlar e organizar o estoque, incluindo recebimento de mercadorias;
- Emitir e analisar relatórios de vendas, campanhas e desempenho da equipe;
- Alinhar práticas e execução conforme diretrizes comerciais e de Visual Merchandising;
- Assegurar a excelência na experiência do cliente e o bom funcionamento da loja.',
'Requisitos: Ensino Superior completo ou cursando; Idade a partir de 21 anos; Experiência com liderança de equipes; Disponibilidade de horário para trabalhar em escala 6x1; Noções básicas de informática; Gostar de trabalhar com atendimento ao público e vendas.

Diferenciais: Experiência anterior no varejo, especialmente em lojas de moda, beleza, cosméticos ou perfumaria; Conhecimento básico em maquiagem e produtos de beleza.

Habilidades: Boa comunicação e simpatia no contato com o público, Foco em resultados e no atendimento ao cliente, Proatividade, Atenção e cuidado, Organização e atenção a detalhes, Trabalho em equipe, Flexibilidade e adaptabilidade.',
'R$ 2.000,00');
