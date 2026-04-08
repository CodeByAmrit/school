CREATE VIEW "StudentPerformance" AS select "s"."school_id" AS "school_id","s"."teacher_id" AS "teacher_id","s"."name" AS "student_name","sm"."session" AS "session","sm"."class_name" AS "class_name","sm"."term" AS "term",(select sum((case when regexp_like("sm_inner"."marks",'^[0-9]+$') then cast("sm_inner"."marks" as unsigned) else 0 end)) from "student_marks" "sm_inner" where (("sm_inner"."student_id" = "s"."school_id") and ("sm_inner"."term" = "sm"."term") and ("sm_inner"."session" = "sm"."session") and ("sm_inner"."class_name" = "sm"."class_name") and exists(select 1 from "subject_config" "sc" where (("sc"."subject_name" = "sm_inner"."subject") and ("sc"."class_name" = "sm_inner"."class_name") and ("sc"."teacher_id" = "s"."teacher_id"))))) AS "grand_total",(select sum(cast("mm_inner"."max_marks" as unsigned)) from ("maximum_marks" "mm_inner" join "student_marks" "sm_inner" on((("mm_inner"."subject" = "sm_inner"."subject") and ("mm_inner"."term" = "sm_inner"."term") and ("mm_inner"."class" = "sm_inner"."class_name") and (("mm_inner"."teacher_id" = "s"."teacher_id") or ("mm_inner"."teacher_id" is null))))) where (("sm_inner"."student_id" = "s"."school_id") and ("sm_inner"."term" = "sm"."term") and ("sm_inner"."session" = "sm"."session") and ("sm_inner"."class_name" = "sm"."class_name") and exists(select 1 from "subject_config" "sc" where (("sc"."subject_name" = "sm_inner"."subject") and ("sc"."class_name" = "sm_inner"."class_name") and ("sc"."teacher_id" = "s"."teacher_id"))))) AS "total_max_marks",(((select sum((case when regexp_like("sm_inner"."marks",'^[0-9]+$') then cast("sm_inner"."marks" as unsigned) else 0 end)) from "student_marks" "sm_inner" where (("sm_inner"."student_id" = "s"."school_id") and ("sm_inner"."term" = "sm"."term") and ("sm_inner"."session" = "sm"."session") and ("sm_inner"."class_name" = "sm"."class_name") and exists(select 1 from "subject_config" "sc" where (("sc"."subject_name" = "sm_inner"."subject") and ("sc"."class_name" = "sm_inner"."class_name") and ("sc"."teacher_id" = "s"."teacher_id"))))) * 100) / nullif((select sum(cast("mm_inner"."max_marks" as unsigned)) from ("maximum_marks" "mm_inner" join "student_marks" "sm_inner" on((("mm_inner"."subject" = "sm_inner"."subject") and ("mm_inner"."term" = "sm_inner"."term") and ("mm_inner"."class" = "sm_inner"."class_name") and (("mm_inner"."teacher_id" = "s"."teacher_id") or ("mm_inner"."teacher_id" is null))))) where (("sm_inner"."student_id" = "s"."school_id") and ("sm_inner"."term" = "sm"."term") and ("sm_inner"."session" = "sm"."session") and ("sm_inner"."class_name" = "sm"."class_name") and exists(select 1 from "subject_config" "sc" where (("sc"."subject_name" = "sm_inner"."subject") and ("sc"."class_name" = "sm_inner"."class_name") and ("sc"."teacher_id" = "s"."teacher_id"))))),0)) AS "percentage" from ("students" "s" join "student_marks" "sm" on(("s"."school_id" = "sm"."student_id"))) group by "s"."school_id","s"."teacher_id","s"."name","sm"."session","sm"."class_name","sm"."term";

