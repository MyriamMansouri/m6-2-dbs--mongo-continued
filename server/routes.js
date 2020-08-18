const router = require("express").Router();
const { getSeats, bookSeat } = require("./handlers");

router.get("/api/seat-availability", getSeats);
router.post("/api/book-seat", bookSeat);

module.exports = router;
