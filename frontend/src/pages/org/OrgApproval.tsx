import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, FileText, User, Calendar, AlertCircle, Eye, Download } from "lucide-react";
import { useWeb3 } from "../../context/Web3Context";
import { useAuth } from "../../context/AuthContext";
import { backend } from "../../api/backend";
import { ethers } from "ethers";
import { isAuthorizedIssuer } from "../../services/contractService";

interface ApprovalRequest {
  id?: string;
  _id?: string;
  requester: string;
  organization: string;
  document_hash?: string;
  documentHash?: string;
  document_name?: string;
  documentName?: string;
  document_type?: string;
  documentType?: string;
  description?: string;
  file_url?: string;
  fileUrl?: string;
  status: "pending" | "approved" | "rejected";
  response_message?: string;
  responseMessage?: string;
  requested_at?: string;
  requestedAt?: string;
  responded_at?: string;
  respondedAt?: string;
  expiry_date?: number;
  expiryDate?: number;
  metadata?: any;
}

export const OrgApproval = () => {
  const { account, isActive, issueCredential } = useWeb3();
  const { user } = useAuth();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [error, setError] = useState("");
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const { getSigner } = useWeb3();

  const checkApproval = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/profile/${user?.username}`);
      if (response.ok) {
        const userData = await response.json();
        const approved = userData.is_approved || userData.isApproved || false;
        setIsApproved(approved);
      }
    } catch (err) {
      console.error("Failed to check approval status", err);
      setIsApproved(false);
    }
  };

  useEffect(() => {
    if (user?.username) {
      checkApproval();
    }

    const interval = setInterval(() => {
      if (user?.username) {
        checkApproval();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (account && isActive && isApproved === true) {
      loadRequests();
    }
  }, [account, isActive, filter, isApproved]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const status = filter === "all" ? undefined : filter;
      const data = await backend.getApprovalRequestsByOrganization(account!, status);
      setRequests(data);
    } catch (err) {
      console.error("Error loading approval requests:", err);
      setError("Failed to load approval requests");
    } finally {
      setLoading(false);
    }
  };

  const getRequestId = (req: ApprovalRequest) => req._id || req.id;
  const getDocumentName = (req: ApprovalRequest) => req.document_name || req.documentName || "Untitled";
  const getDocumentType = (req: ApprovalRequest) => req.document_type || req.documentType || "";
  const getDescription = (req: ApprovalRequest) => req.description || "";
  const getFileUrl = (req: ApprovalRequest) => req.file_url || req.fileUrl || "";
  const getRequestedAt = (req: ApprovalRequest) => req.requested_at || req.requestedAt || new Date().toISOString();
  const getExpiryDate = (req: ApprovalRequest) => req.expiry_date || req.expiryDate || 0;

  const handleApprove = async (request: ApprovalRequest) => {
    if (!account) return;

    if (isApproved === false) {
      setError("Your organization is pending admin approval. You cannot approve requests yet.");
      return;
    }

    const requestId = getRequestId(request);
    setProcessingId(requestId || null);
    setError("");

    try {
      const credentialData = JSON.stringify({
        holder: request.requester,
        issuer: account,
        documentHash: request.document_hash || request.documentHash,
        documentName: getDocumentName(request),
        timestamp: Date.now(),
      });
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes(credentialData));

      const expiryTimestamp = Math.floor((getExpiryDate(request) || 0) / 1000);
      await issueCredential(
        request.requester,
        credentialHash,
        expiryTimestamp,
        getDocumentName(request),
        getDescription(request)
      );

      const formData = new FormData();
      formData.append("hash", credentialHash);
      formData.append("issuer", account);
      formData.append("holder", request.requester);
      formData.append("credentialName", getDocumentName(request));
      formData.append("description", getDescription(request));
      formData.append("documentType", getDocumentType(request));
      formData.append("fromOrganisation", account);
      formData.append("expiryDate", String(getExpiryDate(request)));
      formData.append("metadata", JSON.stringify({
        verified: true,
        verifiedBy: account,
        verifiedAt: Date.now(),
        originalDocumentHash: request.document_hash || request.documentHash
      }));

      await backend.saveCredential(formData);

      await backend.updateApprovalRequest(requestId || "", {
        status: "approved",
        responseMessage: responseMessage || "Document approved and credential issued",
        issuedCredentialHash: credentialHash,
      });

      await loadRequests();
      setSelectedRequest(null);
      setResponseMessage("");
    } catch (err: unknown) {
      console.error("Error approving request:", err);
      setError(err instanceof Error ? err.message : "Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: ApprovalRequest) => {
    if (!responseMessage.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    const requestId = getRequestId(request);
    setProcessingId(requestId || null);
    setError("");

    try {
      await backend.updateApprovalRequest(requestId || "", {
        status: "rejected",
        responseMessage: responseMessage,
      });

      await loadRequests();
      setSelectedRequest(null);
      setResponseMessage("");
    } catch (err: unknown) {
      console.error("Error rejecting request:", err);
      setError(err instanceof Error ? err.message : "Failed to reject request");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (!isActive) {
    return (
      <div className="max-w-4xl">
        <div className="rounded-2xl border border-white/10 bg-[#0f0a18]/70 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-gray-300">Please connect your wallet to view approval requests</p>
        </div>
      </div>
    );
  }

  if (isApproved === false) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-6">Document Approval Requests</h1>
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-8 text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <h2 className="text-xl font-bold text-yellow-400 mb-2">Pending Admin Approval</h2>
          <p className="text-gray-300 mb-4">
            Your organization registration is awaiting approval from a system administrator.
            You will be able to approve user requests once your organization is approved.
          </p>
          <p className="text-sm text-gray-400">
            This typically takes 24-48 hours. You will be notified once approved.
          </p>
          <button
            onClick={checkApproval}
            className="mt-4 px-4 py-2 rounded-lg bg-[#5227FF] text-white text-sm font-semibold hover:bg-[#3DC2EC] transition-all"
          >
            Refresh Status
          </button>
        </div>
      </div>
    );
  }

  if (isApproved === null) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-6">Document Approval Requests</h1>
        <div className="text-center py-12 text-gray-400">Checking approval status...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Document Approval Requests</h1>

      <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${
          isApproved === true
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
            : "bg-yellow-500/10 border-yellow-500/30 text-yellow-200"
        }`}>
        <img src="/DHRUVALOGO.jpeg" alt="Dhruva Logo" className="w-5 h-5 shrink-0 mt-0.5 object-contain" />
        <div>
          <p className="font-semibold">
            {isApproved === true
              ? "✓ Organization Approved"
              : "⚠️ Pending Admin Approval"}
          </p>
          <p className="text-sm opacity-90 mt-1">
            {isApproved === true
              ? "Your organization is approved. You can now review and approve user document requests."
              : "Your organization is pending admin approval. You will be able to approve requests once approved."}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {["all", "pending", "approved", "rejected"].map((f, idx) => (
          <button
            key={`filter-${idx}`}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${filter === f
                ? "bg-[#5227FF] text-white border border-[#5227FF]/50"
                : "bg-white/5 text-gray-400 border border-white/10 hover:border-white/20"
              }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-[#0f0a18]/70 p-8 text-center">
          <p className="text-gray-400">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0f0a18]/70 p-8 text-center">
          <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No {filter !== "all" ? filter : ""} approval requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request, idx) => (
            <div
              key={`req-${idx}`}
              className="rounded-2xl border border-white/10 bg-[#0f0a18]/70 p-6 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-[#3DC2EC]" />
                    <h3 className="text-lg font-semibold text-white">{getDocumentName(request)}</h3>
                    {getStatusBadge(request.status)}
                  </div>
                  {getDocumentType(request) && (
                    <p className="text-sm text-gray-400 mb-2">Type: {getDocumentType(request)}</p>
                  )}
                  {getDescription(request) && (
                    <p className="text-sm text-gray-300 mb-3">{getDescription(request)}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <User className="w-4 h-4" />
                  <span className="font-mono text-xs">{request.requester.slice(0, 10)}...{request.requester.slice(-8)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(getRequestedAt(request)).toLocaleDateString()}</span>
                </div>
              </div>

              {getFileUrl(request) && (
                <div className="mb-4">
                  <a
                    href={getFileUrl(request)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Document
                  </a>
                </div>
              )}

              {request.status === "pending" && (
                <div className="pt-4 border-t border-white/10">
                  {selectedRequest?.id === getRequestId(request) || selectedRequest?._id === getRequestId(request) ? (
                    <div className="space-y-3">
                      <textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        placeholder="Add a message (optional for approval, required for rejection)"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#5227FF] focus:ring-1 focus:ring-[#5227FF]"
                        rows={2}
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(request)}
                          disabled={processingId === getRequestId(request)}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {processingId === getRequestId(request) ? "Approving..." : "Approve & Issue Credential"}
                        </button>
                        <button
                          onClick={() => handleReject(request)}
                          disabled={processingId === getRequestId(request)}
                          className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          {processingId === getRequestId(request) ? "Rejecting..." : "Reject"}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(null);
                            setResponseMessage("");
                            setError("");
                          }}
                          className="px-4 py-2.5 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="w-full py-2.5 rounded-xl bg-[#5227FF] text-white font-semibold hover:bg-[#3DC2EC] hover:text-[#0f0a18] transition-all border border-[#5227FF]/50"
                    >
                      Review Request
                    </button>
                  )}
                </div>
              )}

              {request.status !== "pending" && (request.response_message || request.responseMessage) && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400 mb-1">Response:</p>
                  <p className="text-sm text-gray-300">{request.response_message || request.responseMessage}</p>
                  {(request.responded_at || request.respondedAt) && (
                    <p className="text-xs text-gray-500 mt-2">
                      Responded on {new Date(request.responded_at || request.respondedAt || "").toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
