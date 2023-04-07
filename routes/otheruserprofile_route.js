const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const protectedRoute = require("../middleware/protectedResource");
const TweetModel = require("../models/tweet_model");
const UserModel = require("../models/user_model");
//rest API for getting the details of other user
router.get("/userprofile/:id", protectedRoute, (req, res) => {
  UserModel.findOne({ _id: req.params.id })

    .select("-password")
    .then((user) => {
      if (!user) {
        console.log("User not found");
        return res.status(404).json({ error: "User not found" });
      }
      TweetModel.find({ author: req.params.id })
        .populate(
          "author",
          "_id fullName profileImg followers following backgroundwallpaper"
        )
        .populate("retweetFrom", "_id fullName profileImg")
        .populate("comments.commentedBy", "_id fullName profileImg")

        .populate("comments", "_id commentText commentedBy likes")
        .populate("comments.commentreplys.replyBy", "_id fullName profileImg")

        .then((tweets) => {
          console.log("User:", user);
          console.log("Tweets:", tweets);
          res.json({ user, tweets });
        })
        .catch((error) => {
          console.error(error);
          return res.status(500).json({ error: "Internal server error" });
        });
    })
    .catch((error) => {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    });
});

//REST API for the follow function
//since model.findIdAndUpdate no longer accept callback functions , so i replace below code with
//async/await instead of the callback function.
router.put("/follow", protectedRoute, async (req, res) => {
  try {
    const followedUser = await UserModel.findByIdAndUpdate(
      req.body.followId, // //assume this is the Id of other person which i follow
      { $push: { followers: req.user._id } }, //// here we pushing my Id in followers array of that user which I follow
      { new: true } //to return new record as mongodb by default return us old record
    ).select("-password"); //it stop backend to pass the password to response (security concern)

    await UserModel.findByIdAndUpdate(
      req.user._id, //now here update the following of the logged in user
      { $push: { following: req.body.followId } },
      { new: true }
    ).select("-password");

    const loggedInUser = await UserModel.findById(req.user._id);

    res.json(loggedInUser);
  } catch (error) {
    return res.status(422).json({ error: error.message });
  }
});
//below code use model.findByIdAndUpdate() callback function , it no longer work
// router.put("/follow", protectedRoute, (req, res) => {
//   UserModel.findByIdAndUpdate(
//     req.body.followId, //assume this is the Id of other person which i follow
//     {
//       $push: { followers: req.user._id }, // here we pushing my Id in followers array of that user which I follow
//     },
//     { new: true }, //to return new record as mongodb by default return us old record
//     (err, result) => {
//       if (err) {
//         return res.status(422).json({ error: err });
//       }
//       UserModel.findByIdAndUpdate(
//         req.user._id, //now here update the following of the logged in user
//         { $push: { following: req.body.followID } },
//         { new: true }
//       )
//         .then((result) => {
//           res.json(result);
//         })
//         .catch((error) => {
//           return res.status(422).json({ error: error });
//         });
//     }
//   );
// });
//REST API for the Unfollow function
//since model.findIdAndUpdate no longer accept callback functions , so i replace below code with
//async/await instead of the callback function.
router.put("/unfollow", protectedRoute, async (req, res) => {
  try {
    const followedUser = await UserModel.findByIdAndUpdate(
      req.body.unfollowId, // //assume this is the Id of other person which i follow
      { $pull: { followers: req.user._id } }, //// here we pushing my Id in followers array of that user which I follow
      { new: true } //to return new record as mongodb by default return us old record
    );

    await UserModel.findByIdAndUpdate(
      req.user._id, //now here update the following of the logged in user
      { $pull: { following: req.body.unfollowId } },
      { new: true }
    );

    const loggedInUser = await UserModel.findById(req.user._id);

    res.json(loggedInUser);
  } catch (error) {
    return res.status(422).json({ error: error.message });
  }
});

module.exports = router;
