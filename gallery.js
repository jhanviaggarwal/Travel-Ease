const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const router = express.Router();

router.use(express.json());

// Mongoose Schema and Model
const postSchema = new mongoose.Schema({
  name: { type: String, required: true },
  content: { type: String, required: true },
  media_urls: [String], // Array of media URLs
  created_at: { type: Date, default: Date.now },
  visibility: { type: String, default: "public" },
});
const Post = mongoose.model("Post", postSchema);

// Multer Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpg|jpeg|png|webp|mp4|mkv|avi|mov|wmv|flv/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimeType = allowedTypes.test(file.mimetype);

  if (extname && mimeType) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid File Type. Only photos and videos are allowed."),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB file size limit
  fileFilter: fileFilter,
});

// Route to Add a New Post
router.post("/addPost", upload.array("media", 10), async (req, res) => {
  try {
    const { name, content } = req.body;
    if (!name) {
      return res.status(400).json({ msg: "Name is required" });
    }
    if (!content) {
      return res.status(400).json({ msg: "Post content is required" });
    }

    let mediaUrls = [];
    if (req.files && req.files.length > 0) {
      mediaUrls = req.files.map((file) => {
        const mediaPath = file.path;
        return `${req.protocol}://${req.get("host")}/${mediaPath}`;
      });
    }

    const newPost = new Post({
      name,
      content,
      media_urls: mediaUrls,
    });

    await newPost.save();

    res.status(201).json({
      msg: "Post added successfully",
      post: newPost,
    });
  } catch (error) {
    res.status(500).json({ msg: "Error adding post", error: error.message });
  }
});

// Route to Fetch All Posts
router.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find(); 
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching posts", error: error.message });
  }
});

module.exports = router;
