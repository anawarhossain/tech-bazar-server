const dns = require("node:dns");
dns.setServers(["1.1.1.1", "1.0.0.1"]);

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
dotenv.config();

const uri = process.env.MONGODB_URI;

const app = express();
const PORT = process.env.PORT;

app.use(
  cors({
    credentials: true,
    origin: [process.env.CLIENT_URL],
  }),
);
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("tech-bazaar");
    const subcriptionCollection = db.collection("subcription");
    const userCollection = db.collection("user");

    app.post("/api/subcription", async (req, res) => {
      const { sessionId, userId, priceId } = req.body;

      // 1. Check if this session has already been processed
      const existingSub = await subcriptionCollection.findOne({ sessionId });
      if (existingSub) {
        return res.json({ message: "Subscription already processed" });
      }

      // if not inserted insert it
      await subcriptionCollection.insertOne({
        sessionId,
        userId,
        priceId,
      });
      // update user role
      await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { plan: "pro" } },
      );

      res.json({ message: "Payment successful" });
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running fine!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
