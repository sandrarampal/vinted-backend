const mongoose = require("mongoose");
const express = require("express");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const router = express.Router();

const Offer = require("../models/Offer");
const User = require("../models/User");

const isAuthenticated = require("../middlewares/isAuthenticated");

const convertToBase64 = require("../utils/convertToBase64");

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      isAuthenticated;
      if (req.body.description.length > 500) {
        return res.status(400).json({ message: "Description is too long" });
      }
      if (req.body.title.length > 50) {
        return res.status(400).json({ message: "Title is too long" });
      }
      if (req.body.price > 100000) {
        return res.status(400).json({ message: "The price is too high" });
      }

      const userToken = req.headers.authorization.replace("Bearer ", "");
      //console.log(userToken);
      const user = await User.findOne({ token: userToken });
      const convertedPicture = convertToBase64(req.files.picture);
      //console.log(convertedPicture);

      const cloudinaryResponse = await cloudinary.uploader.upload(
        convertedPicture
      );
      //console.log(cloudinaryResponse);

      const newOffer = new Offer({
        product_name: req.body.title,
        product_description: req.body.description,
        product_price: req.body.price,
        product_details: [
          { MARQUE: req.body.brand },
          { TAILLE: req.body.size },
          { ETAT: req.body.condition },
          { COULEUR: req.body.color },
          { EMPLACEMENT: req.body.city },
        ],
        owner: {
          account: {
            username: user.username,
            avatar: user.avatar,
          },
          _id: user.id,
        },
        product_image: cloudinaryResponse,
      });
      //console.log(newOffer);
      await newOffer.save();
      const offerCreated = await Offer.find(newOffer).populate(
        "owner",
        "account"
      );
      console.log(offerCreated);

      res.status(200).json(offerCreated);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/offer/modify/:id",
  fileUpload(),
  isAuthenticated,
  async (req, res) => {
    try {
      isAuthenticated;

      if (req.body.description.length > 500) {
        return res.status(400).json({ message: "Description is too long" });
      }
      if (req.body.title.length > 50) {
        return res.status(400).json({ message: "Title is too long" });
      }
      if (req.body.price > 100000) {
        return res.status(400).json({ message: "The price is too high" });
      }

      const offerToModify = await Offer.findById(req.params.id);
      //console.log(offerToModify);
      //console.log(req.body);

      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      //déstructuration de variables, crée des variables à partir de req.body

      if (title) {
        offerToModify.product_name = title;
      }
      if (description) {
        offerToModify.product_description = description;
      }
      if (price) {
        offerToModify.product_price = price;
      }
      if (condition) {
        offerToModify.product_details[2]["ETAT"] = condition;
      }
      if (city) {
        offerToModify.product_details[4]["EMPLACEMENT"] = city;
      }
      if (brand) {
        offerToModify.product_details[0]["MARQUE"] = brand;
      }
      if (size) {
        offerToModify.product_details[1]["TAILLE"] = size;
      }
      if (color) {
        offerToModify.product_details[3]["COULEUR"] = color;
      }
      if (req.files.picture) {
        const convertedPicture = convertToBase64(req.files.picture);
        const cloudinaryResponse = await cloudinary.uploader.upload(
          convertedPicture
        );
        offerToModify.product_image = cloudinaryResponse;
      }
      await offerToModify.save();

      res.status(200).json(offerToModify);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
  try {
    isAuthenticated;
    await Offer.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Offer successfully deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, page, sort } = req.query;
    const filters = {};

    if (title) {
      filters.product_name = new RegExp(title, "i");
    }
    if (priceMax) {
      filters.product_price = { $lte: Number(priceMax) };
    }
    if (priceMin) {
      if (filters.product_price) {
        filters.product_price.$lte = Number(priceMax);
      } else {
        filters.product_price = { $gte: Number(priceMin) };
      }
    }

    const sorting = {};

    if (sort) {
      if (sort === "price-desc") {
        sorting.product_price = "desc";
      } else if (sort === "price-asc") {
        sorting.product_price = "asc";
      }
      if (sort === "title-desc") {
        sorting.product_name = "desc";
      } else if (sort === "title-asc") {
        sorting.product_name = "asc";
      }
    } else {
      sorting.product_name = "asc";
    }

    let pageToShow;
    if (page) {
      pageToShow = Number(page) - 1;
      //js est permissif donc ça marche
      // mais les query sont des strings donc idéalement il faut les transformer en number
    } else {
      pageToShow = 0;
    }
    let limit = 5;
    //console.log(filters);
    const offers = await Offer.find(filters)
      .populate("owner", "account")
      // .select("product_name product_price")
      .sort(sorting)
      .skip(limit * pageToShow)
      .limit(limit);
    const offersLength = await Offer.countDocuments(filters); //permet de compter les offres correspondant aux filtres.

    const filteredOffers = { count: offersLength, offers: offers };
    res.status(200).json(filteredOffers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    const offerToGet = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    res.status(200).json(offerToGet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
