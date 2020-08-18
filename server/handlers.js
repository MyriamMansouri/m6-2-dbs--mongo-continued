"use strict";
const { MongoClient } = require("mongodb");
const assert = require("assert");
const { stack } = require("./routes");

require("dotenv").config();
const { MONGO_URI } = process.env;

const DB_NAME = "concordia";

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

let state = {
  seats: {},
};

const getSeats = async (req, res) => {
  const seats = {};
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

    state.seats = seats;

    client.close();
    res.json({
      seats,
      numOfRows: 8,
      seatsPerRow: 12,
    });
  } catch (err) {
    console.log(err.stack);
    return res.status(500).json({
      message: "An unknown error has occurred. Please reload the page",
    });
  }
};

const bookSeat = async (req, res) => {
  let lastBookingAttemptSucceeded = false;
  const { seatId, creditCard, expiration, fullName, email } = req.body;

  if (!creditCard || !expiration) {
    return res.status(400).json({
      status: 400,
      message: "Please provide credit card information!",
    });
  }

  if (lastBookingAttemptSucceeded) {
    lastBookingAttemptSucceeded = !lastBookingAttemptSucceeded;

    return res.status(500).json({
      message: "An unknown error has occurred. Please try your request again.",
    });
  }

  lastBookingAttemptSucceeded = !lastBookingAttemptSucceeded;

  try {
    const client = await MongoClient(MONGO_URI, options);
    await client.connect();
    const db = client.db(DB_NAME);

    if (!state.seats[seatId].isBooked) {
      await db
        .collection("seats")
        .updateOne({ _id: seatId }, { $set: { isBooked: true } });

      const user = await db.collection("users").findOne({ email });

      if (user) {
        const response = await db.collection("users").updateOne(
          { email },
          {
            $set: {
              creditCard,
              expiration,
              seats: { ...user.seats, [seatId]: true },
            },
          }
        );
        assert.equal(
          1,
          response.modifiedCount,
          "Booking has not been modified"
        );
      } else {
        const response = await db.collection("users").insertOne({
          fullName,
          email,
          creditCard,
          expiration,
          seats: { [seatId]: true },
        });
        assert.equal(
          1,
          response.insertedCount,
          "User couldn't be added to database"
        );
      }
      res.status(200).json({
        status: 200,
        success: true,
      });
    } else {
      res.status(400).json({
        message: "This seat has already been booked!",
      });
    }

    client.close();
  } catch (err) {
    console.log(err.stack);
    res.status(400).json({
      message: "An unknown error has occurred. Please try your request again.",
    });
  }
};

const deleteSeat = async (req, res) => {
  const { email, seatId } = req.body;
  try {
    const client = await MongoClient(MONGO_URI, options);
    await client.connect();
    const db = client.db(DB_NAME);

    const user = await db.collection("users").findOne({ email });

    if (user && user.seats[seatId]) {
      await db
        .collection("seats")
        .updateOne({ _id: seatId }, { $set: { isBooked: false } });

      const seatsCopy = user.seats;
      delete seatsCopy[seatId];
      await db
        .collection("users")
        .updateOne({ email }, { $set: { seats: seatsCopy } });

      res.status(200).json({
        status: 200,
        success: true,
      });
    } else {
      res.status(400).json({
        status: 400,
        message: "booking not in database",
      });
    }

    client.close();
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({
      message: "An unknown error has occurred. Please try your request again.",
    });
  }
};

const updateUser = async (req, res) => {
  const { email, fullName, newEmail } = req.body;

  try {
    const client = await MongoClient(MONGO_URI, options);
    await client.connect();
    const db = client.db(DB_NAME);
    const user = await db.collection("users").findOne({ email });

    if (user) {
      if (fullName)
        await db
          .collection("users")
          .updateOne({ email }, { $set: { fullName } });
      if (newEmail)
        await db
          .collection("users")
          .updateOne({ email }, { $set: { email: newEmail } });

      res.status(200).json({
        status: 200,
        success: true,
      });
    } else {
      res.status(400).json({
        status: 400,
        message: "user not in database",
      });
    }

    client.close();
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({
      message: "An unknown error has occurred. Please try your request again.",
    });
  }
};
module.exports = { getSeats, bookSeat, deleteSeat, updateUser };
