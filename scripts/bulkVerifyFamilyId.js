const axios = require("axios");
const { query, pool } = require("../models/getConnection");
const fs = require("fs");
require("dotenv").config();

async function bulkVerify() {
  console.log("🚀 Starting Bulk Family ID Verification...");

  let newlyVerified = [];
  let failedVerification = [];
  let errors = [];

  try {
    const [students] = await query(
      "SELECT school_id, name, father_name, mother_name, family_id FROM students WHERE family_id IS NOT NULL AND family_id != '' AND family_id_verified = 0"
    );

    console.log(`📊 Found ${students.length} students to verify.`);

    for (let i = 0; i < students.length; i++) {
        const student = students[i];
        try {
            const response = await axios.get(
                `https://hrylabour.gov.in/welfare/worker/getMembers/${student.family_id.toLowerCase()}`,
                { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 10000 }
            );

            if (response.data && response.data.status === "success" && Array.isArray(response.data.result)) {
                const members = response.data.result.map(m => m.text.toUpperCase());
                
                const sName = student.name.toUpperCase();
                const fName = student.father_name.toUpperCase();
                const mName = student.mother_name.toUpperCase();

                const studentMatched = members.some(m => m.includes(sName) || sName.includes(m));
                const fatherMatched = members.some(m => m.includes(fName) || fName.includes(m));
                const motherMatched = members.some(m => m.includes(mName) || mName.includes(m));

                if (studentMatched && fatherMatched && motherMatched) {
                    await query("UPDATE students SET family_id_verified = 1 WHERE school_id = ?", [student.school_id]);
                    newlyVerified.push({ name: student.name, family_id: student.family_id });
                } else {
                    failedVerification.push({ name: student.name, family_id: student.family_id, reason: "Names did not match" });
                }
            } else {
                failedVerification.push({ name: student.name, family_id: student.family_id, reason: "ID not found" });
            }
        } catch (err) {
            errors.push({ name: student.name, family_id: student.family_id, error: err.message });
        }
        if (i % 10 === 0) console.log(`Progress: ${i}/${students.length}`);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const report = {
        summary: {
            total: students.length,
            verified: newlyVerified.length,
            failed: failedVerification.length,
            errors: errors.length
        },
        newlyVerified,
        failedVerification,
        errors
    };

    fs.writeFileSync("scripts/verification_report.json", JSON.stringify(report, null, 2));
    console.log("✅ Bulk Verification Done. Report saved to scripts/verification_report.json");

  } catch (err) {
    console.error("Critical error:", err);
  } finally {
    await pool.end();
  }
}

bulkVerify();
