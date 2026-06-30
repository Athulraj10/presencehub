
const db = require("../config/db");
const bcrypt = require("bcrypt");
const FaceService = require("../services/faceService");

// Create HR
exports.createHR = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      employeeId,
      name,
      email,
      department,
      password
    } = req.body;

    // Required fields
    if (
      !employeeId ||
      !name ||
      !email ||
      !department ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters"
      });
    }

    // Verify face image was uploaded via multer memoryStorage
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Face image is required"
      });
    }

    // Check duplicate
    const [existingHR] = await connection.query(
      `
      SELECT *
      FROM employees
      WHERE employee_id = ?
      OR email = ?
      `,
      [employeeId, email]
    );

    if (existingHR.length > 0) {
      return res.status(400).json({
        success: false,
        message: "HR already exists"
      });
    }

    // Start Transaction to allow rollback if face generation fails
    await connection.beginTransaction();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create HR Details
    await connection.query(
      `
      INSERT INTO employees
      (
        employee_id,
        name,
        email,
        department,
        password,
        role
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        employeeId,
        name,
        email,
        department,
        hashedPassword,
        "hr"
      ]
    );

    // Call face recognition service to generate embedding
    let embedding;
    try {
      embedding = await FaceService.generateEmbedding(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    } catch (faceError) {
      // Force transaction rollback
      throw faceError;
    }

    // Save the face embedding string into the database
    await connection.query(
      `
      UPDATE employees
      SET face_embedding = ?
      WHERE employee_id = ?
      `,
      [embedding, employeeId]
    );

    // Commit changes
    await connection.commit();

    res.status(201).json({
      success: true,
      message: "HR created successfully"
    });

  } catch (error) {
    // Rollback changes on failure
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError.message);
    }

    console.error("HR registration error:", error);

    const statusCode = error.status || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  } finally {
    connection.release();
  }
};

// Get All HR
exports.getAllHR = async (req, res) => {
  try {
    const [hrs] = await db.query(
      `
      SELECT
        employee_id,
        name,
        email,
        department,
        created_at
      FROM employees
      WHERE role = 'hr'
      `
    );

    res.status(200).json({
      success: true,
      data: hrs
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// Get HR By ID
exports.getHRById = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const [hrs] = await db.query(
      `
      SELECT
        employee_id,
        name,
        email,
        department,
        created_at
      FROM employees
      WHERE employee_id = ?
      AND role = 'hr'
      `,
      [employeeId]
    );

    if (hrs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "HR not found"
      });
    }

    res.status(200).json({
      success: true,
      data: hrs[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// Update HR
exports.updateHR = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const {
      name,
      email,
      department
    } = req.body;
if (!name || !email || !department) {
  return res.status(400).json({
    success: false,
    message: "All fields are required"
  });
}
    const [hrs] = await db.query(
      `
      SELECT *
      FROM employees
      WHERE employee_id = ?
      AND role = 'hr'
      `,
      [employeeId]
    );

    if (hrs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "HR not found"
      });
    }
const [existingEmail] = await db.query(
  `
  SELECT *
  FROM employees
  WHERE email = ?
  AND employee_id != ?
  `,
  [email, employeeId]
);

if (existingEmail.length > 0) {
  return res.status(400).json({
    success: false,
    message: "Email already exists"
  });
}
    await db.query(
      `
     UPDATE employees
SET
  name = ?,
  email = ?,
  department = ?
WHERE employee_id = ?
AND role = 'hr'
      `,
      [
        name,
        email,
        department,
        employeeId
      ]
    );

    res.status(200).json({
      success: true,
      message: "HR updated successfully"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// Delete HR
exports.deleteHR = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const [hrs] = await db.query(
      `
      SELECT *
      FROM employees
      WHERE employee_id = ?
      AND role = 'hr'
      `,
      [employeeId]
    );

    if (hrs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "HR not found"
      });
    }

    await db.query(
      `
      DELETE FROM employees
      WHERE employee_id = ?
      AND role = 'hr'
      `,
      [employeeId]
    );

    res.status(200).json({
      success: true,
      message: "HR deleted successfully"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};