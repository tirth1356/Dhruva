import express from "express";
import { supabase } from "../config/db.js";

const router = express.Router();

// Get all organization approval requests
router.get("/org-requests", async (req, res) => {
  try {
    const { data: requests, error } = await supabase
      .from('org_approval_requests')
      .select(`
        *,
        users:organization_id (username, wallet_address)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const validRequests = requests.filter(req => {
      if (!req.users) return false;
      return true;
    });

    // Clean up invalid requests
    requests.forEach(async (req) => {
      if (!req.users) {
        try {
          await supabase.from('org_approval_requests').delete().eq('id', req.id);
        } catch (err) {
          console.error("Error cleaning up invalid request:", err);
        }
      }
    });

    res.json(validRequests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch organization requests" });
  }
});

// Approve organization
router.post("/org-requests/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername } = req.body;

    if (!adminUsername) {
      return res.status(400).json({ error: "Admin username is required" });
    }

    const { data: request } = await supabase.from('org_approval_requests').select('*').eq('id', id).single();
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.status !== "pending") return res.status(400).json({ error: "Request has already been reviewed" });

    await supabase.from('org_approval_requests').update({
      status: "approved",
      reviewed_by: adminUsername,
      reviewed_at: new Date().toISOString()
    }).eq('id', id);

    const { data: org } = await supabase.from('users').select('*').eq('id', request.organization_id).single();
    if (!org) return res.status(404).json({ error: "Organization user not found" });

    // Update org approval status in users table
    await supabase.from('users').update({
      is_approved: true,
      approved_by: adminUsername,
      approved_at: new Date().toISOString()
    }).eq('id', request.organization_id);

    res.json({ message: "Organization approved successfully", request });
  } catch (error) {
    res.status(500).json({ error: "Failed to approve organization" });
  }
});

// Reject organization
router.post("/org-requests/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername, reason } = req.body;

    if (!adminUsername) {
      return res.status(400).json({ error: "Admin username is required" });
    }

    const { data: request } = await supabase.from('org_approval_requests').select('*').eq('id', id).single();
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.status !== "pending") return res.status(400).json({ error: "Request has already been reviewed" });

    await supabase.from('org_approval_requests').update({
      status: "rejected",
      reviewed_by: adminUsername,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason || "No reason provided"
    }).eq('id', id);

    res.json({ message: "Organization rejected successfully", request });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject organization" });
  }
});

export default router;
