const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const userRoute = require("./routes/user_route");
const tweetRoute = require("./routes/tweet_route");
const fileRoute = require("./routes/file_route");
const OtherUserProfileRoute = require("./routes/otheruserprofile_route");

const { MONGOBD_URL } = require("./config");

const port = process.env.PORT || 4000;
const baseUrl = process.env.BASE_URL;

global.__basedir = __dirname; //please add it in notes
mongoose.set("strictQuery", true);
mongoose.connect(MONGOBD_URL);
mongoose.connection.on("connected", () => {
  console.log("Data base connected");
});

mongoose.connection.on("error", (error) => {
  console.log("DataBase Not connected");
});

app.use(cors());
app.use(express.json());
app.use("/", userRoute);
app.use("/", tweetRoute);
app.use("/", fileRoute);
app.use("/", OtherUserProfileRoute);

app.listen(port, () => {
  console.log(`Server started at ${baseUrl}:${port}`);
});
