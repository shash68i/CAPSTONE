const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
  },
  image_url: {
    type: String,
  },
  address: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
  },
  social: {
    twitter: {
      type: String,
    },
    facebook: {
      type: String,
    },
    instagram: {
      type: String,
    },
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("profile", ProfileSchema);
