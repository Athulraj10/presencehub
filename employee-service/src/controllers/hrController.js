
const db = require("../config/db");
const bcrypt = require("bcrypt");

// Create HR
exports.createHR = async (req, res) => {
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
    // Check duplicate
    const [existingHR] = await db.query(
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

    // Hash password
    const hashedPassword =
      await bcrypt.hash(password, 10);

    // Create HR
    await db.query(
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

    res.status(201).json({
      success: true,
      message: "HR created successfully"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
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