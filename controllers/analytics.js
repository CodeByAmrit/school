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
      WHERE teacher_id = ? AND subject NOT LIKE '%DRAWING%'
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

async function getIndividualAnalytics(req, res) {
  let connection;
  try {
    const studentId = req.params.id;
    const teacherId = req.user._id;
    connection = await getConnection();

    // 1. Verify Ownership & Get Basic Info
    const [studentRows] = await connection.execute(
      "SELECT school_id, name, father_name, class, session, profile_status FROM students WHERE school_id = ? AND teacher_id = ?",
      [studentId, teacherId]
    );

    if (studentRows.length === 0) {
      return res.status(404).send("Student not found or access denied.");
    }
    const student = studentRows[0];

    // 2. Student Term Progress (Term over Term percentage)
    const [personalTrend] = await connection.execute(
      `SELECT term, percentage
       FROM StudentPerformance
       WHERE school_id = ?
       ORDER BY term ASC`,
      [studentId]
    );

    // 3. Class Benchmarks (Avg per term for student's exact class)
    const [classTrend] = await connection.execute(
      `SELECT sp.term, AVG(sp.percentage) as avg_percentage
       FROM StudentPerformance sp
       JOIN students s ON sp.school_id = s.school_id
       WHERE s.class = ? AND s.teacher_id = ? AND s.session = ?
       GROUP BY sp.term
       ORDER BY sp.term ASC`,
      [student.class, teacherId, student.session]
    );

    // 4. Subject Radar (True Top-Down Curriculum Mapping via Config)
    const [subjectRadarRaw] = await connection.execute(
      `SELECT 
          sc.subject_name as subject,
          (
             SELECT AVG(
                (CASE WHEN sm_inner.marks REGEXP '^[0-9]+$' THEN CAST(sm_inner.marks AS DECIMAL(5,2)) ELSE 0 END)
                / 
                NULLIF((CASE WHEN mm_inner.max_marks REGEXP '^[0-9]+$' THEN CAST(mm_inner.max_marks AS DECIMAL(5,2)) ELSE 0 END), 0)
             ) * 100
             FROM student_marks sm_inner
             JOIN maximum_marks mm_inner ON mm_inner.subject = sm_inner.subject AND mm_inner.term = sm_inner.term AND mm_inner.class = ?
             WHERE sm_inner.student_id = ? AND sm_inner.subject = sc.subject_name AND sm_inner.marks IS NOT NULL AND sm_inner.marks != '' AND sm_inner.marks != 'NA' AND sm_inner.marks != 'AB'
          ) as student_subject_avg,
          (
            SELECT AVG(overall_avg.average_percentage)
            FROM SubjectPerformance overall_avg 
            WHERE overall_avg.class = ? AND overall_avg.teacher_id = ? AND overall_avg.subject = sc.subject_name
          ) as class_subject_avg
       FROM subject_config sc
       WHERE sc.class_name = ? AND sc.teacher_id = ? AND sc.subject_name NOT LIKE '%DRAWING%'`,
      [student.class, studentId, student.class, teacherId, student.class, teacherId]
    );

    const subjectRadar = subjectRadarRaw.map(s => ({
      subject: s.subject,
      student_subject_avg: s.student_subject_avg || 0,
      class_subject_avg: s.class_subject_avg || 0
    }));

    // 5. Calculate Absolute Class Rank & Highest Score
    const [classRanks] = await connection.execute(
      `SELECT sp.school_id, AVG(sp.percentage) as avg_pct
       FROM StudentPerformance sp
       JOIN students s ON sp.school_id = s.school_id
       WHERE s.class = ? AND s.teacher_id = ? AND s.session = ?
       GROUP BY sp.school_id
       ORDER BY avg_pct DESC`,
      [student.class, teacherId, student.session]
    );

    let rank = "N/A";
    let highestScore = 0;
    if (classRanks.length > 0) {
      highestScore = parseFloat(classRanks[0].avg_pct).toFixed(2);
      const studentRankIndex = classRanks.findIndex(r => r.school_id.toString() === studentId.toString());
      if (studentRankIndex !== -1) {
        rank = studentRankIndex + 1; // 1-indexed
      }
    }

    const school_logo_url = await getSchoolLogo(req, res);
    let user = req.user;
    user.school_logo = school_logo_url;
    
    // Required by navbar.ejs
    const studentsCount = await getTotalStudents(req, res);

    res.render("student_analytics", {
      user,
      total_students: studentsCount,
      student,
      analytics: {
        personalTrend,
        classTrend,
        subjectRadar,
        rank,
        highestScore,
        totalInClass: classRanks.length
      }
    });

  } catch (error) {
    console.error("Error fetching individual analytics:", error);
    res.status(500).send("Server Error");
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  getMarksAnalytics,
  getIndividualAnalytics
};
