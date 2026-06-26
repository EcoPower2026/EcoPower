# EcoPower ⚡

**Monitoramento Inteligente de Energia**

EcoPower é um aplicativo mobile premium para monitoramento, análise e redução do consumo de energia elétrica. Com uma interface moderna inspirada em plataformas como Stripe, Linear e Tesla Energy, o app oferece ferramentas completas para gestão energética residencial.

## ✨ Funcionalidades

- **Dashboard em Tempo Real** — KPIs de consumo, custo, meta e eficiência
- **Gerenciamento de Aparelhos** — Cadastro e monitoramento individual de equipamentos
- **Metas de Economia** — Definição e acompanhamento de metas mensais
- **Alertas Inteligentes** — Notificações sobre consumo alto, metas próximas e economia
- **Gráficos e Histórico** — Visualização de consumo diário, semanal e mensal
- **Relatório PDF Premium** — Relatório profissional com gráficos SVG, tabelas e insights
- **Eco Impacto** — Gamificação leve com conquistas, níveis de eficiência, streak e impacto ambiental
- **Simulador de Consumo** — Simulação de economia com cenários comparativos
- **Previsão e Comparativo** — Projeções de consumo e comparação entre períodos
- **4 Temas Visuais** — Eco Nature Premium (padrão), EcoPower Dark, EcoPower Light e Eco Nature

## 📱 Plataformas

- iOS
- Android

## 🚀 Tecnologias

| Categoria | Tecnologia |
|---|---|
| Framework | React Native (Expo) |
| Linguagem | TypeScript |
| Navegação | React Navigation (Drawer + Stack) |
| Backend | Firebase (Auth + Firestore) |
| Gráficos | react-native-chart-kit |
| Fontes | Poppins (Google Fonts) |
| PDF | expo-print / expo-sharing |
| Ícones | Ionicons / MaterialCommunityIcons |
| Gradientes | expo-linear-gradient |

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/EcoPower.git

# Acesse a pasta
cd EcoPower

# Instale as dependências
npm install

# Inicie o projeto
npx expo start
```

## 🔧 Configuração

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative **Authentication** (email/senha) e **Firestore Database**
3. Copie as credenciais do Firebase para `firebase.ts`:

```ts
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "seu-sender-id",
  appId: "seu-app-id",
};
```

## 🎨 Temas

| Tema | Estilo |
|---|---|---|
| **Eco Nature Premium** (padrão) | Verde escuro premium com acabamentos elegantes |
| **EcoPower Dark** | Azul petróleo escuro |
| **EcoPower Light** | Cinza claro corporativo |
| **Eco Nature** | Verde sustentável claro |


## 📄 Licença

Distribuído sob licença MIT. Veja `LICENSE` para mais informações.