CREATE VIEW "SubjectPerformance" AS select "s"."teacher_id" AS "teacher_id","sm"."class_name" AS "class_name","sm"."session" AS "session","sm"."term" AS "term","sm"."subject" AS "subject",avg((((case when regexp_like("sm"."marks",'^[0-9]+$') then cast("sm"."marks" as decimal(5,2)) else 0 end) / nullif((case when regexp_like("mm"."max_marks",'^[0-9]+$') then cast("mm"."max_marks" as decimal(5,2)) else 0 end),0)) * 100)) AS "average_percentage" from (("students" "s" join "student_marks" "sm" on(("s"."school_id" = "sm"."student_id"))) join "maximum_marks" "mm" on((("sm"."subject" = "mm"."subject") and ("sm"."term" = "mm"."term") and ("sm"."class_name" = "mm"."class") and (("mm"."teacher_id" = "s"."teacher_id") or ("mm"."teacher_id" is null))))) where exists(select 1 from "subject_config" "sc" where (("sc"."subject_name" = "sm"."subject") and ("sc"."class_name" = "sm"."class_name") and ("sc"."teacher_id" = "s"."teacher_id"))) group by "s"."teacher_id","sm"."class_name","sm"."session","sm"."term","sm"."subject";

CREATE TABLE "audit_log" (
  "id" int NOT NULL AUTO_INCREMENT,
  "teacher_id" int NOT NULL,
  "action_type" varchar(50) NOT NULL,
  "action_details" text,
  "ip_address" varchar(45) DEFAULT NULL,
  "user_agent" text,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "teacher_id" ("teacher_id"),
  CONSTRAINT "audit_log_ibfk_1" FOREIGN KEY ("teacher_id") REFERENCES "teacher" ("id")
);

CREATE TABLE "backup_schedule" (
  "id" int NOT NULL AUTO_INCREMENT,
  "teacher_id" int NOT NULL,
  "schedule_type" enum('daily','weekly','monthly') DEFAULT 'weekly',
  "last_backup" timestamp NULL DEFAULT NULL,
  "next_backup" timestamp NULL DEFAULT NULL,
  "backup_location" varchar(20) DEFAULT 'local',
  "auto_backup" tinyint(1) DEFAULT '1',
  "retention_days" int DEFAULT '30',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "teacher_id" ("teacher_id"),
  CONSTRAINT "backup_schedule_ibfk_1" FOREIGN KEY ("teacher_id") REFERENCES "teacher" ("id")
);

CREATE TABLE "class_config" (
  "id" int NOT NULL AUTO_INCREMENT,
  "teacher_id" int NOT NULL,
  "class_name" varchar(40) NOT NULL,
  "sections" varchar(100) DEFAULT 'A,B,C,D',
  "max_students" int DEFAULT '40',
  "subjects" text,
  "class_teacher" varchar(100) DEFAULT NULL,
  "room_number" varchar(20) DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE KEY "unique_class" ("teacher_id","class_name"),
  KEY "idx_class_teacher_id" ("teacher_id"),
  CONSTRAINT "class_config_ibfk_1" FOREIGN KEY ("teacher_id") REFERENCES "teacher" ("id")
);

CREATE TABLE "exam_config" (
  "id" int NOT NULL AUTO_INCREMENT,
  "teacher_id" int NOT NULL,
  "term" int NOT NULL,
  "term_name" varchar(50) DEFAULT NULL,
  "start_date" date DEFAULT NULL,
  "end_date" date DEFAULT NULL,
  "weightage" int DEFAULT '100',
  "is_active" tinyint(1) DEFAULT '1',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE KEY "teacher_id" ("teacher_id","term"),
  KEY "idx_exam_teacher_id" ("teacher_id"),
  CONSTRAINT "exam_config_ibfk_1" FOREIGN KEY ("teacher_id") REFERENCES "teacher" ("id")
);

CREATE TABLE "maximum_marks" (
  "id" int NOT NULL AUTO_INCREMENT,
  "class" varchar(40) NOT NULL,
  "term" int NOT NULL,
  "subject" varchar(50) NOT NULL,
  "max_marks" varchar(20) NOT NULL,
  "teacher_id" int DEFAULT NULL,
  PRIMARY KEY ("id"),
  UNIQUE KEY "idx_mm_tenant" ("teacher_id","class","term","subject"),
  CONSTRAINT "fk_mm_teacher" FOREIGN KEY ("teacher_id") REFERENCES "teacher" ("id")
);

