import { useState, useEffect } from "react";
import { Download, QrCode, Copy, Check, AlertCircle } from "lucide-react";
import { useWeb3 } from "../../context/Web3Context";
import { backend } from "../../api/backend";
import QRCode from "qrcode";

export const UserDashboard = () => {
  const { account, isActive } = useWeb3();
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCredential, setSelectedCredential] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadCredentials = async () => {
      if (!isActive || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const creds = await backend.getCredentialsByHolder(account);
        console.log("Loaded credentials:", creds);
        setCredentials(creds || []);
      } catch (err) {
        console.error("Error loading credentials:", err);
        setError("Failed to load credentials");
      } finally {
        setLoading(false);
      }
    };

    loadCredentials();
  }, [account, isActive]);

  const generateQR = async (credential: any) => {
    try {
      const hash = credential.hash;
      const baseUrl = window.location.origin;
      const payload = JSON.stringify({
        type: "dhurva-vc",
        hash,
        verificationUrl: `${baseUrl}/verify?hash=${encodeURIComponent(hash)}`,
        timestamp: Date.now(),
      });
      const dataUrl = await QRCode.toDataURL(payload, { width: 300, margin: 2 });
      setQrDataUrl(dataUrl);
      setSelectedCredential(credential);
    } catch (err) {
      console.error("Error generating QR:", err);
    }
  };

  const copyHash = async () => {
    if (selectedCredential?.hash) {
      await navigator.clipboard.writeText(selectedCredential.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isActive) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl border border-white/10 bg-[#0f0a18]/70 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-gray-300">Please connect your wallet to view credentials</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white">Identity Vault</h1>
      <p className="text-gray-400">Manage your verified credentials</p>

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-[#5227FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading credentials…</p>
        </div>
      ) : credentials.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0f0a18]/70 p-12 text-center">
          <p className="text-gray-400 mb-4">No credentials issued yet</p>
          <p className="text-sm text-gray-500">Credentials issued to you will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {credentials.map((cred) => (
            <div
              key={cred.id || cred.hash}
              className="rounded-2xl border border-white/10 bg-[#0f0a18]/70 overflow-hidden hover:border-white/20 transition-all"
            >
              <div className="h-1 bg-[#5227FF]" />
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {cred.credential_name || "Credential"}
                  </h3>
                  {cred.description && (
                    <p className="text-sm text-gray-400 mt-1">{cred.description}</p>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-500">Issued</p>
                    <p className="text-white">
                      {new Date(cred.issued_at).toLocaleDateString()}
                    </p>
                  </div>
                  {cred.expiry_date && cred.expiry_date > 0 && (
                    <div>
                      <p className="text-gray-500">Expires</p>
                      <p className="text-white">
                        {new Date(cred.expiry_date * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/10 space-y-2">
                  {cred.file_url && (
                    <a
                      href={cred.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-white/5 border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      View Document
                    </a>
                  )}
                  <button
                    onClick={() => generateQR(cred)}
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-[#5227FF] border border-[#5227FF]/50 text-white text-sm font-medium hover:bg-[#3DC2EC] hover:text-[#0f0a18] transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    Generate QR
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCredential && qrDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/10 bg-[#0f0a18]/95 backdrop-blur-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              {selectedCredential.credential_name}
            </h3>

            <div className="flex justify-center">
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-64 h-64 rounded-xl border border-white/10"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Credential Hash
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={selectedCredential.hash}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/20 font-mono text-xs text-white"
                />
                <button
                  onClick={copyHash}
                  className="px-3 py-2 rounded-lg bg-[#5227FF] text-white flex items-center gap-1 text-sm font-medium hover:bg-[#3DC2EC] hover:text-[#0f0a18] border border-[#5227FF]/50"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Share this QR code or hash with verifiers to prove your credential
            </p>

            <button
              onClick={() => {
                setSelectedCredential(null);
                setQrDataUrl(null);
              }}
              className="w-full py-2.5 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
