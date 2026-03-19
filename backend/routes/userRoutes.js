import express from "express";
import { supabase } from "../config/db.js";
import { ethers } from "ethers";

const router = express.Router();

const verifyWalletSignature = (message, signature, expectedAddress) => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
};

// Signup
router.post("/signup", async (req, res) => {
  const { name, email, role, username, password, walletAddress, signature, organizationName, website, description } = req.body;
  try {
    const { data: existingUser } = await supabase.from('users').select('*').eq('username', username).single();
    if (existingUser) return res.status(400).json({ message: "Username already exists" });

    if (walletAddress) {
      const { data: walletUser } = await supabase.from('users').select('*').eq('wallet_address', walletAddress.toLowerCase()).single();
      if (walletUser) {
        return res.status(400).json({ message: "This wallet is already registered with another account" });
      }

      if (!signature) {
        return res.status(400).json({ message: "Wallet signature is required to verify ownership. Please sign the message with your wallet." });
      }

      const message = `Sign this message to verify wallet ownership for ${username} on DHRUVA`;
      const isValidSignature = verifyWalletSignature(message, signature, walletAddress);

      if (!isValidSignature) {
        return res.status(403).json({ message: "Invalid signature. Wallet ownership could not be verified. Please ensure you're signing with the correct wallet." });
      }
    }

    const { data: user, error } = await supabase.from('users').insert({
      name,
      email,
      role,
      username,
      password,
      wallet_address: walletAddress ? walletAddress.toLowerCase() : null,
      organization_name: role === "org" ? organizationName : null,
      website: role === "org" ? website : null,
      description: role === "org" ? description : null,
      is_approved: role !== "org"
    }).select().single();

    if (error) throw error;

    if (role === "org" && user.wallet_address) {
      const { data: existingRequest } = await supabase.from('org_approval_requests')
        .select('*').eq('organization_id', user.id).eq('status', 'pending').single();

      if (!existingRequest) {
        await supabase.from('org_approval_requests').insert({
          organization_id: user.id,
          wallet_address: user.wallet_address,
          username: user.username,
          organization_name: organizationName || "Unnamed Organization",
          website,
          description
        });
      }
    }

    res.status(201).json({ user, token: "dummy-jwt-token" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { username, password, walletAddress, signature } = req.body;
  try {
    const { data: user, error } = await supabase.from('users').select('*').eq('username', username).single();

    if (!user) return res.status(401).json({ message: "Invalid username or password" });
    if (user.password !== password) return res.status(401).json({ message: "Invalid username or password" });

    if (user.wallet_address && walletAddress) {
      const normalizedWallet = walletAddress.toLowerCase();
      if (user.wallet_address !== normalizedWallet) {
        return res.status(403).json({ message: "Wallet address does not match. Please connect with the wallet you registered with.", registeredWallet: user.wallet_address });
      }

      if (!signature) {
        return res.status(400).json({ message: "Wallet signature is required to verify ownership. Please sign the message with your wallet." });
      }

      const message = `Sign this message to verify wallet ownership for ${username} on DHRUVA`;
      const isValidSignature = verifyWalletSignature(message, signature, walletAddress);

      if (!isValidSignature) {
        return res.status(403).json({ message: "Invalid signature. Wallet ownership could not be verified. Please ensure you're signing with the correct wallet." });
      }
    } else if (user.wallet_address && !walletAddress) {
      return res.status(403).json({ message: "Please connect your registered MetaMask wallet to login" });
    } else if (!user.wallet_address && walletAddress) {
      if (!signature) {
        return res.status(400).json({ message: "Wallet signature is required to verify ownership. Please sign the message with your wallet." });
      }

      const message = `Sign this message to link wallet to ${username} on DHRUVA`;
      const isValidSignature = verifyWalletSignature(message, signature, walletAddress);

      if (!isValidSignature) {
        return res.status(403).json({ message: "Invalid signature. Wallet ownership could not be verified. Please ensure you're signing with the correct wallet." });
      }

      await supabase.from('users').update({ wallet_address: walletAddress.toLowerCase() }).eq('id', user.id);

      if (user.role === "org" && !user.is_approved) {
        const { data: existingRequest } = await supabase.from('org_approval_requests')
          .select('*').eq('organization_id', user.id).eq('status', 'pending').single();

        if (!existingRequest) {
          await supabase.from('org_approval_requests').insert({
            organization_id: user.id,
            wallet_address: walletAddress.toLowerCase(),
            username: user.username,
            organization_name: user.organization_name || "Unnamed Organization",
            website: user.website,
            description: user.description
          });
        }
      }
    }

    res.json({ user, token: "dummy-jwt-token" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Link Wallet
router.post("/link-wallet", async (req, res) => {
  const { userId, walletAddress, signature } = req.body;

  if (!signature) {
    return res.status(400).json({ message: "Wallet signature is required to verify ownership. Please sign the message with your wallet." });
  }

  try {
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!user) return res.status(404).json({ message: "User not found" });

    const { data: existingUser } = await supabase.from('users').select('*').eq('wallet_address', walletAddress.toLowerCase()).single();
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ message: "This wallet is already linked to another account" });
    }

    const message = `Sign this message to link wallet to ${user.username} on DHRUVA`;
    const isValidSignature = verifyWalletSignature(message, signature, walletAddress);

    if (!isValidSignature) {
      return res.status(403).json({ message: "Invalid signature. Wallet ownership could not be verified. Please ensure you're signing with the correct wallet." });
    }

    const { data: updatedUser } = await supabase.from('users').update({ wallet_address: walletAddress.toLowerCase() }).eq('id', userId).select().single();

    if (updatedUser.role === "org" && !updatedUser.is_approved && updatedUser.wallet_address) {
      const { data: existingRequest } = await supabase.from('org_approval_requests')
        .select('*').eq('organization_id', updatedUser.id).eq('status', 'pending').single();

      if (!existingRequest) {
        await supabase.from('org_approval_requests').insert({
          organization_id: updatedUser.id,
          wallet_address: updatedUser.wallet_address,
          username: updatedUser.username,
          organization_name: updatedUser.organization_name || "Unnamed Organization",
          website: updatedUser.website,
          description: updatedUser.description
        });
      }
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Unlink Wallet
router.post("/unlink-wallet", async (req, res) => {
  const { userId, walletAddress } = req.body;

  try {
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.wallet_address || user.wallet_address.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(400).json({ message: "Wallet address does not match user's linked wallet" });
    }

    const oldWalletAddress = user.wallet_address;
    await supabase.from('users').update({ wallet_address: null }).eq('id', userId);

    res.json({
      message: "Wallet unlinked successfully",
      oldWalletAddress,
      requiresBlockchainRevocation: user.role === "org" && user.is_approved,
      note: "If this organization was authorized on blockchain, please revoke authorization manually using the Authorization page or contact the contract owner."
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Auth by Wallet
router.post("/auth", async (req, res) => {
  const { walletAddress, role } = req.body;

  try {
    const normalizedAddress = walletAddress.toLowerCase();
    const { data: user } = await supabase.from('users').select('*').eq('wallet_address', normalizedAddress).single();

    if (!user) {
      const { data: newUser, error } = await supabase.from('users').insert({
        wallet_address: normalizedAddress,
        username: normalizedAddress,
        password: "wallet-auth",
        role
      }).select().single();

      if (error) throw error;
      return res.status(201).json({ user: newUser, message: "Account created successfully" });
    } else {
      if (user.role !== role) {
        return res.status(403).json({ message: `This wallet is already registered as a ${user.role}. Please use the correct role to login.`, existingRole: user.role, requestedRole: role });
      }
      return res.status(200).json(user);
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update Profile
router.put("/:walletAddress", async (req, res) => {
  const { walletAddress } = req.params;
  const updates = req.body;

  try {
    const { data: user, error } = await supabase.from('users').update(updates).eq('wallet_address', walletAddress.toLowerCase()).select().single();
    if (error || !user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Profile by Wallet
router.get("/:walletAddress", async (req, res) => {
  const { walletAddress } = req.params;

  try {
    const { data: user } = await supabase.from('users').select('*').eq('wallet_address', walletAddress.toLowerCase()).single();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Profile by Username
router.get("/profile/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const { data: user } = await supabase.from('users').select('*').eq('username', username).single();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Forgot Password
router.post("/forgot-password", async (req, res) => {
  const { username, newPassword } = req.body;

  try {
    if (!username || !newPassword) {
      return res.status(400).json({ message: "Username and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const { data: user } = await supabase.from('users').select('*').eq('username', username).single();
    if (!user) return res.status(404).json({ message: "User not found" });

    await supabase.from('users').update({ password: newPassword }).eq('username', username);

    res.json({ message: "Password reset successful", success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