CREATE TABLE "photo" (
  "id" int NOT NULL,
  "image" mediumblob,
  "student_sign" mediumblob,
  PRIMARY KEY ("id"),
  CONSTRAINT "photo_ibfk_1" FOREIGN KEY ("id") REFERENCES "students" ("school_id")
);

CREATE TABLE "school_config" (
  "id" int NOT NULL AUTO_INCREMENT,
  "teacher_id" int NOT NULL,
  "school_name" varchar(200) NOT NULL,
  "school_code" varchar(50) DEFAULT NULL,
  "school_address" text,
  "school_phone" varchar(20) DEFAULT NULL,
  "school_email" varchar(100) DEFAULT NULL,
  "school_logo" mediumblob,
  "principal_name" varchar(100) DEFAULT NULL,
  "affiliation_number" varchar(100) DEFAULT NULL,
  "board" varchar(100) DEFAULT 'CBSE',
  "establishment_year" year DEFAULT NULL,
  "total_strength" int DEFAULT '0',
  "academic_start_month" varchar(20) DEFAULT 'April',
  "academic_end_month" varchar(20) DEFAULT 'March',
  "terms_per_year" int DEFAULT '3',
  "enable_attendance" tinyint(1) DEFAULT '1',
  "enable_marks" tinyint(1) DEFAULT '1',
  "enable_reports" tinyint(1) DEFAULT '1',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE KEY "teacher_id" ("teacher_id"),
  KEY "idx_school_teacher_id" ("teacher_id"),
  CONSTRAINT "school_config_ibfk_1" FOREIGN KEY ("teacher_id") REFERENCES "teacher" ("id")
);

CREATE TABLE "school_leaved_students" (
  "id" int NOT NULL AUTO_INCREMENT,
  "original_student_id" int DEFAULT NULL,
  "name" varchar(40) DEFAULT NULL,
  "father_name" varchar(40) DEFAULT NULL,
  "mother_name" varchar(40) DEFAULT NULL,
  "srn_no" varchar(255) DEFAULT NULL,
  "pen_no" varchar(40) DEFAULT NULL,
  "admission_no" varchar(40) DEFAULT NULL,
  "class" varchar(40) DEFAULT NULL,
  "session" varchar(40) DEFAULT NULL,
  "roll" varchar(40) DEFAULT NULL,
  "section" varchar(40) DEFAULT NULL,
  "teacher_id" int DEFAULT NULL,
  "permanent_address" varchar(255) DEFAULT NULL,
  "corresponding_address" varchar(255) DEFAULT NULL,
  "mobile_no" varchar(40) DEFAULT NULL,
  "paste_file_no" varchar(40) DEFAULT NULL,
  "family_id" varchar(40) DEFAULT NULL,
  "dob" varchar(10) DEFAULT NULL,
  "profile_status" varchar(255) DEFAULT NULL,
  "apaar_id" varchar(40) DEFAULT NULL,
  "gender" enum('MALE','FEMALE') NOT NULL DEFAULT 'MALE',
  "leave_date" date DEFAULT (curdate()),
  "reason" text,
  PRIMARY KEY ("id"),
  KEY "teacher_id" ("teacher_id"),
  CONSTRAINT "school_leaved_students_ibfk_1" FOREIGN KEY ("teacher_id") REFERENCES "teacher" ("id")
);

CREATE TABLE "settings" (
  "id" int NOT NULL AUTO_INCREMENT,
  "setting_key" varchar(100) NOT NULL,
  "setting_value" varchar(255) NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE KEY "setting_key" ("setting_key")
);

