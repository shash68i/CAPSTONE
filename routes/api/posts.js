const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");

const Post = require("../../models/Post");
const User = require("../../models/User");
const Profile = require("../../models/Profile");

// @route    POST api/posts
// @desc     Create a post
// @access   Private
router.post(
  "/",
  auth,
  [
    check("text", "Text is required").notEmpty(),
    check("images", "Images is required").notEmpty(),
    check("location", "Location is required").notEmpty(),
    check("tags", "Tag is required").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const profile = await Profile.findOne({
        user: req.user.id,
      });

      const newPost = new Post({
        user: req.user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        user_proile_img: profile.image_url,

        text: req.body.text,
        images: req.body.images,
        location: req.body.location,
        tags: req.body.tags,
      });

      const post = await newPost.save();

      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
