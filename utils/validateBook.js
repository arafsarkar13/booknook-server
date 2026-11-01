export const CATEGORIES = ["Fiction", "Science", "History", "Kids", "Others"];

// Checks the fields sent by the Add Book and Edit Book forms.
// Returns error  when something is wrong, or  data  with clean values.
export function validateBook(body) {
  const { title, author, category, image, description, totalCopies } = body;

  const texts = [title, author, image, description];
  if (!texts.every((value) => typeof value === "string" && value.trim())) {
    return { error: "Please fill in every field." };
  }
  if (!CATEGORIES.includes(category)) {
    return { error: "Please choose a valid category." };
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
