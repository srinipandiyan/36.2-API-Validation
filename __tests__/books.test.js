// /** Testing books routes and JSONSchema validataion */

process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

//Sample book isbn data;
let sampleBookIsbn;

beforeEach(async () => {
  //Sample book added to database before each test
  const result = await db.query(`
    INSERT INTO books (
      isbn,
      amazon_url,
      author,
      language,
      pages,
      publisher,
      title,
      year)
    VALUES(
      '123432122',
      'https://amazon.com/taco',
      'Elie',
      'English',
      100,
      'Nothing publishers',
      'my first book',
      2008)
      RETURNING isbn`);
  sampleBookIsbn = result.rows[0].isbn;
});

//Test suite for POST request /books route
describe("POST /books", function () {
  test("Creates a new book", async function () {
    const response = await request(app)
      .post(`/books`)
      .send({
        isbn: '32794782',
        amazon_url: "https://taco.com",
        author: "mctest",
        language: "english",
        pages: 1000,
        publisher: "yeah right",
        title: "amazing times",
        year: 2000
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
  });

  test("Prevents creating book without required title", async function () {
    const response = await request(app)
      .post(`/books`)
      .send({ year: 2000 });

    expect(response.statusCode).toBe(400);
  });
});

//Test suite for the GET request /books route
describe("GET /books", function () {
  test("Gets a list of 1 book", async function () {
    const response = await request(app).get(`/books`);
    const books = response.body.books;

    expect(books).toHaveLength(1);
    expect(books[0]).toHaveProperty("isbn");
    expect(books[0]).toHaveProperty("amazon_url");
  });
});

//Test suite for the GET request /books/:isbn route
describe("GET /books/:isbn", function () {
  test("Gets a single book", async function () {
    const response = await request(app).get(`/books/${sampleBookIsbn}`);

    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.isbn).toBe(sampleBookIsbn);
  });

  test("Responds with 404 if can't find book in question", async function () {
    const response = await request(app).get(`/books/999`);

    expect(response.statusCode).toBe(404);
  });
});

//Test suite for the PUT request /books/:id route
describe("PUT /books/:id", function () {
  test("Updates a single book", async function () {
    const response = await request(app)
      .put(`/books/${sampleBookIsbn}`)
      .send({
        amazon_url: "https://taco.com",
        author: "mctest",
        language: "english",
        pages: 1000,
        publisher: "yeah right",
        title: "UPDATED BOOK",
        year: 2000
      });

    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.title).toBe("UPDATED BOOK");
  });

  test("Prevents a bad book update", async function () {
    const response = await request(app)
      .put(`/books/${sampleBookIsbn}`)
      .send({
        isbn: "32794782",
        badField: "DO NOT ADD ME!",
        amazon_url: "https://taco.com",
        author: "mctest",
        language: "english",
        pages: 1000,
        publisher: "yeah right",
        title: "UPDATED BOOK",
        year: 2000
      });

    expect(response.statusCode).toBe(400);
  });

  test("Responds 404 if can't find book in question", async function () {
    //Deletes sample book
    await request(app).delete(`/books/${sampleBookIsbn}`);
    const response = await request(app).delete(`/books/${sampleBookIsbn}`);

    expect(response.statusCode).toBe(404);
  });
});

//Test suite for the DELETE request /books/:id endpoint
describe("DELETE /books/:id", function () {
  test("Deletes a single a book", async function () {
    const response = await request(app).delete(`/books/${sampleBookIsbn}`);

    expect(response.body).toEqual({ message: "Book deleted" });
  });
});

afterEach(async function () {
  //Cleans up the database between tests
  await db.query("DELETE FROM BOOKS");
});

afterAll(async function () {
  //Closes the database connection after all tests are run
  await db.end();
});