import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const DEMO_USER_ID = "d1a8e600-e028-4a20-8b34-7f9b7e3833d9";

const RESUME_BASE64 = "JVBERi0xLjMKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiAzIDAgUgo+PgplbmRvYmoKMiAwIG9iago8PAovQmFzZUZvbnQgL0hlbHZldGljYSAvRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZyAvTmFtZSAvRjEgL1N1YnR5cGUgL1R5cGUxIC9UeXBlIC9Gb250Cj4+CmVuZG9iagozIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YyIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKNCAwIG9iago8PAovQ29udGVudHMgOCAwIFIgL01lZGlhQm94IFsgMCAwIDU5NS4yNzU2IDg0MS44ODk4IF0gL1BhcmVudCA3IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9QYWdlTW9kZSAvVXNlTm9uZSAvUGFnZXMgNyAwIFIgL1R5cGUgL0NhdGFsb2cKPj4KZW5kb2JqCjYgMCBvYmoKPDwKL0F1dGhvciAoYW5vbnltb3VzKSAvQ3JlYXRpb25EYXRlIChEOjIwMjYwNDA5MTI0MDA1KzAwJzAwJykgL0NyZWF0b3IgKGFub255bW91cykgL0tleXdvcmRzICgpIC9Nb2REYXRlIChEOjIwMjYwNDA5MTI0MDA1KzAwJzAwJykgL1Byb2R1Y2VyIChSZXBvcnRMYWIgUERGIExpYnJhcnkgLSBcKG9wZW5zb3VyY2VcKSkgCiAgL1N1YmplY3QgKHVuc3BlY2lmaWVkKSAvVGl0bGUgKHVudGl0bGVkKSAvVHJhcHBlZCAvRmFsc2UKPj4KZW5kb2JqCjcgMCBvYmoKPDwKL0NvdW50IDEgL0tpZHMgWyA0IDAgUiBdIC9UeXBlIC9QYWdlcwo+PgplbmRvYmoKOCAwIG9iago8PAovRmlsdGVyIFsgL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlIF0gL0xlbmd0aCAxNDUyCj4+CnN0cmVhbQpHYXRtOj51VGNBJ1Jla0dFRjFhL1NPP1NDNUMlITchZz4zdDFzKjJcOjByVVUiRyYvOHJhOEJLSUJSSDBrK2hURVZURClUJygzOmtrTkgvSkU6P0dnaGYvaj5bWUJ1ZSRDJkFRJGUtSVRYPW4ibnJtXCMqVFY1WShQa2IsdXFHYj8nTScnIVk2NGVIcjdYYkwrJSQmPk03L0VjKmBIPnAnI1wwUEFRJipTdTZ0WVF1ZXAiQHRuSEFvREJgbFFjcV8lcjEmZlRLLSwvQ1Yuaj0sSTcpdCVfSy8hVzooPTomOSRub2FYIjxIcGJLLVlWOClBalc+bEUrYWhJJCRRJCtaalMtOz1eTW9gOEI+KU9XTnFoaGdfdTFOQ2xUcSIqKCs2WTZPK11dQVhua1c1Jzw+TVFWLS9ZQT5XLUdEO0heWSlgXmRsYDpkOWQvXFllVkk0M2MxKGRBOl4pYGtXXz1cYCUqWTMpcmpjSGcuKGVTS1t0XGlgZSNocmZZUzVxQyROME8lUENiJVFuPXAnaSZLRCtbPkVhTTJhdS4ncyoqWW5BMDg+VilfIzBeNDU0LFxncis8MTdbczliX1dwNl5kQzRLUT5yN1whKENSM1dMXGtLdDNDXCEwQmBaK3EoKzdVSGdYVnIpcCgqUUI5WDJWJVFlSi5TI0wyWFgmPTZnYS8qT1pwSVBxRGt1MC1ULUtTNnA3ITRLQFQnTzJVJypsXTQvbSRMXEE6TiJgKURGX0QqKEdAOi9zV283SzdnJipEVjIvbyVMN1wvdUhoRkwvVzdZU3JOXltARCpkLyRyLDM4VDAtbTgnMnVcbFNZaVdrNyFvTHFXPjJSUCheamA/altjOCFkRmY/SSFIVCh1ZyctOURnYDYmYm0uaThSLC5IQ1BMKkd0cT0kQD5OVVRtaj43bk5VJ2huLXNRLU1uOmVMVzUvZmphM0BsSl0wKkFlSE1FNCw+U1lnOE0iWnNXM2g/WnEnTCJ1WGQ7cigoJmxPZThMMWs0N0hQV3RnaSplOlBZJ1wzSUJwJEFxdUdHOS0qdDhbNC09ZicqWk0nSmxzcjNaSltXWmdWPl82ZWtzTTNVQEdHSztMcG9vJFUsN0lxS0xKbyhuRmNOPylTcClEWyZXZVZqW01GUnIhblJJcFUjbnFaUCJzKGYjVVtiaWtncVYvMDomM0VHbXRPK1hMUDZGaV4jRkxOXEMobzQ7JlI8SmI3Qy09MV90Jy5wWUdsI1AxMGkhMU8jSWBIPTZVZEFLOEY+L2dBTEYwIkNdTVEyRms7XkpWVDpsZCNoKidcRT9uTlxKRUJjS1VUQmxJRykmbGpqMW1uRERBTSlyczxnJGooRm01NkdLdURzInFmYmNDS2c/Pm9vI2VUMWEnPmUsNktNM1NJOCNSRyRUamVhJCFoJlM8dS02XixmUXVcQ15PaEU9V0JRMEdmVS47OyFbLTRxPTg6LV8sNWhMSGspcUFCT14jaUMsUitSUXVMZ2tNPD91cU9ZW1UsaVtkWCpEOzRgLlRDPF1iQSE/InNlWmhSZ2ZVKC5KOFldVTtcRT1LYl1zZ3FnTmY4IjdJU1QwJzlnbFxZTmo/WHEtdTZXRDA3SWIqZVRoUHJySCdlaS4lXThnRV0xWzk5XDdTbUBzJzJSR14idUdeVi42OVZBYVA9MjBkRWQhQSM6bT5HTGA9UGd1cHVYJ1tJYTBgI1dESjtLLU9BTUpdQ2VScS9gXEhNQFNtN2RaYGw+LUdiJFtqOChDai90aVhCYC9eJCNRSlpKOyxeT3FEclA3JkRzOzdYVSE6cm5FL2M7ZXNzKGdDanBMXE1bWk1IbFw5OTUvSVo3XlkuIiRrbCZXMkcrZ1gwTT9qPyZJa0xGRVFbcHNPXGRrVmE5ZXRmZzUrWE4kVDA5JWxXJD4hTygiWztrZTlNWy8yfj5lbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA5CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDA2MSAwMDAwMCBuIAowMDAwMDAwMTAyIDAwMDAwIG4gCjAwMDAwMDAyMDkgMDAwMDAgbiAKMDAwMDAwMDMyMSAwMDAwMCBuIAowMDAwMDAwNTI0IDAwMDAwIG4gCjAwMDAwMDA1OTIgMDAwMDAgbiAKMDAwMDAwMDg1MyAwMDAwMCBuIAowMDAwMDAwOTEyIDAwMDAwIG4gCnRyYWlsZXIKPDwKL0lEIApbPDE4OWU3N2Y4OWZmZDViNTViYmFiMjk5ZmI0ZTA1Y2U4PjwxODllNzdmODlmZmQ1YjU1YmJhYjI5OWZiNGUwNWNlOD5dCiUgUmVwb3J0TGFiIGdlbmVyYXRlZCBQREYgZG9jdW1lbnQgLS0gZGlnZXN0IChvcGVuc291cmNlKQoKL0luZm8gNiAwIFIKL1Jvb3QgNSAwIFIKL1NpemUgOQo+PgpzdGFydHhyZWYKMjQ1NQolJUVPRgo=";

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        name: "Marco",
        company_name: "MarQ HR",
        total_resumes: 500,
        brand_color: "#1e3a8a",
        company_tagline: "Tecnologia para RH que transforma a gestão de pessoas",
        company_about: "A MarQ HR é uma empresa de tecnologia focada em soluções inovadoras para Recursos Humanos. Nossa missão é simplificar e otimizar processos de gestão de pessoas, desde o recrutamento até o desenvolvimento de talentos. Com mais de 5 anos no mercado, atendemos empresas de todos os portes em todo o Brasil.",
        company_mission: "Transformar a gestão de pessoas através da tecnologia, tornando o RH mais estratégico e humano.",
        company_vision: "Ser a principal plataforma de tecnologia para RH na América Latina até 2028.",
        company_values: "Inovação, Transparência, Colaboração, Foco no Cliente, Diversidade e Inclusão",
        company_culture: "Na MarQ HR, acreditamos que um ambiente de trabalho saudável é a base para grandes resultados. Valorizamos a autonomia, o aprendizado contínuo e a colaboração entre equipes. Nossos times trabalham de forma híbrida, com flexibilidade e foco em entregas de valor.",
        company_benefits: JSON.stringify([
          "Vale Refeição/Alimentação flexível",
          "Plano de Saúde e Odontológico",
          "Gympass/Wellhub",
          "Day off no aniversário",
          "Horário flexível",
          "Home office 3x por semana",
          "Auxílio educação",
          "PLR semestral"
        ]),
        company_website: "https://marqhr.com",
        company_linkedin: "https://linkedin.com/company/marqhr",
        company_instagram: "https://instagram.com/marqhr",
        careers_page_enabled: true,
        careers_page_slug: "marq-hr",
        careers_hero_image_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200",
        careers_cta_text: "Venha construir o futuro do RH com a gente!",
        careers_show_about: true,
        careers_show_benefits: true,
        careers_show_culture: true,
        careers_show_social: true,
        careers_show_hero_text: true,
        careers_show_mission: true,
        careers_show_vision: true,
        careers_show_values: true,
        company_logo_url: "https://marqhr.com/wp-content/uploads/2023/01/logo-marq-blue.png",
        phone: "(11) 99999-0001",
        cargo: "CEO",
        employee_count: "51-200",
      })
      .eq("user_id", DEMO_USER_ID);

    if (profileError) throw new Error(`Profile: ${profileError.message}`);

    // 2. Add full_access role (upsert)
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({ user_id: DEMO_USER_ID, role: "full_access" }, { onConflict: "user_id,role" });
    if (roleError) throw new Error(`Role: ${roleError.message}`);

    // 3. Create form templates
    const standardFields = [
      { id: crypto.randomUUID(), label: "Nome completo", type: "text", required: true, order: 0, predefined: true },
      { id: crypto.randomUUID(), label: "Email", type: "email", required: true, order: 1, predefined: true },
      { id: crypto.randomUUID(), label: "Telefone", type: "phone", required: false, order: 2, predefined: true },
      { id: crypto.randomUUID(), label: "Cidade/Estado", type: "text", required: false, order: 3, predefined: true },
      { id: crypto.randomUUID(), label: "Por que quer trabalhar conosco?", type: "textarea", required: false, order: 4, predefined: true },
    ];
    const technicalFields = [
      ...standardFields.slice(0, 3).map((f, i) => ({ ...f, id: crypto.randomUUID(), order: i })),
      { id: crypto.randomUUID(), label: "LinkedIn", type: "text", required: false, placeholder: "linkedin.com/in/...", order: 3, predefined: true },
      { id: crypto.randomUUID(), label: "Pretensao salarial", type: "currency", required: false, order: 4, predefined: true },
      { id: crypto.randomUUID(), label: "Anos de experiencia", type: "number", required: false, order: 5, predefined: true },
      { id: crypto.randomUUID(), label: "Disponibilidade para inicio", type: "select", required: false, options: ["Imediata", "15 dias", "30 dias", "60+ dias"], order: 6, predefined: true },
    ];
    const executiveFields = [
      ...technicalFields.map((f, i) => ({ ...f, id: crypto.randomUUID(), order: i })),
      { id: crypto.randomUUID(), label: "Experiencia em lideranca", type: "textarea", required: true, order: 7 },
      { id: crypto.randomUUID(), label: "Idiomas", type: "text", required: true, placeholder: "Ex: Ingles fluente, Espanhol intermediario", order: 8 },
    ];

    const { data: templates, error: templatesError } = await supabase
      .from("form_templates")
      .insert([
        { user_id: DEMO_USER_ID, name: "Formulario Padrao", description: "Formulario basico para vagas gerais", fields: standardFields, is_default: true },
        { user_id: DEMO_USER_ID, name: "Formulario Tecnico", description: "Para vagas de tecnologia e areas especializadas", fields: technicalFields, is_default: false },
        { user_id: DEMO_USER_ID, name: "Formulario Executivo", description: "Para posicoes de lideranca e gestao", fields: executiveFields, is_default: false },
      ])
      .select();

    if (templatesError) throw new Error(`Templates: ${templatesError.message}`);
    const [tPadrao, tTecnico, tExecutivo] = templates!;

    // 4. Create job postings
    const jobs = [
      { title: "Desenvolvedor Full Stack Senior", description: "Buscamos um desenvolvedor full stack senior para liderar projetos estrategicos de produto. Voce ira trabalhar com React, Node.js e PostgreSQL em um ambiente agil e colaborativo.", requirements: "- 5+ anos de experiencia com desenvolvimento web\n- Dominio de React/TypeScript e Node.js\n- Experiencia com bancos de dados relacionais\n- Ingles intermediario ou avancado\n- Experiencia com CI/CD e metodologias ageis", location: "Sao Paulo, SP", salary_range: "R$ 15.000 - R$ 22.000", work_type: "remote", form_template_id: tTecnico.id, status: "active", public_slug: "dev-fullstack-sr-marq" },
      { title: "Analista de RH Pleno", description: "Procuramos um analista de RH para atuar com recrutamento e selecao, gestao de beneficios e desenvolvimento organizacional. Oportunidade de crescimento em uma empresa de tecnologia.", requirements: "- Graduacao em Psicologia, Administracao ou areas afins\n- 3+ anos de experiencia em RH generalista\n- Conhecimento em ferramentas de ATS\n- Boa comunicacao e organizacao", location: "Sao Paulo, SP", salary_range: "R$ 5.000 - R$ 7.500", work_type: "hybrid", form_template_id: tPadrao.id, status: "active", public_slug: "analista-rh-marq" },
      { title: "Designer UX/UI Senior", description: "Estamos em busca de um designer UX/UI senior para criar experiencias incriveis em nossos produtos digitais. Voce ira liderar o design de interfaces e contribuir para a estrategia de produto.", requirements: "- 5+ anos de experiencia com UX/UI Design\n- Dominio do Figma\n- Portfolio com cases de produtos digitais\n- Conhecimento em Design System\n- Experiencia com pesquisa com usuarios", location: "Campinas, SP", salary_range: "R$ 12.000 - R$ 18.000", work_type: "onsite", form_template_id: tTecnico.id, status: "active", public_slug: "designer-ux-ui-marq" },
      { title: "Product Manager", description: "Oportunidade para PM experiente liderar o roadmap de um dos nossos principais produtos. Buscamos alguem data-driven, com visao estrategica e habilidade de comunicacao.", requirements: "- 4+ anos como Product Manager\n- Experiencia com produtos B2B SaaS\n- Conhecimento em metricas de produto\n- Ingles fluente\n- MBA ou pos-graduacao (desejavel)", location: "Remoto", salary_range: "R$ 18.000 - R$ 25.000", work_type: "remote", form_template_id: tExecutivo.id, status: "draft", public_slug: "pm-marq" },
      { title: "Estagiario de Marketing Digital", description: "Vaga de estagio para estudantes de Marketing, Comunicacao ou Publicidade. Voce ira apoiar campanhas de marketing digital, gestao de redes sociais e producao de conteudo.", requirements: "- Cursando Marketing, Publicidade ou Comunicacao\n- Conhecimento basico em redes sociais\n- Boa escrita e criatividade\n- Disponibilidade de 6h/dia", location: "Sao Paulo, SP", salary_range: "R$ 1.800 - R$ 2.200", work_type: "onsite", form_template_id: tPadrao.id, status: "closed", public_slug: "estagio-mkt-marq", closed_at: new Date().toISOString() },
      { title: "Tech Lead Backend", description: "Buscamos um Tech Lead para liderar a equipe de backend, definir arquitetura e garantir qualidade e escalabilidade dos servicos. Posicao estrategica com report direto ao CTO.", requirements: "- 7+ anos de experiencia em desenvolvimento backend\n- Experiencia com Node.js, Python ou Go\n- Lideranca tecnica de times\n- Conhecimento em arquitetura de microsservicos\n- Experiencia com cloud (AWS/GCP)", location: "Sao Paulo, SP", salary_range: "R$ 20.000 - R$ 30.000", work_type: "hybrid", form_template_id: tExecutivo.id, status: "paused", public_slug: "tech-lead-backend-marq" },
    ];

    const { data: jobPostings, error: jobsError } = await supabase
      .from("job_postings")
      .insert(jobs.map(j => ({
        ...j,
        user_id: DEMO_USER_ID,
        company_name: "MarQ HR",
        company_logo_url: "https://marqhr.com/wp-content/uploads/2023/01/logo-marq-blue.png",
        brand_color: "#1e3a8a",
      })))
      .select();

    if (jobsError) throw new Error(`Jobs: ${jobsError.message}`);

    // 5. Upload resume PDF to storage (once per candidate)
    const pdfBytes = base64ToUint8Array(RESUME_BASE64);

    const candidates = [
      { name: "Ana Clara Oliveira", email: "ana.oliveira@email.com", phone: "(11) 98765-0001", city: "Sao Paulo, SP" },
      { name: "Bruno Costa Santos", email: "bruno.santos@email.com", phone: "(11) 98765-0002", city: "Campinas, SP" },
      { name: "Camila Rodrigues", email: "camila.rodrigues@email.com", phone: "(21) 98765-0003", city: "Rio de Janeiro, RJ" },
      { name: "Daniel Ferreira Lima", email: "daniel.lima@email.com", phone: "(31) 98765-0004", city: "Belo Horizonte, MG" },
      { name: "Elena Souza Martins", email: "elena.martins@email.com", phone: "(41) 98765-0005", city: "Curitiba, PR" },
      { name: "Felipe Almeida", email: "felipe.almeida@email.com", phone: "(51) 98765-0006", city: "Porto Alegre, RS" },
      { name: "Gabriela Nascimento", email: "gabriela.nasc@email.com", phone: "(11) 98765-0007", city: "Sao Paulo, SP" },
      { name: "Henrique Barros", email: "henrique.barros@email.com", phone: "(61) 98765-0008", city: "Brasilia, DF" },
      { name: "Isabela Moreira", email: "isabela.moreira@email.com", phone: "(71) 98765-0009", city: "Salvador, BA" },
      { name: "Joao Pedro Cardoso", email: "joao.cardoso@email.com", phone: "(11) 98765-0010", city: "Guarulhos, SP" },
      { name: "Karla Mendes", email: "karla.mendes@email.com", phone: "(85) 98765-0011", city: "Fortaleza, CE" },
      { name: "Lucas Teixeira", email: "lucas.teixeira@email.com", phone: "(11) 98765-0012", city: "Santos, SP" },
      { name: "Mariana Campos", email: "mariana.campos@email.com", phone: "(48) 98765-0013", city: "Florianopolis, SC" },
      { name: "Nicolas Araujo", email: "nicolas.araujo@email.com", phone: "(62) 98765-0014", city: "Goiania, GO" },
      { name: "Patricia Vieira", email: "patricia.vieira@email.com", phone: "(81) 98765-0015", city: "Recife, PE" },
      { name: "Rafael Gomes", email: "rafael.gomes@email.com", phone: "(11) 98765-0016", city: "Sao Paulo, SP" },
      { name: "Sofia Duarte", email: "sofia.duarte@email.com", phone: "(27) 98765-0017", city: "Vitoria, ES" },
      { name: "Thiago Ribeiro", email: "thiago.ribeiro@email.com", phone: "(11) 98765-0018", city: "Osasco, SP" },
      { name: "Vanessa Castro", email: "vanessa.castro@email.com", phone: "(92) 98765-0019", city: "Manaus, AM" },
      { name: "William Pinto", email: "william.pinto@email.com", phone: "(11) 98765-0020", city: "Sao Bernardo, SP" },
      { name: "Yasmin Freitas", email: "yasmin.freitas@email.com", phone: "(91) 98765-0021", city: "Belem, PA" },
      { name: "Andre Machado", email: "andre.machado@email.com", phone: "(11) 98765-0022", city: "Barueri, SP" },
      { name: "Beatriz Lopes", email: "beatriz.lopes@email.com", phone: "(19) 98765-0023", city: "Piracicaba, SP" },
      { name: "Caio Monteiro", email: "caio.monteiro@email.com", phone: "(11) 98765-0024", city: "Sao Paulo, SP" },
      { name: "Diana Pereira", email: "diana.pereira@email.com", phone: "(47) 98765-0025", city: "Joinville, SC" },
      { name: "Eduardo Nunes", email: "eduardo.nunes@email.com", phone: "(11) 98765-0026", city: "Campinas, SP" },
      { name: "Fernanda Rocha", email: "fernanda.rocha@email.com", phone: "(31) 98765-0027", city: "Belo Horizonte, MG" },
      { name: "Gustavo Silva", email: "gustavo.silva@email.com", phone: "(11) 98765-0028", city: "Sao Paulo, SP" },
      { name: "Helena Santos", email: "helena.santos@email.com", phone: "(21) 98765-0029", city: "Niteroi, RJ" },
      { name: "Igor Carvalho", email: "igor.carvalho@email.com", phone: "(11) 98765-0030", city: "Sao Paulo, SP" },
    ];

    // Upload PDF for each candidate
    const resumePaths: Record<string, { path: string; filename: string }> = {};
    for (const c of candidates) {
      const uuid = crypto.randomUUID();
      const safeName = c.name.toLowerCase().replace(/\s+/g, "-");
      const path = `demo/${uuid}_${safeName}.pdf`;
      const filename = `curriculo_${safeName}.pdf`;
      
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });
      
      if (uploadError) {
        console.error(`Upload error for ${c.name}: ${uploadError.message}`);
      }
      
      resumePaths[c.email] = { path, filename };
    }

    // 6. Create applications distributed across jobs
    const triageStatuses = ["new", "new", "new", "low_fit", "deserves_analysis"];
    const appStatuses = ["pending", "pending", "pending", "reviewed", "shortlisted", "rejected"];
    const disponibilidades = ["Imediata", "15 dias", "30 dias", "60+ dias"];
    const salarios = ["R$ 5.000", "R$ 8.000", "R$ 12.000", "R$ 15.000", "R$ 20.000", "R$ 25.000"];

    // Distribute candidates: jobs[0]=8, jobs[1]=6, jobs[2]=5, jobs[3]=0(draft), jobs[4]=6(closed), jobs[5]=5(paused)
    const activeJobs = [jobPostings![0], jobPostings![1], jobPostings![2], jobPostings![4], jobPostings![5]];
    const distribution = [8, 6, 5, 6, 5];
    
    const applications: any[] = [];
    let candidateIdx = 0;

    for (let jobIdx = 0; jobIdx < activeJobs.length; jobIdx++) {
      const job = activeJobs[jobIdx];
      const count = distribution[jobIdx];
      
      for (let i = 0; i < count && candidateIdx < candidates.length; i++) {
        const c = candidates[candidateIdx];
        const resume = resumePaths[c.email];
        const triage = triageStatuses[candidateIdx % triageStatuses.length];
        const status = appStatuses[candidateIdx % appStatuses.length];
        
        // Build form_data based on job's template
        const formData: Record<string, string> = {
          "Nome completo": c.name,
          "Email": c.email,
          "Telefone": c.phone,
        };

        if (job.form_template_id === tTecnico.id || job.form_template_id === tExecutivo.id) {
          formData["LinkedIn"] = `linkedin.com/in/${c.name.toLowerCase().replace(/\s+/g, "")}`;
          formData["Pretensao salarial"] = salarios[candidateIdx % salarios.length];
          formData["Anos de experiencia"] = String(2 + (candidateIdx % 10));
          formData["Disponibilidade para inicio"] = disponibilidades[candidateIdx % disponibilidades.length];
        }
        if (job.form_template_id === tExecutivo.id) {
          formData["Experiencia em lideranca"] = "Lideranca de equipe de " + (3 + (candidateIdx % 8)) + " pessoas em projetos de tecnologia e produto.";
          formData["Idiomas"] = candidateIdx % 3 === 0 ? "Ingles fluente, Espanhol basico" : candidateIdx % 3 === 1 ? "Ingles avancado" : "Ingles intermediario, Frances basico";
        }
        if (job.form_template_id === tPadrao.id) {
          formData["Cidade/Estado"] = c.city;
          formData["Por que quer trabalhar conosco?"] = "Tenho grande interesse em atuar na area de " + job.title.split(" ")[0].toLowerCase() + " e acredito que a MarQ HR oferece um ambiente inovador e desafiador.";
        }

        applications.push({
          job_posting_id: job.id,
          applicant_name: c.name,
          applicant_email: c.email,
          form_data: formData,
          resume_url: resume?.path || null,
          resume_filename: resume?.filename || null,
          status: job.status === "closed" ? "rejected" : status,
          triage_status: triage,
        });

        candidateIdx++;
      }
    }

    const { error: appsError } = await supabase
      .from("job_applications")
      .insert(applications);

    if (appsError) throw new Error(`Applications: ${appsError.message}`);

    return new Response(
      JSON.stringify({
        success: true,
        created: {
          templates: templates!.length,
          jobs: jobPostings!.length,
          applications: applications.length,
          resumes_uploaded: Object.keys(resumePaths).length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
