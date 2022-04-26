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
        profile_pic: profile.profile_pic,

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

// @route    GET api/posts
// @desc     Get all posts
// @access   Private
router.get("/", auth, async (req, res) => {
  const PAGE_SIZE = 3;
  const skip = (req.query.page - 1) * PAGE_SIZE;
  try {
    const posts = await Post.find().skip(skip).limit(PAGE_SIZE).sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route    GET api/posts/:user_id
// @desc     Get all posts of Particular user
// @access   Private
router.get("/user/:user_id", async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.user_id }).sort({
      date: -1,
    });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route    GET api/posts/location/:location
// @desc     Get all posts of Particular Location
// @access   Private
router.get("/location/:location", auth, async (req, res) => {
  console.log(req.params);
  try {
    const posts = await Post.find({
      location: req.params.location
    }).sort({
      date: -1,
    });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route    GET api/posts/:id
// @desc     Get post by ID
// @access   Private
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);

    res.status(500).send("Server Error");
  }
});

// @route    DELETE api/posts/:id
// @desc     Delete a post
// @access   Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    await post.remove();

    res.json({ msg: "Post removed" });
  } catch (err) {
    console.error(err.message);

    res.status(500).send("Server Error");
  }
});

// @route    PUT api/posts/like-unlike/:id
// @desc     Like a post
// @access   Private
router.put("/like-unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const { username, first_name, last_name } = await User.findById(
      req.user.id
    );
    const profile = await Profile.find({ user: req.user.id });
    const newLike = {
      user: req.user.id,
      username,
      first_name,
      last_name,
      user_profile_img: profile[0].image_url,
    };

    let is_liked = false;
    for (let item of post.likes) {
      if (item.user == req.user.id) {
        is_liked = true;
        break;
      }
    }

    if (!is_liked) {
      post.likes.push(newLike);
    } else {
      post.likes = post.likes.filter(({ user }) => user != req.user.id);
    }

    await post.save();
    
    if (is_liked) res.send(post.likes);
    if (!is_liked) res.send(post.likes);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route    POST api/posts/comment/:id
// @desc     Comment on a post
// @access   Private
router.post(
  "/comment/:id",
  auth,
  check("text", "Text is required").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const post = await Post.findById(req.params.id);
      const profile = await Profile.findOne({
        user: req.user.id,
      });

      const newComment = {
        user: req.user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        user_proile_img: profile.image_url,

        text: req.body.text,
      };

      post.comments.push(newComment);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route    DELETE api/posts/comment/:id/:comment_id
// @desc     Delete comment
// @access   Private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Pull out comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );
    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }
    // Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    post.comments = post.comments.filter(
      ({ id }) => id !== req.params.comment_id
    );

    await post.save();

    return res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

module.exports = router;
