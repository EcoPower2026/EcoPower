# EcoPower ⚡

**Monitoramento Inteligente de Energia Elétrica**

EcoPower é um aplicativo mobile para monitoramento, análise e redução do consumo de energia elétrica. Oferece dashboard em tempo real, gerenciamento de aparelhos, metas de economia, alertas inteligentes, relatórios em PDF, simulação de consumo e gamificação.

## Funcionalidades

- **Dashboard** — indicadores de consumo, custo, meta e eficiência energética
- **Aparelhos** — cadastro e monitoramento individual de equipamentos
- **Metas** — definição e acompanhamento de metas de economia
- **Alertas** — notificações sobre consumo alto e metas próximas
- **Gráficos e Histórico** — consumo diário, semanal e mensal
- **Relatório PDF** — relatório profissional com gráficos e análises
- **Insights** — recomendações personalizadas com IA
- **Previsão** — projeção de consumo para o mês
- **Comparativo** — comparação entre períodos
- **Simulador** — simulação de consumo e economia
- **Eco Impacto** — gamificação com conquistas, streaks e impacto ambiental
- **4 Temas** — Eco Nature Premium, Dark, Light e Eco Nature

## Tecnologias

| Categoria | Tecnologia |
|---|---|
| Framework | React Native (Expo SDK 56) |
| Linguagem | TypeScript |
| Navegação | React Navigation (Drawer + Stack) |
| Backend | Firebase (Auth + Firestore) |
| Gráficos | react-native-chart-kit |
| Fontes | Poppins (Google Fonts) |
| PDF | expo-print / expo-sharing |
| Ícones | MaterialCommunityIcons |
| Armazenamento | AsyncStorage |

## Instalação

### 1. Pré-requisitos

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`) ou use `npx`
- Dispositivo físico com Expo Go ou emulador (Android/iOS)

### 2. Clone e instale

```bash
git clone https://github.com/mendesp7/EcoPower.git
cd EcoPower
npm install
```

### 3. Configure o Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative **Authentication** (método: email/senha) e **Firestore Database**
3. No arquivo `firebase.ts`, substitua os placeholders pelas credenciais do seu projeto:

```ts
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.firebasestorage.app",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "1:SEU_APP_ID"
};
```

> ⚠️ **Firebase Security Rules**: após configurar, vá no Firebase Console > Firestore > Regras e defina regras de segurança. Durante o desenvolvimento use o modo de teste, mas em produção restrinja o acesso baseado em autenticação para proteger seus dados.

### 4. Inicie

```bash
npx expo start
```

Escaneie o QR code com o Expo Go (Android/iOS) ou pressione `a` para Android emulador / `i` para iOS simulator.

### Modo Demonstração (sem Firebase)

Na tela de login, clique em **"Modo Demonstração"** para usar o app com dados simulados, sem precisar configurar o Firebase. Todas as funcionalidades ficam disponíveis imediatamente.

## Estrutura do Projeto

```
EcoPower/
├── Screens/          # Telas do aplicativo
│   ├── Home.tsx      # Dashboard
│   ├── Graphs.tsx    # Gráficos
│   ├── Appliances.tsx
│   ├── Goals.tsx
│   ├── Alerts.tsx
│   ├── History.tsx
│   ├── Reports.tsx
│   ├── Insights.tsx
│   ├── Forecast.tsx
│   ├── Comparison.tsx
│   ├── Simulator.tsx
│   ├── ImpactScreen.tsx
│   ├── Settings.tsx
│   ├── Plans.tsx
│   ├── About.tsx
│   ├── Support.tsx
│   ├── Login.tsx
│   ├── Cadastro.tsx
│   └── DemoMode.tsx
├── src/
│   ├── components/   # Componentes reutilizáveis
│   ├── contexts/     # Contextos (ThemeContext, DemoContext, etc.)
│   ├── services/     # Serviços (dataProvider, pdfReportService, etc.)
│   ├── theme/        # Sistema de temas e design system
│   └── types/        # Tipos TypeScript
├── firebase.ts       # Configuração do Firebase
└── App.tsx           # Entry point e navegação
```

## Temas

| Tema | Descrição |
|---|---|
| Eco Nature Premium (padrão) | Verde escuro premium |
| EcoPower Dark | Azul petróleo escuro |
| EcoPower Light | Cinza claro corporativo |
| Eco Nature | Verde sustentável claro |

## Scripts

| Comando | Descrição |
|---|---|
| `npm start` | Inicia o Expo dev server |
| `npm run android` | Inicia no Android |
| `npm run ios` | Inicia no iOS |
| `npx tsc --noEmit` | Verifica tipos TypeScript |

## Licença

MIT
