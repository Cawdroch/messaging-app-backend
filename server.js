import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Cors from "cors";
import Pusher from "pusher";

// App config

const app = express();
const port = process.env.PORT || 9000;
const connection_url =
  "mongodb+srv://cawdroch:oskSBOPYMc2Zh7N5@message-app-mern-cluste.q3roc.mongodb.net/?retryWrites=true&w=majority&appName=message-app-mern-cluster";

const pusher = new Pusher({
  appId: "1848056",
  key: "b9a0160120f08368632b",
  secret: "2a01a8da6d56a7166dff",
  cluster: "eu",
  useTLS: true,
});

// Middleware

app.use(express.json());
app.use(Cors());

// DB Config

mongoose.connect(connection_url, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

// API Endpoints

const db = mongoose.connection;
db.once("open", () => {
  console.log("DB Connected");
  const msgCollection = db.collection("messagingmessages");
  const changeStream = msgCollection.watch();
  changeStream.on("change", (change) => {
    console.log(change);
    if ((change.operationType === "insert")) {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        recieved: messageDetails.recieved,
      });
    } else {
      console.log("Error triggering pusher");
    }
  });
});

app.get("/", (req, res) => res.status(200).send("Hello TheWebDev"));

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) res.status(500).send(err);
    else res.status(201).send(data);
  });
});

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

// Listener

app.listen(port, () => console.log(`Listening on localhost: ${port}`));