CREATE TABLE "student_attendance_status" (
  "student_id" int NOT NULL,
  "attendance" varchar(100) DEFAULT NULL,
  "status" enum('passed','promoted','fail','pending') DEFAULT 'pending',
  "session" varchar(20) DEFAULT NULL,
  "class_name" varchar(40) DEFAULT NULL,
  "term" int DEFAULT '1',
  "id" int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY ("id"),
  UNIQUE KEY "unique_attendance" ("student_id","session","class_name","term"),
  CONSTRAINT "student_attendance_status_ibfk_1" FOREIGN KEY ("student_id") REFERENCES "students" ("school_id")
);

CREATE TABLE "student_credentials" (
  "id" int NOT NULL AUTO_INCREMENT,
  "student_id" int DEFAULT NULL,
  "email" varchar(100) DEFAULT NULL,
  "password" varchar(255) DEFAULT '1234',
  "last_login" timestamp NULL DEFAULT NULL,
  "reset_password_token" varchar(255) DEFAULT NULL,
  "reset_password_expires" timestamp NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  UNIQUE KEY "email" ("email"),
  KEY "student_id" ("student_id"),
  CONSTRAINT "student_credentials_ibfk_1" FOREIGN KEY ("student_id") REFERENCES "students" ("school_id")
);

CREATE TABLE "student_face_encodings" (
  "id" int NOT NULL AUTO_INCREMENT,
  "school_id" int NOT NULL,
  "face_encoding" text NOT NULL,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "school_id" ("school_id"),
  CONSTRAINT "student_face_encodings_ibfk_1" FOREIGN KEY ("school_id") REFERENCES "students" ("school_id") ON DELETE CASCADE
);

CREATE TABLE "student_files" (
  "id" int NOT NULL AUTO_INCREMENT,
  "school_id" int DEFAULT NULL,
  "file_data" mediumblob,
  "file_name" varchar(255) DEFAULT NULL,
  "type" varchar(20) DEFAULT 'PDF',
  "upload_date" date DEFAULT (curdate()),
  PRIMARY KEY ("id"),
  KEY "school_id" ("school_id"),
  CONSTRAINT "student_files_ibfk_1" FOREIGN KEY ("school_id") REFERENCES "students" ("school_id")
);

CREATE TABLE "student_grade_remarks" (
  "id" int NOT NULL AUTO_INCREMENT,
  "student_id" int NOT NULL,
  "grade" varchar(100) DEFAULT NULL,
  "remarks" varchar(100) DEFAULT NULL,
  "term" int NOT NULL,
  "session" varchar(20) DEFAULT NULL,
  "class_name" varchar(40) DEFAULT NULL,
  PRIMARY KEY ("id"),
  UNIQUE KEY "unique_grade" ("student_id","session","class_name","term"),
  UNIQUE KEY "idx_grade_session_class_term" ("student_id","session","class_name","term"),
  CONSTRAINT "student_grade_remarks_ibfk_1" FOREIGN KEY ("student_id") REFERENCES "students" ("school_id")
);

CREATE VIEW "student_list_view" AS select "s"."school_id" AS "school_id","s"."teacher_id" AS "teacher_id","s"."name" AS "name","s"."father_name" AS "father_name","s"."mother_name" AS "mother_name","s"."class" AS "class","s"."section" AS "section","s"."session" AS "session","s"."roll" AS "roll","s"."gender" AS "gender","s"."srn_no" AS "srn_no","s"."pen_no" AS "pen_no","s"."admission_no" AS "admission_no","s"."profile_status" AS "profile_status" from "students" "s";

CREATE TABLE "student_marks" (
  "id" int NOT NULL AUTO_INCREMENT,
  "student_id" int NOT NULL,
  "term" int NOT NULL,
  "subject" varchar(50) NOT NULL,
  "marks" varchar(20) DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  "session" varchar(20) DEFAULT NULL,
  "class_name" varchar(40) DEFAULT NULL,
  PRIMARY KEY ("id"),
  UNIQUE KEY "unique_student_mark" ("student_id","session","class_name","term","subject"),
  UNIQUE KEY "idx_student_session_class_term_subject" ("student_id","session","class_name","term","subject"),
  CONSTRAINT "student_marks_ibfk_1" FOREIGN KEY ("student_id") REFERENCES "students" ("school_id")
);

