const { getConnection } = require("../models/getConnection");
const { getTotalStudents, getFileCount, getSchoolLogo } = require("./student");

// API: Get total global students and teachers count
exports.getTotalStudentsCounts = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [[counts]] = await connection.execute(`
      SELECT
        (SELECT COUNT(*) FROM students) AS total_students,
        (SELECT COUNT(*) FROM teacher) AS total_teachers
    `);
    res.json(counts);
  } catch (error) {
    console.error("Error fetching total counts:", error);
    res.status(500).json({
      status: "error",
      message: error.sqlMessage || "Internal Server Error",
    });
  } finally {
    if (connection) connection.release();
  }
};

// API: Get male/female student count per class for a session
exports.getStudentsCountBySession = async (req, res) => {
  const { session } = req.params;
  const teacher_id = req.user._id;

  if (!session) {
    return res.status(400).json({ error: "Session parameter is required" });
  }

  const query = `
      SELECT 
          class,
          COUNT(CASE WHEN gender = 'Male' THEN 1 END) AS male_count,
          COUNT(CASE WHEN gender = 'Female' THEN 1 END) AS female_count
      FROM students
      WHERE session = ?
      and teacher_id = ?
      GROUP BY class;
  `;
  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.query(query, [session, teacher_id]);
    res.status(200).json({ data: results });
  } catch (error) {
    console.error("Error fetching student count:", error);
    res.status(500).json({ error: "An error occurred while fetching student count" });
  } finally {
    if (connection) connection.release();
  }
};

// API: Get chart data representing classes
exports.getChartData = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(`
          SELECT class AS label, COUNT(*) AS value
          FROM students
          GROUP BY class
      `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching chart data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
};

// View: Get Dashboard page
exports.getDashboardView = async (req, res) => {
  let connection;
  try {
    const school_logo_url = await getSchoolLogo(req, res);
    let user = req.user;
    user.school_logo = school_logo_url;

    const teacherId = req.user._id;
    connection = await getConnection();
    
    const studentsCount = await getTotalStudents(req, res);
    const count_Files = await getFileCount(req, res);

    const [performanceData] = await connection.execute(
      `SELECT subject, AVG(average_percentage) as 'average_percentage'
       FROM SubjectPerformance
       WHERE teacher_id = ?
       GROUP BY subject`,
      [teacherId],
    );

    const nonce = res.locals.nonce;

    res.render("index", {
      nonce,
      total_students: studentsCount,
      files_count: count_Files,
      user,
      performanceData: performanceData,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).send("Server Error");
  } finally {
    if (connection) connection.release();
  }
};

// View: AI Chat Page
exports.getAiChatView = async (req, res) => {
  try {
    const school_logo_url = await getSchoolLogo(req, res);
    let user = req.user;
    user.school_logo = school_logo_url;

    const studentsCount = await getTotalStudents(req, res);
    const count_Files = await getFileCount(req, res);
    const nonce = res.locals.nonce;

    res.render("google_AI", {
      nonce,
      total_students: studentsCount,
      files_count: count_Files,
      user,
    });
  } catch (error) {
    console.error("Error fetching AI view data:", error);
    res.status(500).send("Server Error");
  }
};
