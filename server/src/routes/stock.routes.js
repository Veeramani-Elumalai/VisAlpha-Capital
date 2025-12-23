import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Stock Route Working");
});

export default router;
