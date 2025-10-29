import { clerkClient } from "@clerk/express";
import User from "../models/user.model.js";

// MODIFIKASI TOTAL: Fungsi syncUser
export const syncUser = async (req, res) => {
  try {
    const { userId } = req.auth;
    // Ambil data user yang dikirim dari mobile app (dari Langkah 2)
    const { email, username, firstName, lastName, profilePic } = req.body;

    // 1. Cek apakah user sudah ada di MongoDB
    const user = await User.findOne({ clerkId: userId });

    if (user) {
      // User sudah ada, tidak perlu sync, langsung kembalikan 200 OK
      return res.status(200).json(user);
    }

    // 2. Jika user BELUM ada, buat user baru dari data HP
    // Cek apakah data email ada (sebagai penanda data dari HP valid)
    if (email) {
      console.log(`Syncing NEW user ${email} from mobile data...`);

      // Buat username default jika 'username' null (misal dari Google login)
      const newUsername =
        username ||
        `${firstName || ""}${lastName || ""}`.replace(/\s/g, "") ||
        email.split("@")[0];

      const newUserData = {
        clerkId: userId,
        username: newUsername,
        email: email,
        profilePic: profilePic,
      };

      const newUser = await User.create(newUserData);
      return res.status(201).json(newUser); // 201 = Created
    
    } else {
      // 3. Fallback (Jaga-jaga jika HP tidak kirim data)
      // Ini adalah kode LAMA Anda yang menyebabkan race condition
      console.warn(`SyncUser Fallback: No data from mobile. Fetching from Clerk API for user ${userId}. This might fail.`);
      
      const clerkUser = await clerkClient.users.getUser(userId);

      const clerkUsername =
        clerkUser.username ||
        `${clerkUser.firstName || ""}${clerkUser.lastName || ""}`.replace(/\s/g, "") ||
        clerkUser.emailAddresses[0].emailAddress.split("@")[0];
        
      const clerkEmail = clerkUser.emailAddresses[0].emailAddress;
      const clerkProfilePic = clerkUser.imageUrl;

      const newUserData = {
        clerkId: userId,
        username: clerkUsername,
        email: clerkEmail,
        profilePic: clerkProfilePic,
      };
      
      const newUser = await User.create(newUserData);
      return res.status(201).json(newUser);
    }
  } catch (error) {
    console.error("Error in syncUser:", error.message);
    // Kirim pesan error yang lebih jelas ke HP
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// --- SISA FILE BIARKAN SAMA ---

export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getUserProfile:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const { userId } = req.auth;
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getCurrentUser:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { username, profilePic, bio } = req.body;

    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // check if username is already taken
    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser.clerkId !== userId) {
        return res.status(400).json({ error: "Username already taken" });
      }

      await clerkClient.users.updateUser(userId, { username });
      user.username = username;
    }

    if (profilePic) {
      user.profilePic = profilePic;
    }

    if (bio) {
      user.bio = bio;
    }

    user = await user.save();
    res.status(200).json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Username already taken" });
    }
    console.error("Error in updateProfile:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};