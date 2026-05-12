Won 30k INR at IIT Gandhinagar, National Level Hackathon @Codeversity
# 🚀 DHRUVA – Decentralized Credential Verification System

> A Blockchain-Based Decentralized Identity (DID) & Verifiable Credential (VC) Infrastructure
> Built for secure, tamper-proof, and privacy-preserving academic & workforce credential management.

---

## 🌐 Project Links

* 🎥 ** Demo Video**
  [https://drive.google.com/drive/u/3/folders/1qN1wug7DRHcejm59HDSUbh-GaxzBmIXk](https://drive.google.com/drive/u/3/folders/1qN1wug7DRHcejm59HDSUbh-GaxzBmIXk)

---

# 📌 Problem Statement

## 🏛 Background & Context

India’s education and workforce ecosystem generates **millions of credentials annually**, including:

* 🎓 Degrees
* 📜 Diplomas
* 🛠 Skill Certificates
* 🧾 Licenses
* 💼 Employment Letters

However, these credentials are often:

* Stored in **centralized & siloed systems**
* **Difficult and slow to verify**
* Prone to **forgery and manipulation**
* Hard to access for migrants and gig workers
* Controlled by institutions instead of individuals

Verification today is:

* Time-consuming
* Expensive
* Manual
* Vulnerable to fraud

---

## 🎯 Our Solution

**DHRUVA** is a blockchain-powered decentralized identity and credential verification platform that:

* Eliminates centralized control
* Enables self-sovereign identity
* Stores tamper-proof credential hashes on Ethereum
* Allows instant, privacy-preserving verification
* Prevents forgery and duplication
* Reduces verification time from days to seconds

---

# 🧠 Core Objectives

* ✅ Enable Self-Sovereign Identity (SSI)
* ✅ Prevent Credential Fraud
* ✅ Ensure Tamper-Proof Verification
* ✅ Reduce Manual Verification Costs
* ✅ Minimize On-Chain Storage Costs
* ✅ Support Revocation & Expiry
* ✅ Provide Interoperable & Scalable Design

---

# 🏗 System Architecture

```
User (Holder)  ←→  Blockchain (Sepolia)  ←→  Issuer
          ↓
      Verifier
```

### 🔐 On-Chain (Ethereum Sepolia)

* DID Registry
* Issuer Authorization
* Credential Hash Storage
* Revocation Status
* Expiry Validation

### 📦 Off-Chain

* Credential Documents (IPFS / Storage)
* Metadata Storage (MongoDB)

---

# 👥 Platform Roles

## 🏢 1. Organization (Issuer)

* Authorized by contract owner
* Issues credentials
* Revokes credentials
* Sets expiry timestamps

## 👤 2. User (Credential Holder)

* Registers DID
* Views issued credentials
* Shares credentials via QR code
* Maintains ownership of records

## 🔎 3. Verifier (Employer / Institution)

* Verifies credential authenticity
* Checks issuer validity
* Validates expiry & revocation status
* One-click verification

---

# ⚙️ Implemented Functionalities

## 🔹 1. Decentralized Identity (DID)

* Wallet-based authentication via MetaMask
* On-chain DID registry
* Role-based access control

## 🔹 2. Credential Issuance

* Issuer-authorized credential creation
* Hash stored on Ethereum (Sepolia)
* Document stored off-chain (IPFS / centralized)

## 🔹 3. User Credential Wallet

* View all issued credentials
* Secure QR-based sharing
* Non-custodial ownership

## 🔹 4. Credential Verification

* Verify via credential hash
* Instant blockchain validation
* Issuer authenticity verification

## 🔹 5. Revocation & Expiry

* Issuers can revoke credentials
* Expiry timestamps enforced
* Revocation without exposing personal data

---

# 🛠 Tech Stack

## 🎨 Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

## 🖥 Backend

* Node.js
* Express.js
* MongoDB
* Multer (File Upload Handling)

## ⛓ Blockchain

* Solidity
* Ethers.js
* Ethereum Sepolia Testnet

## 🔐 Authentication

* MetaMask Wallet

---

# 📜 Smart Contract

📂 `contracts/DIDRegistry.sol`

### Manages:

* Issuer Authorization
* Credential Issuance
* Credential Revocation
* Expiry Validation
* DID Registration

---

# 🚀 Installation & Setup Guide

## 📌 Prerequisites

* Node.js (v18+)
* MongoDB (Local or Atlas)
* MetaMask Wallet
* Sepolia Test ETH
* Git

---

## 1️⃣ Clone Repository

```bash
git clone https://github.com/Smith24298/Dhruva_1.git
cd Dhruva_1
```

---

## 2️⃣ Install Dependencies

### Frontend

```bash
cd client
npm install
```

### Backend

```bash
cd server
npm install
```

---

## 3️⃣ Configure Environment Variables

Create `.env` file in `/server`:

```
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

Create `.env` file in `/client`:

```
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
VITE_SEPOLIA_RPC=your_rpc_url
```

---

## 4️⃣ Deploy Smart Contract (Remix)

1. Open [https://remix.ethereum.org](https://remix.ethereum.org)
2. Create new file: `DIDRegistry.sol`
3. Paste contract code
4. Compile with Solidity ^0.8.x
5. Connect MetaMask to Sepolia
6. Select “Injected Provider - MetaMask”
7. Deploy contract
8. Copy deployed contract address
9. Paste into frontend `.env`

---

## 5️⃣ Run Backend

```bash
cd server
npm run dev
```

---

## 6️⃣ Run Frontend

```bash
cd client
npm run dev
```

Application runs at:

```
http://localhost:5173
```

---

# 🧪 Demo Flow

1. Contract Owner authorizes Issuer
2. User registers DID
3. Issuer issues credential
4. Credential stored on-chain (hash)
5. User generates QR
6. Verifier scans QR
7. Blockchain verifies validity
8. Issuer revokes → Verifier sees revoked status

---

# 🔒 Security Considerations

* Hash-based credential storage (no personal data on-chain)
* Role-based access control
* Expiry validation
* Revocation tracking
* Immutable verification history

---

# 📈 Future Improvements

* Zero-Knowledge Proof (ZKP) selective disclosure
* Multi-chain deployment
* Government trust registry
* Batch credential verification
* DAO-based issuer governance

---

# 🌟 Why DHRUVA?

✔ Eliminates credential fraud
✔ Reduces verification time
✔ Empowers individuals with ownership
✔ Blockchain-backed trust
✔ Scalable & privacy-first design

---

# 👨‍💻 Team

Developed for blockchain innovation & decentralized identity solutions.


