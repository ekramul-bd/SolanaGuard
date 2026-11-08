
const walletInput = document.getElementById("walletAddress");
const analyzeBtn = document.getElementById("analyzeBtn");
const message = document.getElementById("message");
const transactionList = document.getElementById("transactionList");

analyzeBtn.addEventListener("click", analyzeWallet);

async function analyzeWallet() {
    const wallet = walletInput.value.trim();

    if (!wallet) {
        message.textContent = "Please enter a Solana wallet address.";
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";
    message.textContent = "Fetching real Solana transactions...";
    transactionList.innerHTML = '<p class="empty">Loading transactions...</p>';

    try {
        const response = await fetch(
            `/api/analyze/${encodeURIComponent(wallet)}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Wallet analysis failed.");
        }

        displayResults(data);

        message.textContent =
            `Analysis completed. ${data.totalTransactions} transactions found.`;

    } catch (error) {
        message.textContent = error.message;
        transactionList.innerHTML =
            '<p class="empty">Could not analyze this wallet. Please try again.</p>';

        resetStats();

    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "Analyze Wallet";
    }
}

function displayResults(data) {
    const transactions = data.transactions || [];

    const high = transactions.filter(tx => tx.riskLevel === "HIGH").length;
    const review = transactions.filter(tx => tx.riskLevel === "REVIEW").length;
    const low = transactions.filter(tx => tx.riskLevel === "LOW").length;

    document.getElementById("totalTransactions").textContent =
        transactions.length;

    document.getElementById("highRisk").textContent = high;
    document.getElementById("reviewRisk").textContent = review;
    document.getElementById("lowRisk").textContent = low;

    if (transactions.length === 0) {
        transactionList.innerHTML =
            '<p class="empty">No recent transactions found.</p>';
        return;
    }

    transactionList.innerHTML = transactions.map(tx => {
        const date = tx.blockTime
            ? new Date(Number(tx.blockTime) * 1000).toLocaleString()
            : "Unknown date";

        const fee = (Number(tx.fee || 0) / 1_000_000_000).toFixed(6);

        const transfers = (tx.solTransfers || [])
            .map(t => `${Number(t.sol).toFixed(4)} SOL`)
            .join(", ") || "No SOL transfer detected";

        const risks = (tx.risks || [])
            .map(risk => `<p>⚠️ ${escapeHTML(risk.message)}</p>`)
            .join("");

        const signature = escapeHTML(tx.signature || "");

        return `
            <div class="transaction-card">
                <p><strong>Transaction:</strong> ${signature.slice(0, 20)}...</p>
                <p><strong>Date:</strong> ${escapeHTML(date)}</p>
                <p><strong>Status:</strong> ${escapeHTML(tx.status || "Unknown")}</p>
                <p><strong>Fee:</strong> ${fee} SOL</p>
                <p><strong>SOL Transfers:</strong> ${escapeHTML(transfers)}</p>
                <p><strong>Programs:</strong> ${(tx.programs || []).length}</p>
                <p><strong>Risk:</strong>
                    <span class="risk ${getRiskClass(tx.riskLevel)}">
                        ${escapeHTML(tx.riskLevel || "REVIEW")}
                    </span>
                </p>
                ${risks}
            </div>
        `;
    }).join("");
}

function getRiskClass(level) {
    return ["LOW", "REVIEW", "HIGH"].includes(level) ? level : "REVIEW";
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function resetStats() {
    document.getElementById("totalTransactions").textContent = "—";
    document.getElementById("highRisk").textContent = "—";
    document.getElementById("reviewRisk").textContent = "—";
    document.getElementById("lowRisk").textContent = "—";
}
