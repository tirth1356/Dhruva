import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ScanLine, CheckCircle, XCircle, AlertCircle, Shield, Clock, Award, Activity } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { backend } from "../api/backend";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { GlassCard } from "../components/GlassCard";
import { GradientText } from "../components/GradientText";
import { Navbar } from "../components/Navbar";
import { motion } from "framer-motion";

export const VerifyPublic = () => {
  const [searchParams] = useSearchParams();
  const hashFromUrl = searchParams.get("hash") || "";
  const { verifyCredential, isActive } = useWeb3();
  const [input, setInput] = useState(hashFromUrl);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{
    exists: boolean;
    revoked: boolean;
    expired: boolean;
    issuer?: string;
    holder?: string;
    name?: string;
    experience?: string;
  } | null>(null);
  const [offChain, setOffChain] = useState<unknown>(null);
  const [error, setError] = useState("");

  const doVerify = useCallback(async (hash: string) => {
    setVerifying(true);
    setResult(null);
    setOffChain(null);
    setError("");
    try {
      const chain = await verifyCredential(hash);
      setResult({
        exists: chain.exists,
        revoked: chain.revoked,
        expired: chain.expired,
        issuer: chain.issuer,
        holder: chain.holder,
        name: chain.name,
        experience: chain.experience,
      });
      try {
        const c = await backend.getCredentialByHash(hash);
        setOffChain(c);
      } catch {
        setOffChain(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  }, [verifyCredential]);

  useEffect(() => {
    setInput(hashFromUrl);
    if (hashFromUrl) {
      doVerify(hashFromUrl);
    }
  }, [hashFromUrl, doVerify]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    let h = input.trim();
    if (h.includes("hash=")) {
      try {
        const url = new URL(h.startsWith("http") ? h : `http://x.com/${h}`);
        const extracted = url.searchParams.get("hash");
        if (extracted) h = extracted;
      } catch { }
    }
    const hashRegex = /0x[a-fA-F0-9]{64}/;
    const match = h.match(hashRegex);
    if (match) h = match[0];
    if (h) doVerify(h);
  };

  const valid = result?.exists && !result?.revoked && !result?.expired;

  const trustScore = result?.exists ? (result.revoked ? 0 : result.expired ? 40 : 95) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0a18]">
      <div className="fixed inset-0 z-0">
        <AnimatedBackground />
      </div>
      <Navbar />
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 pt-24">
        <div className="w-full max-w-2xl space-y-6">
          {/* Search Card */}
          <GlassCard>
            <div className="text-center mb-6">
              <div className="inline-flex rounded-xl bg-[#5227FF]/20 p-4 border border-[#5227FF]/40 mb-4">
                <ScanLine className="w-10 h-10 text-[#3DC2EC]" />
              </div>
              <h1 className="text-2xl font-bold text-white">Verify Credential</h1>
              <p className="text-gray-400 text-sm mt-1">Scan QR or paste hash. No login required.</p>
            </div>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste credential hash or unique ID"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 font-mono text-sm mb-4 focus:outline-none focus:border-[#5227FF] focus:ring-1 focus:ring-[#5227FF]"
              />
              <button
                type="submit"
                disabled={verifying}
                className="w-full py-3.5 rounded-xl bg-[#5227FF] text-white font-semibold hover:bg-[#3DC2EC] hover:text-[#0f0a18] disabled:opacity-50 transition-all border border-[#5227FF]/50"
              >
                {verifying ? "Verifying…" : "Verify"}
              </button>
            </form>

            {!isActive && (
              <div className="mt-4">
                <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl">
                  Connect wallet for on-chain verification. Basic checks may work without.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </GlassCard>

          {/* Result Card */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Trust Score */}
              <GlassCard>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-[#5227FF]" />
                    <span className="text-sm text-gray-400">Trust Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-3xl font-black ${
                      trustScore >= 80 ? "text-emerald-400" :
                      trustScore >= 50 ? "text-yellow-400" : "text-red-400"
                    }`}>
                      {trustScore}
                    </span>
                    <span className="text-sm text-gray-400">/100</span>
                  </div>
                </div>
                <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${trustScore}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full ${
                      trustScore >= 80 ? "bg-emerald-500" :
                      trustScore >= 50 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                  />
                </div>
              </GlassCard>

              {/* Verification Status */}
              <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                  {valid ? (
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                  ) : (
                    <XCircle className="w-10 h-10 text-red-400" />
                  )}
                  <div className="text-left">
                    <h3 className={`text-lg font-bold ${valid ? "text-emerald-300" : "text-red-300"}`}>
                      {valid ? "Credential Verified" : result.revoked ? "Revoked" : result.expired ? "Expired" : "Not Found"}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {valid ? "Authentic and not tampered with." : "This credential cannot be verified."}
                    </p>
                  </div>
                </div>
              </GlassCard>

              {/* Timeline */}
              {result.exists && (
                <GlassCard>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-[#3DC2EC]" />
                    <h3 className="text-lg font-bold text-white">Verification Timeline</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                        <Award className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Credential Issued</p>
                        <p className="text-xs text-gray-400">Issued by {(offChain as { fromOrganisation?: string })?.fromOrganisation || result.issuer}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#5227FF]/20 border border-[#5227FF]/40 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-[#3DC2EC]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Blockchain Verification</p>
                        <p className="text-xs text-gray-400">Hash verified on-chain</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        valid ? "bg-emerald-500/20 border border-emerald-500/40" :
                        result.revoked ? "bg-red-500/20 border border-red-500/40" :
                        "bg-yellow-500/20 border border-yellow-500/40"
                      }`}>
                        <Activity className={`w-4 h-4 ${
                          valid ? "text-emerald-400" :
                          result.revoked ? "text-red-400" : "text-yellow-400"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          {valid ? "Verification Complete" :
                           result.revoked ? "Credential Revoked" :
                           result.expired ? "Credential Expired" : "Verification Failed"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {valid ? "All checks passed successfully" :
                           result.revoked ? "This credential has been revoked by the issuer" :
                           result.expired ? "This credential has expired" : "Could not verify credential"}
                        </p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* Details */}
              {result.exists && (
                <GlassCard>
                  <h3 className="text-lg font-bold text-white mb-4">Credential Details</h3>
                  <div className="space-y-3 text-sm">
                    {(offChain as { credentialName?: string })?.credentialName && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-gray-400">Document name</span>
                        <span className="font-medium text-[#3DC2EC] text-right">{(offChain as { credentialName: string }).credentialName}</span>
                      </div>
                    )}
                    {result.name && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-gray-400">Recipient (on-chain)</span>
                        <span className="font-medium text-white text-right">{result.name}</span>
                      </div>
                    )}
                    {(offChain as { metadata?: { recipientName?: string } })?.metadata?.recipientName &&
                      (offChain as { metadata: { recipientName: string } }).metadata.recipientName !== result.name && (
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-gray-400">Recipient (off-chain)</span>
                          <span className="font-medium text-white text-right">{(offChain as { metadata: { recipientName: string } }).metadata.recipientName}</span>
                        </div>
                      )}
                    {result.experience && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-gray-400">Details</span>
                        <span className="font-medium text-white text-right">{result.experience}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-gray-400">Issuer</span>
                      <span className="font-semibold text-white text-right">
                        {(offChain as { fromOrganisation?: string })?.fromOrganisation || result.issuer}
                      </span>
                    </div>
                    {result.issuer && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-gray-400 shrink-0">Issuer address</span>
                        <span className="font-mono text-[10px] break-all text-gray-500 text-right">{result.issuer}</span>
                      </div>
                    )}
                  </div>
                </GlassCard>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
