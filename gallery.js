const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require('multer');
const router = express.Router();

router.use(express.json());

const postsFile = path.join(__dirname, "posts.json");

//functions to read and write 
const readFile = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8") || "[]");
const writeFile = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})

const fileFilter = (req, file, cb) => {
    // Define allowed file types for both images and videos
    const allowedTypes = /jpg|jpeg|png|webp|mp4|mkv|avi|mov|wmv|flv/;

    // Check file extension
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    // Check MIME type
    const mimeType = allowedTypes.test(file.mimetype);

    if (extname && mimeType) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error("Invalid File Type. Only photos and videos are allowed."), false); // Reject the file
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 2*1024*1024*1024 },
    fileFilter: fileFilter
})

const addPost = (name, content, mediaUrls = []) => {
    const postsData = readFile(postsFile);
    const postId = postsData.length === 0 ? 1 : postsData[postsData.length - 1].id + 1;
    const newPost = {
        id: postId,
        name: name,
        content: content,
        media_urls: mediaUrls, // Store multiple media URLs
        created_at: new Date().toISOString(),
        visibility: 'public',
    };
    postsData.push(newPost);
    writeFile(postsFile, postsData);
    return newPost;
};

router.post('/addPost', upload.array('media', 10), // Allow up to 10 files with the field name 'media'
    (req, res) => {
        try {
            const name = req.body.name;
            const content = req.body.content;
            if(!name){
                return res.status(400).json({msg: "Name is required"});
            }
            if (!content) {
                .0
                return res.status(400).json({ msg: "Post content is required" });
            }
            
            let mediaUrls = [];
            if (req.files && req.files.length > 0) {
                mediaUrls = req.files.map(file => {
                    const mediaPath = file.path; 
                    return `${req.protocol}://${req.get('host')}/${mediaPath}`; 
                });
            }

            const newPost = addPost(name, content, mediaUrls);

            res.status(201).json({
                msg: "Post added successfully",
                post: { name, content, mediaUrls },
            });
        } catch (error) {
            res.status(500).json({ msg: "Error adding post", error: error.message });
        }
    }
);

// Endpoint to fetch all posts
router.get('/posts', (req, res) => {
    try {
        const postsData = readFile(postsFile); // Read posts from the file
        res.status(200).json(postsData); // Return the posts as JSON
    } catch (error) {
        res.status(500).json({ msg: "Error fetching posts", error: error.message });
    }
});


module.exports = router;