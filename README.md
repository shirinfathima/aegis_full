# 🛡️ AegisID — AI-Driven Blockchain Identity Verification

AegisID is a **privacy-preserving digital identity verification platform** that combines **Artificial Intelligence, Blockchain, IPFS, and Zero-Knowledge Proofs (ZKP)** to verify digital credentials while minimizing exposure of sensitive information.

> **Academic Team Project** — B.Tech Computer Science & Engineering, SCMS School of Engineering and Technology

---

## ✨ Key Features

### 🤖 AI-Based Identity Verification

- **OCR Verification** — Extracts and validates information from identity documents.
- **Face Matching** — Compares the document photograph with the user's selfie.
- **Liveness Detection** — Uses camera-based verification to help detect presentation attacks.

### 🔐 Privacy-Preserving Verification

- **Zero-Knowledge Proofs** — Verifies credential claims without exposing underlying private information.
- **Selective Disclosure** — Users control which credential information is shared.
- Supports **ZKP, Redacted View, and Full Access** verification modes.

### ⛓️ Blockchain & Decentralized Storage

- Cryptographic document anchoring on blockchain.
- **IPFS/Pinata** for decentralized storage.
- Smart-contract integration for credential verification.
- Tamper detection using cryptographic document references.

### 👥 Role-Based Access

| Role | Function |
|---|---|
| **User** | Uploads documents, manages credentials, and controls access |
| **Issuer** | Reviews documents and approves/anchors credentials |
| **Verifier** | Requests and verifies digital credentials |

---

## 🏗️ Architecture

![AegisID Architecture](docs/architecture.jpg)

---

## 🔄 Verification Workflow

![AegisID Verification Workflow](docs/workflow.jpg)

---

## 🔏 Privacy & Selective Disclosure

AegisID provides three ways to share a digital credential:

| Mode | Description |
|---|---|
| **ZKP** | Proves a specific claim without revealing the underlying private data |
| **Redacted View** | Reveals only selected credential fields |
| **Full Access** | Provides authorized access to the complete credential |

The ZKP workflow uses **Circom, Poseidon hashing, snarkjs, and Groth16** for privacy-preserving credential verification.

---

## 🛠️ Technology Stack

### Frontend
- React.js
- Material UI
- JavaScript
- HTML / CSS

### Backend
- Java
- Spring Boot
- REST APIs
- Maven

### AI & Computer Vision
- Python
- Flask
- Tesseract OCR
- DeepFace
- OpenCV
- MediaPipe

### Database & Storage
- PostgreSQL
- IPFS
- Pinata

### Blockchain & Web3
- Solidity
- Smart Contracts
- Web3j
- Blockchain

### Zero-Knowledge Proofs
- Circom
- circomlib
- Poseidon
- snarkjs
- Groth16

### Development Tools
- Git
- GitHub
- Docker
- VS Code

---

## 📁 Project Structure

```text
AegisID/
│
├── frontend/                 # React frontend
│
├── backend/                  # Spring Boot backend
│
├── ai-microservices/
│   ├── OCR/                  # Document text extraction
│   ├── Face-Matching/        # Facial verification
│   └── Liveness-Detection/   # Liveness verification
│
├── zk-circuits/              # Zero-Knowledge Proof circuits
│
├── smart-contracts/          # Solidity smart contracts
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Java 21
- Maven
- Node.js & npm
- Python
- PostgreSQL
- Circom
- snarkjs

### Clone the Repository

```bash
git clone https://github.com/shirinfathima/aegis_full.git
cd aegis_full
```

### Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### AI Microservices

Each AI microservice has its own dependencies and can be started independently.

```bash
cd ai-microservices/OCR
python -m venv venv
pip install -r requirements.txt
python app.py
```

Repeat the setup for the Face Matching and Liveness Detection services.

> Configure the required PostgreSQL, IPFS, blockchain, and microservice connection settings before running the complete application.

---

## 👩‍💻 My Contribution

AegisID was developed collaboratively by a four-member team.

**Shirin Fathima** contributed to:

- React frontend development and user interface workflows.
- User, Issuer, and Verifier dashboard functionality.
- Credential verification and selective-disclosure workflows.
- Integration of the Zero-Knowledge Proof verification flow.
- Integration of frontend components with backend verification services.

> The repository represents the combined work of the entire project team.

---

## 👥 Team

- **Shirin Fathima**
- **Reshma Bijoe**
- **Sooriya Gayatri E.D**
- **Swetha Mol Mathai**

---

## 🎓 Academic Project

**AegisID: AI-Driven Blockchain Platform for Identity Verification and Fraud Prevention**

Developed as a B.Tech Computer Science & Engineering project at:

**SCMS School of Engineering and Technology**  
Kerala, India

---

## ⚠️ Disclaimer

AegisID is an **academic project** developed to demonstrate AI-based identity verification, blockchain, IPFS, and Zero-Knowledge Proof technologies.

It is not intended for production identity verification without further security auditing, testing, privacy assessment, and regulatory review.

---