CREATE TABLE "student_notifications" (
  "id" int NOT NULL AUTO_INCREMENT,
  "student_id" int NOT NULL,
  "title" varchar(255) NOT NULL,
  "message" text NOT NULL,
  "link" varchar(255) DEFAULT NULL,
  "is_read" tinyint(1) DEFAULT '0',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "student_id" ("student_id"),
  CONSTRAINT "student_notifications_ibfk_1" FOREIGN KEY ("student_id") REFERENCES "students" ("school_id") ON DELETE CASCADE
);

CREATE VIEW "student_photo_view" AS select "p"."id" AS "school_id","p"."image" AS "image","p"."student_sign" AS "student_sign" from "photo" "p";

CREATE VIEW "student_photos_base64" AS select "photo"."id" AS "id",to_base64("photo"."image") AS "image_base64",to_base64("photo"."student_sign") AS "student_sign_base64" from "photo";

CREATE VIEW "student_photos_view" AS select "s"."name" AS "name","s"."father_name" AS "father_name","s"."session" AS "session","s"."mother_name" AS "mother_name","s"."class" AS "class","s"."school_id" AS "school_id","s"."teacher_id" AS "teacher_id","s"."profile_status" AS "profile_status",to_base64("p"."image") AS "image_base64",to_base64("p"."student_sign") AS "student_sign_base64" from ("students" "s" left join "photo" "p" on(("s"."school_id" = "p"."id")));

CREATE TABLE "student_settings" (
  "id" int NOT NULL AUTO_INCREMENT,
  "student_id" int NOT NULL,
  "theme" varchar(20) DEFAULT 'light',
  "notifications_enabled" tinyint(1) DEFAULT '1',
  "email_notifications" tinyint(1) DEFAULT '1',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE KEY "student_id" ("student_id"),
  CONSTRAINT "student_settings_ibfk_1" FOREIGN KEY ("student_id") REFERENCES "students" ("school_id") ON DELETE CASCADE
);

CREATE TABLE "students" (
  "school_id" int NOT NULL AUTO_INCREMENT,
  "name" varchar(40) DEFAULT NULL,
  "father_name" varchar(40) DEFAULT NULL,
  "mother_name" varchar(40) DEFAULT NULL,
  "srn_no" varchar(255) DEFAULT NULL,
  "pen_no" varchar(40) DEFAULT NULL,
  "admission_no" varchar(40) DEFAULT NULL,
  "class" varchar(40) DEFAULT NULL,
  "session" varchar(40) DEFAULT NULL,
  "roll" varchar(40) DEFAULT NULL,
  "section" varchar(40) DEFAULT 'A',
  "teacher_id" int DEFAULT NULL,
  "permanent_address" varchar(255) DEFAULT NULL,
  "corresponding_address" varchar(255) DEFAULT NULL,
  "mobile_no" varchar(40) DEFAULT NULL,
  "paste_file_no" varchar(40) DEFAULT NULL,
  "family_id" varchar(40) DEFAULT NULL,
  "dob" varchar(10) DEFAULT NULL,
  "profile_status" varchar(255) DEFAULT NULL,
  "apaar_id" varchar(40) DEFAULT NULL,
  "gender" enum('MALE','FEMALE') NOT NULL DEFAULT 'MALE',
  "blood_group" enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  "student_aadhar_no" char(14) DEFAULT NULL,
  "father_aadhar_no" char(14) DEFAULT NULL,
  "mother_aadhar_no" char(14) DEFAULT NULL,
  "family_id_verified" tinyint(1) DEFAULT '0',
  PRIMARY KEY ("school_id"),
  UNIQUE KEY "student_aadhar_no" ("student_aadhar_no"),
  UNIQUE KEY "student_aadhar_no_2" ("student_aadhar_no"),
  KEY "idx_class" ("class"),
  KEY "students_idx_class_teacher_id" ("class","teacher_id"),
  KEY "idx_students_teacher" ("teacher_id"),
  KEY "idx_students_name" ("teacher_id","name"),
  KEY "idx_students_class" ("teacher_id","class"),
  KEY "idx_students_session" ("teacher_id","session"),
  KEY "idx_students_srn" ("teacher_id","srn_no"),
  KEY "idx_students_teacher_srn" ("teacher_id","srn_no"),
  KEY "idx_students_teacher_session" ("teacher_id","session"),
  KEY "idx_students_profile_status" ("profile_status"),
  KEY "idx_students_teacher_id" ("teacher_id"),
  CONSTRAINT "students_ibfk_1" FOREIGN KEY ("teacher_id") REFERENCES "teacher" ("id")
);

