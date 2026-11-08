# 🛡️ SolanaGuard — Think Before You Sign

**SolanaGuard is a read-only Solana wallet transaction security analyzer that helps users identify potential risk indicators in recent on-chain activity.**

## 🚀 Project Overview

SolanaGuard connects to Solana Mainnet and analyzes recent wallet transactions. It highlights potentially risky activity and presents the findings in a simple dashboard.

The goal is to help users make more informed decisions before interacting with blockchain transactions.

## ✨ Features

- Analyze public Solana wallet addresses.
- Fetch real transactions from Solana Mainnet.
- Detect failed transactions.
- Flag unknown program interactions for review.
- Identify unusually large SOL transfers (5 SOL or more).
- Classify transactions into LOW, REVIEW, and HIGH risk levels.
- Display transaction status, fees, program IDs, and SOL transfers.
- Read-only analysis — no wallet connection or transaction signing required.

## 🛠️ Technology Stack

- JavaScript
- Node.js
- Express.js
- HTML & CSS
- Solana Web3.js
- Helius RPC

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/ekramul-bd/SolanaGuard.git
cd SolanaGuard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
SOLANA_RPC_URL=YOUR_HELIUS_RPC_URL
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Keep your API keys private. Never commit your `.env` file.

### 4. Start the application

```bash
node server/index.js
```

### 5. Open the dashboard

Visit:

```text
http://localhost:3000
```

Enter a public Solana wallet address and click **Analyze Wallet**.

## 🔍 Risk Detection Logic

| Risk Level | Meaning |
|---|---|
| LOW | No configured risk indicators detected |
| REVIEW | Unknown program interaction or large SOL transfer detected |
| HIGH | Failed transaction detected |

These are preliminary heuristic indicators, not proof that a wallet or transaction is safe or malicious.

## 🔐 Security and Limitations

- SolanaGuard is a read-only prototype.
- It does not request private keys or seed phrases.
- It does not sign or submit transactions.
- Unknown programs are not automatically malicious.
- The current analyzer examines a limited number of recent transactions.
- Risk classifications are not a substitute for independent security verification.

## 🌍 Network

Solana Mainnet

## 👨‍💻 Built For

Global Solana Hackathon

**Project:** SolanaGuard  
**Tagline:** Think Before You Sign.

## 📜 License

This project is an experimental hackathon prototype. 
