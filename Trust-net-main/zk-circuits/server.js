const express = require("express");
const snarkjs = require("snarkjs");
const { buildPoseidon } = require("circomlibjs");

const app = express();
app.use(express.json());

/* =========================================
   1️⃣ Generate Commitment (Issuer Side)
========================================= */
app.post("/generate-commitment", async (req, res) => {
    try {
        const { studentDidNumeric, expiryYear, secret } = req.body;

        if (!studentDidNumeric || !expiryYear || !secret) {
            return res.status(400).send("Missing parameters");
        }

        const poseidon = await buildPoseidon();

        const hash = poseidon([
            BigInt(studentDidNumeric),
            BigInt(expiryYear),
            BigInt(secret)
        ]);

        const commitment = poseidon.F.toString(hash);

        res.json({ commitment });

    } catch (err) {
        console.error("❌ Commitment Error:", err);
        res.status(500).send("Commitment generation failed");
    }
});


/* =========================================
   2️⃣ Generate ZKP Proof (In-Memory)
========================================= */
app.post("/generate-proof", async (req, res) => {
    try {

        const {
            studentDidNumeric,
            expiryYear,
            universitySecret,
            universityCommitment,
            currentYear   // ✅ RECEIVE FROM JAVA
        } = req.body;

        // ✅ Validate ALL inputs
        if (
            !studentDidNumeric ||
            !expiryYear ||
            !universitySecret ||
            !universityCommitment ||
            !currentYear
        ) {
            return res.status(400).send("Missing proof parameters");
        }

        // ✅ Build deterministic circuit input
        const input = {
            current_year: currentYear.toString(),
            university_commitment: universityCommitment.toString(),
            student_did_numeric: studentDidNumeric.toString(),
            expiry_year: expiryYear.toString(),
            university_secret: universitySecret.toString()
        };

        console.log("🚀 Generating In-Memory Proof...");
        console.log("🔎 Circuit Input:", input);

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            "student_verification_js/student_verification.wasm",
            "student_final.zkey"
        );

        console.log("✅ Proof generated successfully (RAM)");

        res.json({ proof, publicSignals });

    } catch (err) {
        console.error("❌ ZKP Generation Error:", err);
        res.status(500).send("ZKP Generation Failed: " + err.message);
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 ZKP Service running on port ${PORT}`);
});