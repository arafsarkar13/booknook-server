import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

const CATEGORIES = ["Fiction", "Science", "History", "Kids", "Others"];

router.get("/", async (req, res, next) => {
  try {
    const db = await getDb();

    const filter = {};
    if (req.query.addedBy) {
      filter["addedBy.email"] = req.query.addedBy;
    }

    let cursor = db.collection("books").find(filter).sort({ createdAt: -1 });

    const limit = Number(req.query.limit);
    if (limit > 0) {
      cursor = cursor.limit(Math.min(limit, 100));
    }

    res.json(await cursor.toArray());
  } catch (error) {
    next(error);
  }
});

// GET /books/:id  (needs login)
router.get("/:id", verifyToken, async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ message: "That book address is not valid." });
    }

    const db = await getDb();
    const book = await db
      .collection("books")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }
    res.json(book);
  } catch (error) {
    next(error);
  }
});

// POST /books  (needs login)
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { title, author, category, image, description, totalCopies } =
      req.body;

    // Check every field before saving anything
    if (
      ![title, author, image, description].every(
        (v) => typeof v === "string" && v.trim(),
      )
    ) {
      return res.status(400).json({ message: "Please fill in every field." });
    }
    if (!CATEGORIES.includes(category)) {
      return res
        .status(400)
        .json({ message: "Please choose a valid category." });
    }
    const copies = Number(totalCopies);
    if (!Number.isInteger(copies) || copies < 1 || copies > 100) {
      return res.status(400).json({
        message: "Total copies must be a whole number from 1 to 100.",
      });
    }

    const db = await getDb();
    const book = {
      title: title.trim(),
      author: author.trim(),
      category,
      image: image.trim(),
      description: description.trim(),
      totalCopies: copies,
      availableCopies: copies,
      // The owner comes from the verified token, never from the request body
      addedBy: { name: req.user.name, email: req.user.email },
      createdAt: new Date(),
    };

    const result = await db.collection("books").insertOne(book);
    res.status(201).json({
      message: "Book added successfully.",
      insertedId: result.insertedId,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
