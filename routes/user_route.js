const express = require("express");
const router = express.Router();
const bcryptjs = require("bcryptjs");
const UserModel = require("../models/user_model.js");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
// signup route
router.post("/signup", (req, res) => {
  const {
    fullName,
    email,
    password,
    profileImg,
    backgroundwallpaper,
    location,
    DOB,
    bio,
    followers,
    following,
  } = req.body;
  if (!fullName || !email || !password || !location || !DOB) {
    return res.status(400).json({ error: "Please enter all mandotary fields" });
  }

  UserModel.findOne({ email: email })
    .then((userInDB) => {
      if (userInDB) {
        return res
          .status(500)
          .json({ error: "User with this email already exist" });
      }

      bcryptjs
        .hash(password, 16)
        .then((hashedPassword) => {
          const user = new UserModel({
            fullName,
            email,
            password: hashedPassword,
            backgroundwallpaper,
            profileImg,
            location,
            DOB,
            bio,
            followers,
            following,
          });
          user
            .save()
            .then((newUser) => {
              res.status(201).json({
                result: "User signed up successfully",
              });
            })
            .catch((err) => {
              console.log(err);
            });
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
});

// login backend
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Please enter all mandotary fields" });
  }

  UserModel.findOne({ email: email })
    .then((userInDB) => {
      if (!userInDB) {
        return res.status(401).json({ error: "Invalid Credentials" });
      }

      bcryptjs
        .compare(password, userInDB.password)
        .then((didMatch) => {
          if (didMatch) {
            const jwtToken = jwt.sign({ _id: userInDB._id }, JWT_SECRET);
            const userInfo = {
              _id: userInDB._id,
              email: userInDB.email,
              fullName: userInDB.fullName,
              profileImg: userInDB.profileImg,
              backgroundwallpaper: userInDB.backgroundwallpaper,
              location: userInDB.location,
              DOB: userInDB.DOB,
              bio: userInDB.bio,
              followers: userInDB.followers,
              following: userInDB.following,
            };

            res
              .status(200)
              .json({ result: { token: jwtToken, user: userInfo } });
          } else {
            return res.status(401).json({ error: "Invalid Credentials" });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
});
//getting data of user for the update REST API
router.get("/updatedata/:_id", async (req, res) => {
  let request = { _id: req.params._id };
  let result = await UserModel.findOne(request);

  if (result) {
    res.send(result);
  } else {
    res.send({ result: "No user found " });
  }
});
//Update Rest APT
/*we can use same address for two diferent api workings , but their method must be different  
  for example for : router.get and router.put,we  can use same address becouse they both have two different get and put method*/
router.put("/updatedata/:_id", async (req, res) => {
  let result = await UserModel.updateOne(
    { _id: req.params._id },
    { $set: req.body }
  ); //here 1st {} object is what is need to be updated , and second {}object is new data that is to be updated
  res.send(result);
});
//Search rest API To search the users from the search bars
router.get("/search/:key", async (req, res) => {
  let result = await UserModel.find({
    $or: [
      { fullName: { $regex: req.params.key } },
      { email: { $regex: req.params.key } },
      { location: { $regex: req.params.key } },
    ],
  }); //$or is used when ever we are searching in more than one field
  //$regex: req.params.key are all standard way to search the data in particular fields
  res.send(result);
});
module.exports = router;
