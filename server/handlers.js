"use strict";
const { MongoClient } = require("mongodb");
const assert = require("assert");

require("dotenv").config();
const { MONGO_URI } = process.env;

const DB_NAME = "concordia";

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const getSeats = async (req, res) => {
  let seats = {};
  try {
    const client = await MongoClient(MONGO_URI, options);
    await client.connect();
    const db = client.db(DB_NAME);
    const seatsArray = await db.collection("seats").find().toArray();
    seatsArray.forEach((seat) => {
      seats[seat._id] = {
        price: seat.price,
        isBooked: seat.isBooked,
      };
    });
    client.close();
    res.json({
      seats: seats,
      numOfRows: 8,
      seatsPerRow: 12,
    });
  } catch (err) {
    console.log(err.stack);
  }
};

module.exports = { getSeats };