CREATE VIEW "students_per_class" AS select "students"."teacher_id" AS "teacher_id","students"."class" AS "class","students"."session" AS "session",count((case when ("students"."gender" = 'MALE') then 1 end)) AS "male_count",count((case when ("students"."gender" = 'FEMALE') then 1 end)) AS "female_count" from "students" group by "students"."teacher_id","students"."class","students"."session";

CREATE TABLE "subject_config" (
  "id" int NOT NULL AUTO_INCREMENT,
  "teacher_id" int NOT NULL,
  "class_name" varchar(40) NOT NULL,
  "subject_name" varchar(100) NOT NULL,
  "subject_code" varchar(20) DEFAULT NULL,
  "is_elective" tinyint(1) DEFAULT '0',
  "max_marks" int DEFAULT '100',
  "passing_marks" int DEFAULT '33',
  "priority" int DEFAULT '1',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE KEY "teacher_id" ("teacher_id","class_name","subject_name"),
  KEY "idx_subject_teacher_id" ("teacher_id"),
  CONSTRAINT "subject_config_ibfk_1" FOREIGN KEY ("teacher_id") REFERENCES "teacher" ("id")
);

CREATE TABLE "teacher" (
  "id" int NOT NULL AUTO_INCREMENT,
  "first_name" varchar(50) DEFAULT NULL,
  "last_name" varchar(50) DEFAULT NULL,
  "email" varchar(100) DEFAULT NULL,
  "password" varchar(255) DEFAULT NULL,
  "school_name" varchar(200) DEFAULT NULL,
  "school_address" varchar(200) DEFAULT NULL,
  "school_phone" varchar(200) DEFAULT NULL,
  "school_logo" mediumblob,
  "email_verified" tinyint(1) DEFAULT '0',
  "last_login" timestamp NULL DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "subscription_tier" enum('FREE','PREMIUM') DEFAULT 'FREE',
  "custom_domain" varchar(255) DEFAULT NULL,
  "subscription_expires_at" timestamp NULL DEFAULT NULL,
  "payment_status" varchar(50) DEFAULT 'unpaid',
  PRIMARY KEY ("id"),
  UNIQUE KEY "custom_domain" ("custom_domain"),
  KEY "idx_custom_domain" ("custom_domain")
);

CREATE TABLE "teacher_settings" (
  "id" int NOT NULL AUTO_INCREMENT,
  "teacher_id" int NOT NULL,
  "theme" varchar(20) DEFAULT 'light',
  "notifications_enabled" tinyint(1) DEFAULT '1',
  "email_notifications" tinyint(1) DEFAULT '1',
  "default_session" varchar(20) DEFAULT '2024-2025',
  "auto_save_draft" tinyint(1) DEFAULT '1',
  "default_class" varchar(20) DEFAULT NULL,
  "date_format" varchar(20) DEFAULT 'dd-mm-yyyy',
  "items_per_page" int DEFAULT '20',
  "language" varchar(10) DEFAULT 'en',
  "timezone" varchar(50) DEFAULT 'Asia/Kolkata',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE KEY "teacher_id" ("teacher_id"),
  KEY "idx_teacher_id" ("teacher_id"),
  CONSTRAINT "teacher_settings_ibfk_1" FOREIGN KEY ("teacher_id") REFERENCES "teacher" ("id")
);

