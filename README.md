# App Diaconato (Frontend)

## Descrição

**App Diaconato** é uma solução móvel desenvolvida como Progressive Web App (PWA) para automatizar e simplificar o controle de frequência em eventos de formação do Diaconato, substituindo um sistema antigo que dependia de computadores, redes locais e servidores dedicados. O projeto foca no desenvolvimento do frontend utilizando React Native, com interfaces responsivas e intuitivas, permitindo o registro de presenças por leitura de QR Codes, operação offline e sincronização com um sistema central.

### Principais entregas do projeto:

- **Interface para leitura de QR Codes**: Uso da câmera do dispositivo para registrar presenças de forma rápida e confiável.
- **Painel administrativo**: Interface para gerenciamento de eventos, participantes e certificados.
- **Formulários dinâmicos**: Criação de formulários com validações para cadastro de participantes e eventos.
- **Gráficos interativos**: Visualização de indicadores de presença e participação em dashboards.
- **Geração de certificados**: Automatização da criação de certificados personalizados em PDF e DOCX.

---

## Tecnologias utilizadas

- **React Native**: Framework principal para o desenvolvimento do frontend da PWA.
- **React Router**: Gerenciamento de rotas protegidas com controle de acesso por níveis.
- **react-native-chart-kit**: Criação de gráficos interativos no painel administrativo.
- **react-native-qrcode-svg**: Geração de QR Codes únicos para identificação de participantes.
- **expo-print**: Geração de certificados personalizados em PDF.
- **docx**: Geração de certificados em formato DOCX.

---

## Funcionalidades do sistema (Frontend)

- **Controle de presença**: Interface para leitura de QR Codes nas credenciais dos participantes, permitindo registro rápido e offline.
- **Gestão de eventos**: Interface para administração de eventos, incluindo cadastro e monitoramento de participantes.
- **Geração de certificados**: Interface para criação automática e download de certificados personalizados em PDF e DOCX.
- **Dashboard interativo**: Visualização de métricas de participação em gráficos claros e acionáveis.
- **Autenticação de usuários**: Interface para login e administração com níveis de acesso (Super Admin, Admin e Usuário).
- **Operação offline**: Funcionalidade que permite registrar presenças sem conexão, com sincronização posterior.

---

## Contribuições

- **Desenvolvimento do frontend**: Implementação completa da PWA utilizando React Native, com foco em uma interface enxuta e intuitiva.
- **Componentes reutilizáveis**: Criação de componentes modulares para garantir consistência e escalabilidade.
- **Roteamento seguro**: Configuração de rotas protegidas com React Router, garantindo acesso restrito por níveis de permissão.
- **Integração com QR Codes**: Implementação da leitura e geração de QR Codes com a biblioteca react-native-qrcode-svg.
- **Gráficos e dashboards**: Desenvolvimento de dashboards interativos com react-native-chart-kit para visualização de indicadores.
- **Geração de certificados**: Automatização da criação de certificados em PDF e DOCX utilizando expo-print e docx.

---

## Desafios

- **Conversão para PWA**: Adaptação do aplicativo de React Native para uma Progressive Web App, atendendo à solicitação do cliente para acesso sem necessidade de download.
- **Cronograma acelerado**: Desenvolvimento em prazo reduzido, exigindo priorização de tarefas para entrega do MVP.
- **Equipe enxuta**: Colaboração em uma equipe de 3 desenvolvedores multidisciplinares, demandando alta eficiência e comunicação constante.

---

## Impactos

- **Eliminação de infraestrutura física**: Substituição de computadores, servidores locais e redes cabeadas por uma PWA acessível em smartphones.
- **Redução de custos**: Diminuição significativa dos custos operacionais e de manutenção de equipamentos.
- **Automatização de certificados**: Geração e distribuição automática de certificados, eliminando processos manuais.
- **Agilidade no controle de presença**: Registro de presenças via QR Code, funcionando offline e de forma descentralizada.
- **Simplificação operacional**: Remoção da dependência de técnicos especializados para configuração e suporte.
- **Escalabilidade**: Solução flexível para eventos em diferentes locais, com fácil adaptação a novos requisitos.

---

## Estrutura do projeto

```plaintext
app-diaconato/
├── assets/                  # Arquivos de recursos estáticos, como imagens e ícones utilizados na aplicação
├── dist/                    # Pasta de distribuição, contendo arquivos compilados para produção (ex.: build da PWA)
├── src/                     # Código-fonte principal do projeto
│   ├── screens/             # Telas específicas da aplicação, como login, dashboard e leitura de QR Codes
├── App.js                   # Componente principal que inicializa a aplicação React Native
├── README.md                # Documentação do projeto
├── app.js                   # Possível script de configuração ou ponto de entrada adicional
├── app.json                 # Configuração do aplicativo, incluindo metadados para React Native
da)
├── index.js                 # Ponto de entrada da aplicação, onde o React Native é renderizado
├── package-lock.json        # Arquivo de bloqueio de dependências gerado pelo npm
├── package.json             # Dependências do projeto, scripts de build e execução
└── webpack.config.js        # Configuração do Webpack, usada para build e otimização da PWA
```
