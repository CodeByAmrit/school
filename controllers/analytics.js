const { getConnection } = require("../models/getConnection");
const { getSchoolLogo, getTotalStudents } = require("./student");

async function getMarksAnalytics(req, res) {
  let connection;
  try {
    connection = await getConnection();
    const teacher_id = req.user._id;
    let targetClass = req.query.class || null;

    // 1. Term-over-Term Class Averages
    let termAvgsQuery = `
      SELECT sp.term, AVG(sp.percentage) AS avg_percentage
      FROM StudentPerformance sp
      JOIN students s ON sp.school_id = s.school_id
      WHERE s.teacher_id = ?
    `;
    const termAvgsParams = [teacher_id];
    if (targetClass) {
      termAvgsQuery += " AND s.class = ?";
      termAvgsParams.push(targetClass);
    }
    termAvgsQuery += " GROUP BY sp.term ORDER BY sp.term ASC";
    const [termAvgs] = await connection.execute(termAvgsQuery, termAvgsParams);

    // 2. Student Distribution (Top: >= 90, Average: 60-89, Needs Attention: < 60)
    let distQuery = `
      SELECT 
        SUM(CASE WHEN avg_student_pct >= 90 THEN 1 ELSE 0 END) as top_performers,
        SUM(CASE WHEN avg_student_pct >= 60 AND avg_student_pct < 90 THEN 1 ELSE 0 END) as average,
        SUM(CASE WHEN avg_student_pct < 60 THEN 1 ELSE 0 END) as needs_attention
      FROM (
        SELECT sp.school_id, AVG(sp.percentage) as avg_student_pct
        FROM StudentPerformance sp
        JOIN students s ON sp.school_id = s.school_id
        WHERE s.teacher_id = ?
        ${targetClass ? " AND s.class = ?" : ""}
        GROUP BY sp.school_id
      ) AS student_aggregates
    `;
    const distParams = targetClass ? [teacher_id, targetClass] : [teacher_id];
    const [distributionResult] = await connection.execute(distQuery, distParams);
    const distribution = distributionResult[0];

    // 3. Weakest Subjects
    let weakestSubjQuery = `
      SELECT subject, AVG(average_percentage) as overall_avg
      FROM SubjectPerformance
      WHERE teacher_id = ?
    `;
    const weakParams = [teacher_id];
    if (targetClass) {
      weakestSubjQuery += " AND class = ?";
      weakParams.push(targetClass);
    }
    weakestSubjQuery += " GROUP BY subject ORDER BY overall_avg ASC LIMIT 5";
    const [weakSubjects] = await connection.execute(weakestSubjQuery, weakParams);

    // 4. Distinct Classes for Filtering Dropdown
    const [classes] = await connection.execute(
      "SELECT DISTINCT class FROM students WHERE teacher_id = ? AND class IS NOT NULL ORDER BY class ASC",
      [teacher_id]
    );

    const school_logo_url = await getSchoolLogo(req, res);
    let user = req.user;
    user.school_logo = school_logo_url;
    
    // Required by navbar.ejs
    const studentsCount = await getTotalStudents(req, res);

    res.render("analytics", {
      user,
      total_students: studentsCount,
      classes: classes.map(c => c.class),
      currentClass: targetClass,
      analytics: {
        termAvgs,
        distribution,
        weakSubjects
      }
    });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).send("Server Error processing Analytics");
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  getMarksAnalytics
};
