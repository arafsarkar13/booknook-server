import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";

const router = Router();

const BORROW_DAYS = 7;

// POST /borrows  (login is checked before this route runs)
router.post("/", async (req, res, next) => {
  try {
    const { bookId } = req.body;
    if (!ObjectId.isValid(bookId)) {
      return res
        .status(400)
        .json({ message: "That book address is not valid." });
    }

    const db = await getDb();
    const books = db.collection("books");
    const borrows = db.collection("borrows");

    const book = await books.findOne({ _id: new ObjectId(bookId) });
    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }
    if (book.availableCopies < 1) {
      return res.status(409).json({ message: "Not Available" });
    }

    const borrowDate = new Date();
    const returnDate = new Date(
      borrowDate.getTime() + BORROW_DAYS * 24 * 60 * 60 * 1000,
    );

    // save the borrow. The unique rule rejects a second borrow of the same book.
    let insertedId;
    try {
      const result = await borrows.insertOne({
        bookId: String(book._id),
        bookTitle: book.title,
        bookImage: book.image,
        userName: req.user.name,
        userEmail: req.user.email,
        borrowDate,
        returnDate,
      });
      insertedId = result.insertedId;
    } catch (error) {
      if (error.code === 11000) {
        return res
          .status(409)
          .json({ message: "You have already borrowed this book." });
      }
      throw error;
    }

    // take one copy off the shelf, but only if one is still left
    const updated = await books.findOneAndUpdate(
      { _id: book._id, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
    );
    if (!updated) {
      // Someone else took the last copy a moment ago, so undo record
      await borrows.deleteOne({ _id: insertedId });
      return res.status(409).json({ message: "Not Available" });
    }

    res.status(201).json({
      message: "Book borrowed successfully. Please return it within 7 days.",
      returnDate,
    });
  } catch (error) {
    next(error);
  }
});

// GET /borrows  (only the logged in user's borrows, newest first)
router.get("/", async (req, res, next) => {
  try {
    const db = await getDb();
    const items = await db
      .collection("borrows")
      .find({ userEmail: req.user.email })
      .sort({ borrowDate: -1 })
      .toArray();

    res.json(items);
  } catch (error) {
    next(error);
  }
});

// DELETE /borrows/:id  (return a book)
router.delete("/:id", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ message: "That borrow address is not valid." });
    }

    const db = await getDb();
    const borrows = db.collection("borrows");
    const borrow = await borrows.findOne({ _id: new ObjectId(req.params.id) });

    if (!borrow) {
      return res.status(404).json({ message: "Borrow record not found." });
    }
    if (borrow.userEmail !== req.user.email) {
      return res
        .status(403)
        .json({ message: "You can only return books that you borrowed." });
    }

    // Delete first, and only continue if WE really deleted it
    const result = await borrows.deleteOne({
      _id: borrow._id,
      userEmail: req.user.email,
    });
    if (result.deletedCount !== 1) {
      return res
        .status(404)
        .json({ message: "This book was already returned." });
    }

    // Put the copy back on the shelf (only once)
    await db
      .collection("books")
      .updateOne(
        { _id: new ObjectId(borrow.bookId) },
        { $inc: { availableCopies: 1 } },
      );

    res.json({ message: "Book returned successfully. Thank you!" });
  } catch (error) {
    next(error);
  }
});

export default router;
