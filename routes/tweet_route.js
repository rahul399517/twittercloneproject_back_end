const express = require("express");
const router = express.Router();
const bcryptjs = require("bcryptjs");
const mongoose = require("mongoose");
const TweetModel = require("../models/tweet_model");
const protectedRoute = require("../middleware/protectedResource");
const UserModel = require("../models/user_model");
//All user tweets
router.get("/alltweets", (req, res) => {
  TweetModel.find()
    .populate("author", "_id fullName profileImg backgroundwallpaper")
    .populate("comments.commentedBy", "_id fullName profileImg ")
    .populate("comments", "_id commentText commentedBy likes")
    .populate("comments.commentreplys.replyBy", "_id fullName profileImg")
    .populate("retweetFrom", "_id fullName profileImg")
    .then((dbtweets) => {
      res.status(200).json({ tweets: dbtweets });
    })
    .catch((error) => {
      console.log(error);
    });
});
//only those posts from ,whom I follow
router.get("/allsubscribedtweets", protectedRoute, async (req, res) => {
  //if posted by in following
  try {
    let id = req.user._id;
    const currentUser = await UserModel.findById(id);
    const followingIds = currentUser.following;
    const tweets = await TweetModel.find({
      author: { $in: followingIds },
    })
      .populate("author", "_id fullName profileImg backgroundwallpaper")
      .populate("comments", "_id commentText commentedBy likes ")
      .populate("retweetFrom", "_id fullName profileImg")
      .populate("comments.commentreplys.replyBy", "_id fullName profileImg")
      .populate("comments.commentedBy", "_id fullName profileImg ");
    res.json(tweets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});
//All tweets only from logged in user
router.get("/myalltweets", protectedRoute, (req, res) => {
  TweetModel.find({ author: req.user._id })
    .populate("author", "_id fullName profileImg backgroundwallpaper")
    .populate("comments", "_id commentText commentedBy likes")
    .populate("retweetFrom", "_id fullName profileImg")
    .populate("comments.commentreplys.replyBy", "_id fullName profileImg")
    .populate("comments.commentedBy", "_id fullName profileImg ")

    .then((dbtweets) => {
      res.status(200).json({ tweets: dbtweets });
    })
    .catch((error) => {
      console.log(error);
    });
});
//Create a new tweet
router.post("/createtweet", protectedRoute, (req, res) => {
  const {
    description,
    location,
    image,
    date,
    retweetFrom,
    retweetDate,
    retweets,
    comments,
  } = req.body;
  if (!description || !location) {
    return res.status(400).json({ error: "Please enter mandatory fields" });
  }
  req.user.password = undefined;
  const tweetObj = new TweetModel({
    description: description,
    location: location,
    image: image,
    date: date,
    author: req.user,
    retweetFrom: retweetFrom,
    retweetDate: retweetDate,
    retweets: retweets,
    comments: comments,
  });

  tweetObj
    .save()
    .then((newtweet) => {
      res.status(201).json({ tweet: newtweet });
    })
    .catch((error) => {
      console.log(error);
    });
});
//To delete tweet
router.delete("/deletetweet/:_id", protectedRoute, async (req, res) => {
  const result = await TweetModel.deleteOne({ _id: req.params._id });
  res.send(result);
  /* TweetModel.findOne({ _id: req.params.tweetId })
    .populate("author", "_id")
    .exec((error, tweetFound) => {
      if (error || !tweetFound) {
        return res.status(400).json({ error: "tweet does not exist" });
      }
      //Check if the tweet author is same as logged in user , only then allow deletion
      if (tweetFound.author._id.toString() === req.user._id.toString()) {
        tweetFound
          .remove()
          .then((data) => {
            res.status(200).json({ result: data });
          })
          .catch((error) => {
            console.log(error);
          });
      }
    });*/
});
//rest API for like the tweet
router.put("/like", protectedRoute, (req, res) => {
  TweetModel.findByIdAndUpdate(
    req.body.tweetId, //tweetId
    { $push: { likes: req.user._id } },
    { new: true }
  ) //return updated record
    .populate("author", "_id fullName backgroundwallpaper")
    .populate("retweetFrom", "_id fullName profileImg")
    .populate("comments.commentreplys.replyBy", "_id fullName profileImg")
    .populate("comments", "_id commentText commentedBy likes ")
    //instead .exec use .then method
    .then((result) => {
      res.json(result);
    })
    .catch((error) => {
      return res.status(400).json({ error: error });
    });
  /*Below exec code become outdated
     .exec((error, result) => {
      if (error) {
        return res.status(400).json({ error: error });
      } else {
        res.json(result);
      }
    });*/
});
//Rest API to Unlike the tweet
router.put("/unlike", protectedRoute, (req, res) => {
  TweetModel.findByIdAndUpdate(
    req.body.tweetId, //tweetId
    { $pull: { likes: req.user._id } },
    { new: true }
  ) //return updated record
    .populate("author", "_id fullName backgroundwallpaper")
    .populate("retweetFrom", "_id fullName profileImg")
    .populate("comments.commentreplys.replyBy", "_id fullName profileImg")
    .populate("comments", "_id commentText commentedBy likes ")
    .then((result) => {
      res.json(result);
    })
    .catch((error) => {
      return res.status(400).json({ error: error });
    });
});

//Rest API for the Adding comment
router.put("/comment", protectedRoute, async (req, res) => {
  try {
    const { commentText, tweetId } = req.body;
    if (!commentText || !tweetId) {
      return res
        .status(400)
        .json({ error: "Comment text or tweet ID missing" });
    }

    const comment = {
      commentText,
      commentedBy: req.user._id,
    };

    const updatedTweet = await TweetModel.findByIdAndUpdate(
      tweetId,
      { $push: { comments: comment } },
      { new: true }
    )
      .populate("comments.commentedBy", "_id fullName profileImg")
      .populate("author", "_id fullName backgroundwallpaper")
      .populate("comments", "_id commentText commentedBy likes")
      .populate("comments.commentreplys.replyBy", "_id fullName profileImg")
      .populate("retweetFrom", "_id fullName profileImg");

    res.json(updatedTweet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// REST API to delete the comment
router.delete("/comment/:commentId", protectedRoute, async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const tweet = await TweetModel.findOneAndUpdate(
      { "comments._id": commentId },
      { $pull: { comments: { _id: commentId, commentedBy: req.user._id } } },
      { new: true }
    )
      .populate("comments.commentedBy", "_id fullName profileImg")
      .populate("author", "_id fullName backgroundwallpaper")
      .populate("comments", "_id commentText commentedBy likes")
      .populate("comments.commentreplys.replyBy", "_id fullName profileImg")
      .populate("retweetFrom", "_id fullName profileImg");

    if (!tweet) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.json(tweet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// REST API for retweeting a tweet
router.post("/retweet/:id", protectedRoute, async (req, res) => {
  try {
    // Check if the tweet being retweeted exists
    const tweetToRetweet = await TweetModel.findById(req.params.id)
      .populate("author", "_id fullName profileImg")
      .populate("retweetFrom", "_id fullName profileImg")
      .populate("comments", "_id commentText commentedBy likes ")
      .populate("comments.commentreplys.replyBy", "_id fullName profileImg")
      .populate("comments.commentedBy", "_id fullName profileImg ");
    if (!tweetToRetweet) {
      return res.status(404).json({ error: "Tweet not found" });
    }
    console.log(tweetToRetweet);
    // Create a new tweet object based on the original tweet
    const retweetObj = new TweetModel({
      description: tweetToRetweet.description,
      location: tweetToRetweet.location,
      image: tweetToRetweet.image,
      date: new Date(),
      author: req.user,
      retweetFrom: tweetToRetweet.author,
      retweetDate: new Date(),
      retweets: [req.user._id], // add the user who retweeted to the list
      comments: tweetToRetweet.comments,
    });

    // Save the retweet
    const newTweet = await retweetObj.save();

    // Update the original tweet with the list of retweets
    tweetToRetweet.retweets.push(req.user._id);
    await tweetToRetweet.save();

    res.status(201).json({ tweet: newTweet });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
});
//Rest API to Like the comment
//Rest API to Like the comment
router.put("/likecomment", protectedRoute, async (req, res) => {
  const commentId = req.body.commentId;
  const userId = req.user._id;

  try {
    const tweet = await TweetModel.findOneAndUpdate(
      { "comments._id": commentId },
      { $push: { "comments.$.likes": userId } },
      { new: true }
    )
      .populate("author", "_id fullName backgroundwallpaper")
      .populate("retweetFrom", "_id fullName profileImg")
      .populate("comments", "_id commentText commentedBy likes ")
      .populate("comments.commentreplys.replyBy", "_id fullName profileImg")
      .populate("comments.commentedBy", "_id fullName profileImg");

    if (!tweet) {
      return res.status(400).json({ error: "Unable to find tweet or comment" });
    }

    res.status(200).json({ tweet: tweet });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

//Rest API to Unlike the comment
router.put("/unlikecomment", protectedRoute, async (req, res) => {
  const commentId = req.body.commentId;
  const userId = req.user._id;

  try {
    const tweet = await TweetModel.findOneAndUpdate(
      { "comments._id": commentId },
      { $pull: { "comments.$.likes": userId } },
      { new: true }
    )
      .populate("author", "_id fullName backgroundwallpaper")
      .populate("retweetFrom", "_id fullName profileImg")
      .populate("comments", "_id commentText commentedBy likes ")
      .populate("comments.commentreplys.replyBy", "_id fullName profileImg")
      .populate("comments.commentedBy", "_id fullName profileImg");

    if (!tweet) {
      return res.status(400).json({ error: "Unable to find tweet or comment" });
    }

    res.status(200).json({ tweet: tweet });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
// REST API for adding a reply to a comment
router.put("/reply", protectedRoute, async (req, res) => {
  try {
    const { replyText, commentId } = req.body;

    // Check if reply text and comment ID are provided
    if (!replyText || !commentId) {
      return res.status(400).json({ error: "Reply text or CommentID missing" });
    }

    // Create the reply object
    const reply = {
      replyText,
      replyBy: req.user._id,
    };

    // Find the tweet and add the reply to the corresponding comment
    const updatedTweet = await TweetModel.findOneAndUpdate(
      { "comments._id": commentId },
      { $push: { "comments.$.commentreplys": reply } },
      { new: true }
    )
      .populate("comments.commentedBy", "_id fullName profileImg")
      .populate("author", "fullName backgroundwallpaper")
      .populate("comments.commentreplys.replyBy", "_id fullName profileImg")
      .populate("comments.commentText", "likes");

    // Return the updated tweet
    res.json(updatedTweet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// REST API  to delete  a reply from a comment
router.delete("/reply/:replyId", protectedRoute, async (req, res) => {
  try {
    const replyId = req.params.replyId;
    const tweet = await TweetModel.findOneAndUpdate(
      { "comments.commentreplys._id": replyId },
      {
        $pull: {
          "comments.$.commentreplys": { _id: replyId, replyBy: req.user._id },
        },
      },
      { new: true }
    )
      .populate("comments.commentedBy", "_id fullName profileImg")
      .populate("author", "_id fullName backgroundwallpaper")
      .populate("comments", "_id commentText commentedBy likes")
      .populate("comments.commentreplys.replyBy", "_id fullName profileImg")
      .populate("retweetFrom", "_id fullName profileImg");

    if (!tweet) {
      return res.status(404).json({ error: "Reply not found" });
    }

    res.json(tweet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
module.exports = router;
