const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();
app.use(express.json());

app.post("/generate-proof", async (req, res) => {
    try {
        const { birthYear } = req.body;

        if (!birthYear) {
            return res.status(400).send("birthYear is required");
        }

        const currentYear = new Date().getFullYear();

        const input = {
            birthYear: birthYear,
            currentYear: currentYear
        };

        // Write the input JSON for SnarkJS
        fs.writeFileSync("input.json", JSON.stringify(input));

        // Change this line to use final.zkey!
        const command = "npx snarkjs groth16 fullprove input.json age_check_js/age_check.wasm age_check_final.zkey proof.json public.json";

        console.log("Running command:", command);

        // Execute SnarkJS
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("❌ SnarkJS Error Details:\n", stderr || error.message);
                return res.status(500).send("Proof generation failed. Check Node console for details.");
            }

            try {
                // Read the generated proof files
                const proof = JSON.parse(fs.readFileSync("proof.json"));
                const publicSignals = JSON.parse(fs.readFileSync("public.json"));

                console.log("✅ Proof generated successfully!");

                // Send back to Spring Boot
                res.json({
                    proof,
                    publicSignals,
                    verified: true
                });
            } catch (fsError) {
                console.error("❌ Error reading generated proof files:", fsError);
                return res.status(500).send("Proof files were not generated.");
            }
        });

    } catch (err) {
        console.error("❌ Server Error:", err);
        res.status(500).send(err.message);
    }
});

app.listen(3001, () => {
    console.log("🚀 ZKP Service running on port 3001");
});