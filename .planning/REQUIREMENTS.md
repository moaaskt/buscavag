# Scoped Requirements: Buscavag v3.0

## User Stories & Functional Requirements

### 1. Coleta e Expansão de Fontes (Scraping)
- [ ] **SCRAP-01**: O sistema deve expandir a coleta para englobar plataformas e ATS focados no mercado regional de SC (ex: portais estaduais, agências locais).
- [ ] **SCRAP-02**: O sistema deve integrar-se com grandes ATSs nacionais e internacionais comumente usados no Brasil (Gupy, Kenoby, Sólides, Greenhouse, Lever, etc), totalizando mais de 15 fontes.
- [ ] **SCRAP-03**: A arquitetura do orchestrator deve suportar execução paralela e tratamento resiliente de falhas para esse alto volume de fontes simultâneas.

### 2. Validação e Filtro Temporal
- [ ] **FLT-01**: O sistema deve aplicar um filtro rígido de recência, rejeitando qualquer vaga que tenha sido publicada há mais de 5 dias corridos no momento da coleta.
- [ ] **FLT-02**: O mecanismo de extração de data deve ser unificado e preciso para as novas 15+ plataformas, garantindo que o filtro de 5 dias seja efetivo.

### 3. Expansão da IA (Hermes Agent & Matching)
- [ ] **IA-01**: O sistema de IA deve ser treinado/parametrizado para reconhecer e avaliar habilidades e requisitos em Internet das Coisas (IoT).
- [ ] **IA-02**: O sistema de IA deve avaliar competências em microcontroladores, com destaque explícito para ESP32 e arquiteturas similares.
- [ ] **IA-03**: O perfil de matching deve ser estendido para Automação Residencial (projetos, protocolos MQTT, integrações com Home Assistant, etc).
- [ ] **IA-04**: O dashboard de compatibilidade deve apresentar o score e feedback considerando as novas verticais de IoT e Automação Residencial.

## Traceability
*(To be populated by Roadmap)*

