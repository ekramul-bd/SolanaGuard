
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const {
    Connection,
    clusterApiUrl,
    PublicKey
} = require("@solana/web3.js");

dotenv.config();

const app = express();

// Safely convert BigInt values into JSON strings
app.set("json replacer", (key, value) => {
    if (typeof value === "bigint") {
        return value.toString();
    }
    return value;
});

const PORT = process.env.PORT || 3000;

const RPC_URL = process.env.SOLANA_RPC_URL;

const connection = new Connection(
    RPC_URL || clusterApiUrl("mainnet-beta"),
    "confirmed"
);
// Known Solana program IDs
const KNOWN_PROGRAMS = new Set([
    "11111111111111111111111111111111",
    "ComputeBudget111111111111111111111111111111",
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
    "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
]);
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../public")));

// Backend health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "SolanaGuard backend is running!"
    });
});

// Solana network status
app.get("/api/solana-status", async (req, res) => {
    try {
        const version = await connection.getVersion();

        res.json({
            success: true,
            network: "Solana Mainnet",
            connected: true,
            solanaVersion: version["solana-core"]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Wallet transaction analyzer
app.get("/api/analyze/:wallet", async (req, res) => {
    try {
        const walletAddress = req.params.wallet;

        // Validate wallet address
        let publicKey;

        try {
            publicKey = new PublicKey(walletAddress);
        } catch {
            return res.status(400).json({
                success: false,
                error: "Invalid Solana wallet address"
            });
        }

        // Fetch latest 10 transactions
        const signatures = await connection.getSignaturesForAddress(
            publicKey,
            { limit: 10 }
        );

        // Fetch transaction details
        const transactions = await Promise.all(
            signatures.map(async (item) => {
                const tx = await connection.getParsedTransaction(
                    item.signature,
                    {
                        commitment: "confirmed",
                        maxSupportedTransactionVersion: 1
                    }
                );

                if (!tx) {
                    return null;
                }

                const programs = tx.transaction.message.instructions.map(
                    instruction => instruction.programId.toBase58()
                );
                // Extract SOL transfers from transaction
const solTransfers = tx.transaction.message.instructions
    .filter(instruction =>
        instruction.program === "system" &&
        instruction.parsed?.type === "transfer"
    )
    .map(instruction => ({
        source: instruction.parsed.info.source,
        destination: instruction.parsed.info.destination,
        lamports: Number(instruction.parsed.info.lamports),
        sol: Number(instruction.parsed.info.lamports) / 1_000_000_000
    }));
                const safeFee = Number(tx.meta?.fee || 0);

                return {
                    signature: item.signature,
                    blockTime: item.blockTime,
                    status: item.err ? "Failed" : "Success",
                    fee: safeFee,
                    programs: [...new Set(programs)],
                    solTransfers: solTransfers
                };
            })
        );
// Analyze transaction risks
const analyzedTransactions = transactions
    .filter(Boolean)
    .map((tx) => {

        const risks = [];

        // Rule 1: Failed transaction
        if (tx.status === "Failed") {
            risks.push({
                type: "FAILED_TRANSACTION",
                level: "HIGH",
                message: "This transaction failed."
            });
        }
// Rule 3: Large SOL transfer
const largeTransfers = (tx.solTransfers || []).filter(
    transfer => transfer.sol >= 5
);

if (largeTransfers.length > 0) {
    risks.push({
        type: "LARGE_SOL_TRANSFER",
        level: "REVIEW",
        message: "A large SOL transfer of 5 SOL or more was detected.",
        transfers: largeTransfers
    });
}
        // Rule 2: Unknown program
        const unknownPrograms = tx.programs.filter(
            program => !KNOWN_PROGRAMS.has(program)
        );

        if (unknownPrograms.length > 0) {
            risks.push({
                type: "UNKNOWN_PROGRAM",
                level: "REVIEW",
                message: "This transaction interacted with an unrecognized program.",
                programs: unknownPrograms
            });
        }

        return {
            ...tx,
            riskLevel: risks.some(risk => risk.level === "HIGH")
                ? "HIGH"
                : risks.length > 0
                    ? "REVIEW"
                    : "LOW",
            risks
        };
    });
        const validTransactions = analyzedTransactions.filter(Boolean);

        res.json({
            success: true,
            wallet: walletAddress,
            network: "Solana Mainnet",
            totalTransactions: validTransactions.length,
            transactions: validTransactions
        });

    } catch (error) {
    console.error("Wallet analysis error:", error);

    res.status(500).json({
        success: false,
        error: error.message
    });
}
});

// Gemini AI transaction explanation
app.post("/api/ai-explain", async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                error: "Gemini API key is not configured."
            });
        }

        const { riskLevel, status, risks, programs, solTransfers } =
            req.body || {};

        if (!["LOW", "REVIEW", "HIGH"].includes(riskLevel)) {
            return res.status(400).json({
                success: false,
                error: "Invalid risk level."
            });
        }

        const safeFindings = {
            riskLevel,
            status: String(status || "Unknown").slice(0, 30),
            risks: Array.isArray(risks)
                ? risks.slice(0, 10).map(r => ({
                    type: String(r.type || "").slice(0, 80),
                    level: String(r.level || "").slice(0, 20),
                    message: String(r.message || "").slice(0, 200)
                }))
                : [],
            programs: Array.isArray(programs)
                ? programs.slice(0, 10).map(p => String(p).slice(0, 100))
                : [],
            solTransfers: Array.isArray(solTransfers)
                ? solTransfers.slice(0, 10).map(t => ({
                    sol: Number(t.sol) || 0
                }))
                : []
        };

        const { GoogleGenAI } = await import("@google/genai");

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });

        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: `
You are SolanaGuard's transaction explanation assistant.

Explain these transaction findings in simple English.

Important rules:
- Do not change or invent the risk classification.
- Do not claim that a wallet is completely safe or malicious.
- Unknown programs are not automatically malicious.
- Explain what the findings mean and what the user should check.
- Keep the explanation under 120 words.

Transaction findings:
${JSON.stringify(safeFindings)}
            `
        });

        res.json({
            success: true,
            explanation: response.text ||
                "No explanation was generated."
        });

    } catch (error) {
        console.error("Gemini AI error:", error.message);

        res.status(500).json({
            success: false,
            error: "AI explanation unavailable. Check API key, model access, or quota."
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(
        `SolanaGuard server running at http://localhost:${PORT}`
    );
});
