import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { validateBook } from "../utils/validateBook.js";

const router = Router();

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
    const { error, data } = validateBook(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const db = await getDb();
    const book = {
      ...data,
      availableCopies: data.totalCopies,
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

// PATCH /books/:id  (needs login, owner only)
router.patch("/:id", verifyToken, async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ message: "That book address is not valid." });
    }

    const { error, data } = validateBook(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const db = await getDb();
    const books = db.collection("books");
    const book = await books.findOne({ _id: new ObjectId(req.params.id) });

    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }
    if (book.addedBy.email !== req.user.email) {
      return res
        .status(403)
        .json({ message: "You can only edit books that you added." });
    }

    // Copies that are out right now must stay out, so total cannot drop below them
    const borrowedNow = book.totalCopies - book.availableCopies;
    if (data.totalCopies < borrowedNow) {
      return res.status(400).json({
        message: `${borrowedNow} copies are borrowed right now, so total copies cannot be lower than that.`,
      });
    }

    await books.updateOne(
      { _id: book._id },
      {
        $set: {
          ...data,
          availableCopies: data.totalCopies - borrowedNow,
          updatedAt: new Date(),
        },
      },
    );
    res.json({ message: "Book updated successfully." });
  } catch (error) {
    next(error);
  }
});

// DELETE /books/:id  (needs login, owner only)
router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ message: "That book address is not valid." });
    }

    const db = await getDb();
    const books = db.collection("books");
    const book = await books.findOne({ _id: new ObjectId(req.params.id) });

    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }
    if (book.addedBy.email !== req.user.email) {
      return res
        .status(403)
        .json({ message: "You can only delete books that you added." });
    }

    // A borrow record exists only while a book is out, so any record means it is borrowed
    const activeBorrows = await db
      .collection("borrows")
      .countDocuments({ bookId: req.params.id });
    if (activeBorrows > 0) {
      return res.status(409).json({
        message: "This book is currently borrowed, so it cannot be deleted.",
      });
    }

    await books.deleteOne({ _id: book._id });
    res.json({ message: "Book deleted successfully." });
  } catch (error) {
    next(error);
  }
});

export default router;
