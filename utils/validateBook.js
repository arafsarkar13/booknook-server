export const CATEGORIES = ["Fiction", "Science", "History", "Kids", "Others"];

export function validateBook(body) {
  const { title, author, category, image, description, totalCopies } = body;

  const texts = [title, author, image, description];
  if (!texts.every((value) => typeof value === "string" && value.trim())) {
    return { error: "Please fill in every field." };
  }
  if (!CATEGORIES.includes(category)) {
    return { error: "Please choose a valid category." };
  }
  if (title.trim().length > 120 || author.trim().length > 80) {
    return { error: "Title or author name is too long." };
  }
  if (description.trim().length > 500) {
    return { error: "Description must be 500 characters or less." };
  }
  try {
    const url = new URL(image.trim());
    if (url.protocol !== "https:") throw new Error("not https");
  } catch {
    return { error: "Please upload a valid book image." };
  }
  const copies = Number(totalCopies);
  if (!Number.isInteger(copies) || copies < 1 || copies > 100) {
    return { error: "Total copies must be a whole number from 1 to 100." };
  }

  return {
    data: {
      title: title.trim(),
      author: author.trim(),
      category,
      image: image.trim(),
      description: description.trim(),
      totalCopies: copies,
    },
  };
}
