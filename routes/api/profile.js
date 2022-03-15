const express = require("express");
const config = require("config");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

const Profile = require("../../models/Profile");
const User = require("../../models/User");
// const Post = require('../../models/Post');

// @route    GET api/profile/me
// @desc     Get current users profile
// @access   Private
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    });

    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post("/", auth, async (req, res) => {
  // Destructure the request
  const { image_url, address, bio, twitter, instagram, facebook } = req.body;

  // Build a profile
  const profileFields = {};

  // Profile user is set to current logged in user
  profileFields.user = req.user.id;

  if (image_url) profileFields.image_url = image_url;
  if (address) profileFields.address = address;
  if (bio) profileFields.bio = bio;

  profileFields.social = {};
  if (twitter) profileFields.social.twitter = twitter;
  if (instagram) profileFields.social.instagram = instagram;
  if (facebook) profileFields.social.facebook = facebook;

  try {
    // Using upsert option (creates new doc if no match is found):
    let profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $set: profileFields },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

// @route    GET api/profile
// @desc     Get all profiles
// @access   Public
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route    GET api/profile/user/:user_id
// @desc     Get profile by user ID
// @access   Public
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    });

    if (!profile) return res.status(400).json({ msg: "Profile not found" });

    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not Found" });
    }
    return res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
