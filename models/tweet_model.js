const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const tweetSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  likes: [
    {
      type: ObjectId,
      ref: "UserModel",
    },
  ],
  comments: [
    {
      commentText: String,
      commentedBy: { type: ObjectId, ref: "UserModel" },
      likes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      commentreplys: [
        {
          replyText: String,
          replyBy: { type: ObjectId, ref: "UserModel" },
        },
      ],
    },
  ],

  image: {
    type: String,
    required: true,
  },

  author: { type: ObjectId, ref: "UserModel" },
  date: { type: Date, default: () => new Date() },
  //retweet
  retweetFrom: { type: ObjectId, ref: "UserModel" },
  retweetDate: [{ type: Date, default: () => new Date() }],
  retweets: [{ type: ObjectId, ref: "UserModel" }],
});
const TweetModel = mongoose.model("TweetModel", tweetSchema);
module.exports = TweetModel;
