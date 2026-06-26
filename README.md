# Alpha Vision

Alpha Vision est une application full-stack de suivi de marche et de paper trading pour un projet PFA. Elle combine une interface React/Vite, une API Node.js/Express, MongoDB, des donnees de marche externes, Stripe, un chatbot IA, des signaux indicatifs, un moteur de backtesting et un bot de paper trading.

## Stack technique

- Frontend: React, Vite, React Router, Axios, Tailwind CSS, Framer Motion, Recharts, Lightweight Charts.
- Backend: Node.js, Express, MongoDB/Mongoose, JWT via cookie httpOnly, Passport Google OAuth.
- Services externes: Binance, Yahoo Finance, GNews, Groq, Stripe, SMTP/Nodemailer.
- Mode trading: paper trading uniquement. Aucun ordre broker reel n'est envoye.

## Fonctionnalites principales

- Authentification email/password et Google OAuth optionnel.
- Dashboard avec portfolio, marche, historique et signal IA.
- Prix de marche, graphiques OHLC et indicateurs techniques.
- Ordres BUY/SELL en paper trading avec historique.
- Portfolio, watchlist et snapshots de performance.
- Risk Score Portfolio educatif base sur concentration, exposition, diversification et qualite des prix.
- Backtesting sur donnees historiques Binance pour les symboles crypto supportes.
- Export CSV des resultats de backtest simple et comparaison de strategies.
- Bot de trading paper avec strategies techniques et execution paper optionnelle.
- Paiements Stripe pour abonnements et depots vers solde virtuel.
- Fonds demo optionnels pour developpement.
- Chatbot IA avec contexte utilisateur et fallback sans LLM.
- News financieres via GNews avec fallback explicite.

## Installation

Prerequis:

- Node.js 18+ recommande.
- MongoDB local ou MongoDB Atlas.
- Une configuration `.env` backend basee sur `backend/.env.example`.
- Une configuration `.env` frontend basee sur `frontend/.env.example`.

Installer le frontend:

```bash
cd frontend
npm install
```

Installer le backend:

```bash
cd backend
npm install
```

## Variables d'environnement

Backend minimum:

- `PORT`
- `NODE_ENV`
- `FRONTEND_URL`
- `MONGO_URI`
- `JWT_SECRET`

Backend optionnel selon les modules:

- `GROQ_API_KEY` pour chatbot et signaux IA LLM.
- `GNEWS_API_KEY` pour les news.
- `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` pour Stripe.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` pour OAuth.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` pour reset password.
- `ALLOW_DEMO_FUNDING=true` seulement en developpement.

Frontend:

- `VITE_API_URL`, par exemple `http://localhost:5000/api`.
- `VITE_ALLOW_DEMO_FUNDING` si l'UI doit afficher les actions demo en local.

## Scripts npm

Frontend:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

Backend:

```bash
npm run check:env
npm run seed:demo
npm run dev
npm start
```

## Preparer les donnees de demonstration

Le backend fournit un seed local pour preparer un compte de soutenance avec solde virtuel, portfolio, watchlist, trades paper, activites recentes et bot paper arrete.

```bash
cd backend
npm run seed:demo
```

Compte demo:

- Email: `demo@alphavision.local`
- Password: `Demo123456!`
- Plan: `elite`

Ce seed est reserve au developpement/local. Il refuse de s'executer avec `NODE_ENV=production`, n'ajoute aucune cle secrete, ne contacte pas Stripe et ne lance pas le scheduler du bot.

## Lancement local

Terminal backend:

```bash
cd backend
npm run dev
```

Terminal frontend:

```bash
cd frontend
npm run dev
```

Par defaut, le frontend tourne sur `http://localhost:5173` et l'API sur `http://localhost:5000/api`.

## Precision importante

Alpha Vision n'est pas une plateforme de trading reel. Les ordres, le bot et le solde de trading sont virtuels. Les depots Stripe et les fonds demo alimentent le solde interne de paper trading. Les signaux IA, le Risk Score Portfolio et les exports de backtest sont indicatifs, educatifs et ne constituent pas des conseils financiers.

## Limites connues

- Pas d'integration broker reelle.
- Pas de CSRF middleware dedie pour les routes cookie-auth en production.
- Backtesting limite aux symboles supportes par le backend via Binance historical klines.
- Export backtest disponible en CSV. L'export PDF n'est pas active pour eviter d'ajouter une dependance de rendu tant qu'elle n'est pas necessaire.
- News dependantes de `GNEWS_API_KEY`.
- IA dependante de `GROQ_API_KEY`, avec fallback regle si absent.
- Les fonctions avancees de securite dans Settings restent partielles: 2FA, sessions actives, suppression de compte.
- Peu ou pas de tests automatises pour l'instant.
