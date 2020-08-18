const router = require("express").Router();
const { getSeats, bookSeat,deleteSeat,updateUser } = require("./handlers");

router.get("/api/seat-availability", getSeats);
router.post("/api/book-seat", bookSeat);
router.delete("/api/delete-booking", deleteSeat)
router.put("/api/update-user", updateUser)

module.exports = router;
