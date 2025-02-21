const express = require("express");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const router = express.Router();

cloudinary.config({
  cloud_name: "dooopjthm",
  api_key: "292123138895256",
  api_secret: "Jw_PTApBQOxMJTKyVOLSoFRDVRg",
});

const convertToBase64 = require("../utils/convertToBase64");

const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const User = require("../models/User");

router.get("/", (req, res) => {
  try {
    return res.status(200).json({ message: "Welcome to Vinted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    if (!req.body.username || !req.body.password || !req.body.email) {
      return res
        .status(400)
        .json({ message: "Please fill all the parameters" });
    }
    const mailExists = await User.findOne({ email: req.body.email });
    if (mailExists !== null) {
      return res.status(409).json({ message: "Mail already exists" });
    }
    const salt = uid2(16);
    //console.log(salt);
    const token = uid2(64);
    // console.log(token);
    const passwordSalt = req.body.password + salt;
    //console.log(passwordSalt);
    const hash = SHA256(passwordSalt).toString(encBase64);
    //console.log(hash);

    const convertedPicture = convertToBase64(req.files.avatar);

    const cloudinaryResponse = await cloudinary.uploader.upload(
      convertedPicture
    );

    const newUser = new User({
      email: req.body.email,
      account: {
        username: req.body.username,
        avatar: cloudinaryResponse,
      },
      newsletter: req.body.newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });

    await newUser.save();

    const toReturn = {
      _id: newUser.id,
      token: newUser.token,
      account: {
        username: newUser.account.username,
      },
    };

    return res.status(201).json(toReturn);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    //console.log(req.body);

    const userToFind = await User.findOne({ email: req.body.email });
    //console.log(userToFind);

    //console.log(userToFind);
    if (!userToFind) {
      return res.status(401).json({ message: "Unauthorized" });
    } else {
      const hash2 = SHA256(req.body.password + userToFind.salt).toString(
        encBase64
      );
      if (hash2 === userToFind.hash) {
        const toReturn = {
          _id: userToFind.id,
          token: userToFind.token,
          account: {
            username: userToFind.account.username,
          },
        };
        return res.status(200).json(toReturn);
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
