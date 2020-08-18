const { MongoClient } = require("mongodb");
const assert = require("assert");

require("dotenv").config();
const { MONGO_URI } = process.env;

// Code that is generating the seats.
// ----------------------------------
const NUM_OF_ROWS = 8;
const SEATS_PER_ROW = 12;

const seats = {};
const row = ["A", "B", "C", "D", "E", "F", "G", "H"];
for (let r = 0; r < row.length; r++) {
  for (let s = 1; s <= SEATS_PER_ROW; s++) {
    seats[`${row[r]}-${s}`] = {
      price: 225,
      isBooked: false,
    };
  }
}

const getRowName = (rowIndex) => {
  return String.fromCharCode(65 + rowIndex);
};

const randomlyBookSeats = (num) => {
  const bookedSeats = {};

  while (num > 0) {
    const row = Math.floor(Math.random() * NUM_OF_ROWS);
    const seat = Math.floor(Math.random() * SEATS_PER_ROW);

    const seatId = `${getRowName(row)}-${seat + 1}`;

    bookedSeats[seatId] = true;

    num--;
  }

  return bookedSeats;
};

// ----------------------------------

const DB_NAME = "concordia";

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const batchImport = async () => {
  const seatsArray = Object.keys(seats).map((seat) => ({
    _id: seat,
    ...seats[seat],
  }));
  try {
    const client = await MongoClient(MONGO_URI, options);
    await client.connect();
    const db = client.db(DB_NAME);
    const response = await db.collection("seats").insertMany(seatsArray);
    assert.equal(seatsArray.length, response.insertedCount);
    client.close();
  } catch (err) {
    console.log(err.stack);
  }
};

const updateBookedSeats = async () => {
  const bookedSeats = randomlyBookSeats(30);
  console.log(bookedSeats);
  try {
    const client = await MongoClient(MONGO_URI, options);
    await client.connect();
    const newValues = {
      $set: { isBooked: true },
    };
    const db = client.db(DB_NAME);
    const keys = Object.keys(bookedSeats);
    for (const _id of keys) {
      await db.collection("seats").updateOne({ _id }, newValues);
    }

    //assert.equal(seatsArray.length, response.insertedCount);
    client.close();
  } catch (err) {
    console.log(err.stack);
  }
};

updateBookedSeats();
