import express from "express";
import { supabase } from "../config/db.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Create approval request
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { requester, organization, documentHash, documentName, documentType, description, expiryDate, metadata } = req.body;

    if (!requester || !organization || !documentHash || !documentName) {
      return res.status(400).json({ message: "Missing required fields: requester, organization, documentHash, documentName" });
    }

    const { data: existing } = await supabase.from('approval_requests').select('*')
      .eq('document_hash', documentHash)
      .eq('requester', String(requester).toLowerCase())
      .eq('organization', String(organization).toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existing) {
      return res.status(409).json({ message: "Approval request already pending for this document" });
    }

    let fileUrl = "";
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    let parsedMetadata = {};
    if (metadata) {
      try {
        parsedMetadata = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
      } catch (e) {}
    }

    const { data: newRequest, error } = await supabase.from('approval_requests').insert({
      requester: String(requester).toLowerCase(),
      organization: String(organization).toLowerCase(),
      document_hash: documentHash,
      document_name: documentName,
      document_type: documentType || "",
      description: description || "",
      file_url: fileUrl,
      expiry_date: expiryDate ? Number(expiryDate) : null,
      metadata: parsedMetadata,
      status: "pending"
    }).select().single();

    if (error) throw error;

    res.status(201).json({ success: true, request: newRequest });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get approval requests by organization
router.get("/organization/:address", async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const status = req.query.status;

    let query = supabase.from('approval_requests').select('*').eq('organization', address);
    if (status) query = query.eq('status', status);

    const { data: requests, error } = await query.order('requested_at', { ascending: false });
    if (error) throw error;
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get approval requests by requester
router.get("/requester/:address", async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const { data: requests, error } = await supabase.from('approval_requests').select('*').eq('requester', address).order('requested_at', { ascending: false });
    if (error) throw error;
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Approve or reject request
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, responseMessage, issuedCredentialHash } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'" });
    }

    const { data: request } = await supabase.from('approval_requests').select('*').eq('id', id).single();
    if (!request) return res.status(404).json({ message: "Approval request not found" });
    if (request.status !== "pending") return res.status(400).json({ message: "Request already processed" });

    const updates = {
      status,
      response_message: responseMessage || "",
      responded_at: new Date().toISOString()
    };

    if (status === "approved" && issuedCredentialHash) {
      updates.issued_credential_hash = issuedCredentialHash;

      await supabase.from('credentials').update({
        metadata: {
          verified: true,
          verifiedBy: request.organization,
          verifiedAt: Date.now()
        }
      }).eq('hash', issuedCredentialHash);
    }

    const { data: updatedRequest, error } = await supabase.from('approval_requests').update(updates).eq('id', id).select().single();
    if (error) throw error;

    res.json({ success: true, request: updatedRequest });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single approval request
router.get("/:id", async (req, res) => {
  try {
    const { data: request, error } = await supabase.from('approval_requests').select('*').eq('id', req.params.id).single();
    if (!request) return res.status(404).json({ message: "Approval request not found" });
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete/cancel request
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { requester } = req.query;

    const { data: request } = await supabase.from('approval_requests').select('*').eq('id', id).single();
    if (!request) return res.status(404).json({ message: "Approval request not found" });
    if (request.status !== "pending") return res.status(400).json({ message: "Cannot cancel processed request" });
    if (requester && request.requester !== String(requester).toLowerCase()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await supabase.from('approval_requests').delete().eq('id', id);
    res.json({ success: true, message: "Request cancelled" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
