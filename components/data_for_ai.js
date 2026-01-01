const express = require("express");
const router = express.Router();
const { getConnection } = require("../models/getConnection");

router.get(
  "/getLowestNStudentsBySubject/:subject_name/:n",
  async (req, res) => {
    try {
      const subjectName = req.params.subject_name;
      const n = parseInt(req.params.n); // Parse n as an integer
      if (isNaN(n) || n <= 0) {
        res
          .status(400)
          .send("Invalid value for n. It must be a positive integer");
        return;
      }
      const connection = await getConnection();

      // Dynamically build the column name based on the subject
      let scoreColumn;
      switch (subjectName.toLowerCase()) {
        case "math":
          scoreColumn = "math_score";
          break;
        case "science":
          scoreColumn = "science_score";
          break;
        case "history":
          scoreColumn = "history_score";
          break;
        case "english":
          scoreColumn = "english_score";
          break;
        default:
          res.status(400).send("Invalid subject name");
          return;
      }

      const query = `SELECT name, ${scoreColumn} AS score FROM student_scores ORDER BY ${scoreColumn} ASC LIMIT ?`;

      const [studentResults] = await connection.execute(query, [n]);

      connection.release();

      const formattedResults = studentResults.map((row) => ({
        name: row.name,
        score: row.score,
      }));

      // YOU: Copy and paste the JSON string of 'formattedResults' to me.
      res.json(formattedResults); // Optional: Send to frontend
    } catch (error) {
      console.error(error);
      res.status(500).send("Error retrieving data");
    }
  },
);

router.get("/getTopNStudentsBySubject/:subject_name/:n", async (req, res) => {
  try {
    const subjectName = req.params.subject_name;
    const n = parseInt(req.params.n); // Parse n as an integer
    if (isNaN(n) || n <= 0) {
      res
        .status(400)
        .send("Invalid value for n. It must be a positive integer");
      return;
    }

    const connection = await getConnection();

    // Dynamically build the column name based on the subject
    let scoreColumn;
    switch (subjectName.toLowerCase()) {
      case "math":
        scoreColumn = "math_score";
        break;
      case "science":
        scoreColumn = "science_score";
        break;
      case "history":
        scoreColumn = "history_score";
        break;
      case "english":
        scoreColumn = "english_score";
        break;
      default:
        res.status(400).send("Invalid subject name");
        return;
    }

    const query = `SELECT name, ${scoreColumn} AS score FROM student_scores ORDER BY ${scoreColumn} DESC LIMIT ?`;

    const [studentResults] = await connection.execute(query, [n]);

    connection.release();

    const formattedResults = studentResults.map((row) => ({
      name: row.name,
      score: row.score,
    }));

    // YOU: Copy and paste the JSON string of 'formattedResults' to me.
    res.json(formattedResults); // Optional: Send to frontend
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving data");
  }
});

router.get("/getAverageScoreBySubject/:subject_name", async (req, res) => {
  try {
    const subjectName = req.params.subject_name;
    const connection = await getConnection();

    // Dynamically build the column name based on the subject
    let scoreColumn;
    switch (subjectName.toLowerCase()) {
      case "math":
        scoreColumn = "math_score";
        break;
      case "science":
        scoreColumn = "science_score";
        break;
      case "history":
        scoreColumn = "history_score";
        break;
      case "english":
        scoreColumn = "english_score";
        break;
      default:
        res.status(400).send("Invalid subject name");
        return;
    }

    const query = `SELECT AVG(${scoreColumn}) AS average_score FROM student_scores`;

    const [averageResult] = await connection.execute(query);

    connection.release();

    const averageScore = averageResult[0].average_score;
    const formattedResults = averageScore; // It's just a number

    // YOU: Tell me the average score. For example: "82.5"
    res.json(formattedResults);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving average score");
  }
});

router.get("/getAllClasses", async (req, res) => {
  try {
    const connection = await getConnection();

    const [classResults] = await connection.execute(
      `SELECT DISTINCT class FROM student_scores`,
    );

    connection.release();

    const formattedResults = classResults.map((row) => row.class); // Extract the class name

    // YOU: Copy and paste the JSON string of 'formattedResults' to me.
    res.json(formattedResults); // Optional: Send to frontend
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving class data");
  }
});

router.get("/getStudentByClass/:class_name", async (req, res) => {
  try {
    const className = req.params.class_name;
    const connection = await getConnection();

    const [studentResults] = await connection.execute(
      `SELECT student_id, name, class, math_score, science_score, history_score FROM student_scores WHERE class = ?`,
      [className],
    );

    connection.release();

    const formattedResults = studentResults.map((row) => ({
      student_id: row.student_id,
      name: row.name,
      class: row.class,
      math_score: row.math_score,
      science_score: row.science_score,
      history_score: row.history_score,
    }));

    // YOU: Copy and paste the JSON string of 'formattedResults' to me.
    res.json(formattedResults); // Optional: Send to frontend
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving student data");
  }
});

router.get("/getStudentMarks/:student_id", async (req, res) => {
  try {
    const studentId = req.params.student_id;
    const connection = await getConnection();

    const [studentResults] = await connection.execute(
      `SELECT math_score, science_score, history_score, english_score FROM student_scores WHERE student_id = ?`,
      [studentId],
    );

    connection.release();

    if (studentResults.length === 0) {
      res.status(404).send("Student not found");
      return;
    }

    const row = studentResults[0]; // Only expecting one result
    const formattedResults = {
      math_score: row.math_score,
      science_score: row.science_score,
      history_score: row.history_score,
      english_score: row.english_score,
    };

    // YOU: Copy and paste the JSON string of 'formattedResults' to me.
    res.json(formattedResults); // Optional: Send to frontend
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving student data");
  }
});

router.get("/getStudentWithName/:name", async (req, res) => {
  try {
    const name = req.params.name;
    const connection = await getConnection();

    const [studentResults] = await connection.execute(
      `SELECT student_id, name, class, math_score, science_score, history_score FROM student_scores WHERE name = ?`,
      [name],
    );

    connection.release();

    const formattedResults = studentResults.map((row) => ({
      student_id: row.student_id,
      name: row.name,
      class: row.class,
      math_score: row.math_score,
      science_score: row.science_score,
      history_score: row.history_score,
    }));

    // YOU: Copy and paste the JSON string of 'formattedResults' to me.
    res.json(formattedResults); // Optional: Send to frontend
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving student data");
  }
});

router.get("/getStudentAll", async (req, res) => {
  try {
    const connection = await getConnection();

    const [studentResults] = await connection.execute(
      `SELECT student_id, name, class, math_score, science_score, history_score FROM student_scores`, // Explicitly list columns!
    );

    connection.release();

    const formattedResults = studentResults.map((row) => ({
      student_id: row.student_id,
      name: row.name,
      class: row.class,
      math_score: row.math_score,
      science_score: row.science_score,
      history_score: row.history_score,
    }));

    // YOU: Copy and paste the JSON string of 'formattedResults' to me.
    res.json(formattedResults); // Optional: Send to frontend
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving student data");
  }
});

module.exports = router;
