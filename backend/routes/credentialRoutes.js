import express from "express";
import { supabase } from "../config/db.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Store credential metadata
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { hash, issuer, holder, credentialName, description, documentType, fromOrganisation, expiryDate, metadata } = req.body;

    let parsedMetadata = {};
    if (metadata) {
      try {
        parsedMetadata = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
      } catch (e) {
        return res.status(400).json({ message: "Invalid metadata JSON format", error: e.message });
      }
    }

    if (!hash || !issuer || !holder || !credentialName) {
      return res.status(400).json({ message: "Missing required fields: hash, issuer, holder, credentialName" });
    }

    const { data: existing } = await supabase.from('credentials').select('*').eq('hash', hash).single();
    if (existing) {
      return res.status(409).json({ message: "Credential with this hash already exists" });
    }

    let fileUrl = "";
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    const { data: newCredential, error } = await supabase.from('credentials').insert({
      hash,
      issuer: String(issuer).toLowerCase(),
      holder: String(holder).toLowerCase(),
      credential_name: credentialName,
      description: description || "",
      document_type: documentType || "",
      from_organisation: fromOrganisation || "",
      file_url: fileUrl,
      expiry_date: expiryDate ? Number(expiryDate) : 0,
      metadata: parsedMetadata
    }).select().single();

    if (error) throw error;

    res.status(201).json({ success: true, credential: newCredential });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get credentials by holder
router.get("/holder/:address", async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const { data: credentials, error } = await supabase.from('credentials').select('*').eq('holder', address).order('issued_at', { ascending: false });
    if (error) throw error;
    res.json(credentials);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get credentials by issuer
router.get("/issuer/:address", async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const { data: credentials, error } = await supabase.from('credentials').select('*').eq('issuer', address).order('issued_at', { ascending: false });
    if (error) throw error;
    res.json(credentials);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get credential by hash
router.get("/hash/:hash", async (req, res) => {
  try {
    const { data: credential, error } = await supabase.from('credentials').select('*').eq('hash', req.params.hash).single();
    if (!credential) return res.status(404).json({ message: "Credential not found" });
    res.json(credential);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Verify credential
router.get("/verify/:hash", async (req, res) => {
  try {
    const { data: credential } = await supabase.from('credentials').select('*').eq('hash', req.params.hash).single();
    if (!credential) {
      return res.status(404).json({ valid: false, message: "Credential not found" });
    }
    res.json({
      valid: true,
      credential,
      verificationUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify?hash=${req.params.hash}`
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Batch verification
router.post("/batch-verify", async (req, res) => {
  try {
    const { hashes } = req.body;
    if (!Array.isArray(hashes) || hashes.length === 0) {
      return res.status(400).json({ message: "hashes must be a non-empty array" });
    }
    const { data: results, error } = await supabase.from('credentials').select('*').in('hash', hashes);
    if (error) throw error;

    const resultMap = {};
    results.forEach((c) => { resultMap[c.hash] = c; });
    const output = hashes.map((h) => ({
      hash: h,
      found: !!resultMap[h],
      credential: resultMap[h] || null
    }));
    res.json({ results: output });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
