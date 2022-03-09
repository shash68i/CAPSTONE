const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");

// @route    POST api/users
// @desc     Register User
// @access   Public
router.post(
  "/",
  [
    check("username", "Username is Required").not().isEmpty(),
    check("email", "Please Enter a valid Email").isEmail(),
    check(
      "password",
      "Please Enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;
    try {
      // Checking if user exists
      const userName = await User.findOne({ username });
      const userEmail = await User.findOne({ email });

      if (userName && userEmail) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Username and Email already exists" }] });
      } else if (userName) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Username already exists" }] });
      } else if (userEmail) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Email already exists" }] });
      }

      user = new User({ username, email, password });

      // Encrypt the Password
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Return JSON Web Token
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 3600 },
        (err, token) => {
          if (err) {
            throw err;
          }
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
