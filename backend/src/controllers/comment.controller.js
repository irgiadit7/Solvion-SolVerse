import asyncHandler from "express-async-handler";
import { getAuth } from "@clerk/express";
import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import cloudinary from "../config/cloudinary.js";

export const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const comments = await Comment.find({ post: postId })
    .sort({ createdAt: -1 })
    .populate("user", "username firstName lastName profilePicture");

  res.status(200).json({ comments });
});

export const createComment = asyncHandler(async (req, res) => {
  console.log("--- MENCOBA MEMBUAT KOMENTAR ---");
  const { userId } = getAuth(req); 
  const { postId } = req.params;
  const { content, base64Image } = req.body;

  console.log("Post ID:", postId);
  console.log("Content:", content ? "Ada" : "Kosong");
  console.log("Base64Image:", base64Image ? `Ada, ${base64Image.substring(0, 40)}...` : "Kosong");

  let imageUrl = null;

  if (base64Image) {
    console.log("Mencoba upload ke Cloudinary...");
    const uploadResponse = await cloudinary.uploader.upload(base64Image, {
      folder: "social_media_comments",
      resource_type: "image",
      transformation: [
        { width: 1080, crop: "limit" },
        { quality: "auto" },
        { format: "auto" },
      ],
    });
    imageUrl = uploadResponse.secure_url; 
  }

  if (!content && !imageUrl) {
    console.log("Validasi GAGAL: Tidak ada content atau image.");
    return res
      .status(400)
      .json({ message: "Komentar harus berisi teks atau gambar." });
  }


  console.log("Mencari User dan Post...")
  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(postId);

  if (!user || !post) {
    console.log("Validasi GAGAL: User atau Post tidak ditemukan.")
    return res.status(404).json({ error: "User atau post tidak ditemukan" });
  }

  console.log("Membuat komentar di database...");

  const comment = await Comment.create({
    user: user._id, 
    post: postId,
    content: content || "", 
    image: imageUrl, 
  });

  console.log("Menautkan komentar ke post...");


  await Post.findByIdAndUpdate(postId, {
    $push: { comments: comment._id },
  });

  if (post.user.toString() !== user._id.toString()) {
    await Notification.create({
      from: user._id,
      to: post.user,
      type: "comment",
      post: postId,
      comment: comment._id,
    });
  }

  const populatedComment = await Comment.findById(comment._id).populate(
    "user",
    "username firstName lastName profilePicture"
  );

  res.status(201).json({ comment: populatedComment });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { commentId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  const comment = await Comment.findById(commentId);

  if (!user || !comment) {
    return res
      .status(404)
      .json({ error: "User atau komentar tidak ditemukan" });
  }

  if (comment.user.toString() !== user._id.toString()) {
    return res
      .status(403)
      .json({ error: "Anda hanya bisa menghapus komentar Anda sendiri" });
  }

  await Post.findByIdAndUpdate(comment.post, {
    $pull: { comments: commentId },
  });

  await Comment.findByIdAndDelete(commentId);

  res.status(200).json({ message: "Komentar berhasil dihapus" });
});
