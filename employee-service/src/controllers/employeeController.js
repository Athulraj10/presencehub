 const db = require("../config/db");
const { getChannel } = require("../config/rabbitmq");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register Employee
exports.registerEmployee = async (req, res) => {
  try {
  const {
  employeeId,
  name,
  email,
  department,
  password
} = req.body;


    // Required fields validation
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
    // Employee ID validation
    const employeeIdRegex = /^EMP\d+$/;

    if (!employeeIdRegex.test(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID format"
      });
    }

    // Name validation
    const nameRegex = /^[A-Za-z ]+$/;

    if (!nameRegex.test(name)) {
      return res.status(400).json({
        success: false,
        message: "Name should contain only letters"
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // Department validation
    const validDepartments = [
      "Engineering",
      "HR",
      "IT",
      "Finance",
      "Marketing"
    ];

    if (!validDepartments.includes(department)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department"
      });
    }

    // Check duplicate employee
    const [existingEmployee] = await db.query(
      `
      SELECT *
      FROM employees
      WHERE employee_id = ? OR email = ?
      `,
      [employeeId, email]
    );

    if (existingEmployee.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Employee already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(
  password,
  10
);
    // Save employee
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
  "employee"
]    );

    // Publish RabbitMQ event
    const channel = getChannel();

    if (channel) {
      await channel.assertQueue("employee.created");

      channel.sendToQueue(
        "employee.created",
        Buffer.from(
          JSON.stringify({
            employeeId
          })
        )
      );

      console.log(
        "Published employee.created:",
        employeeId
      );
    }

    res.status(201).json({
      success: true,
      message: "Employee registered successfully"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required"
      });
    }

    if (newPassword.length < 8) {
  return res.status(400).json({
    success: false,
    message: "Password must be at least 8 characters"
  });
}

    const [employees] = await db.query(
      "SELECT * FROM employees WHERE email = ?",
      [email]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    await db.query(
      "UPDATE employees SET password = ? WHERE email = ?",
      [hashedPassword, email]
    );

    res.status(200).json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
  
};

// Login Employee
exports.loginEmployee = async (req, res) => {
  try {
    const identifier = req.body.identifier || req.body.email;
    const { password } = req.body;

    // Validation
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Employee ID or email and password are required"
      });
    }

    // Find employee by email or employee ID
    const [employees] = await db.query(
      `
      SELECT *
      FROM employees
      WHERE email = ? OR employee_id = ?
      `,
      [identifier, identifier]
    );

    if (employees.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const employee = employees[0];

    // Compare password
    const isMatch = await bcrypt.compare(
      password,
      employee.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        employeeId: employee.employee_id,
        role: employee.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

   res.status(200).json({
  success: true,
  token,
  employeeId: employee.employee_id,
  role: employee.role
});

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};
// Get Employee By ID
exports.getEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
if (
  req.user.role === "employee" &&
  req.user.employeeId !== employeeId
) {
  return res.status(403).json({
    success: false,
    message: "Access denied"
  });
}
    const [employees] = await db.query(
      `
      SELECT employee_id, name, email, department, created_at
      FROM employees
      WHERE employee_id = ?
      `,
      [employeeId]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.status(200).json({
      success: true,
      data: employees[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// Get All Employees
exports.getAllEmployees = async (req, res) => {
  try {
    const [employees] = await db.query(
      `
      SELECT employee_id, name, email, department, created_at
FROM employees
WHERE role = 'employee'
      `
    );

    res.status(200).json({
      success: true,
      data: employees
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// Update Employee
exports.updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const {
      name,
      email,
      department
    } = req.body;

    // Required fields validation
    if (!name || !email || !department) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Name validation
    const nameRegex = /^[A-Za-z ]+$/;

    if (!nameRegex.test(name)) {
      return res.status(400).json({
        success: false,
        message: "Name should contain only letters"
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // Department validation
    const validDepartments = [
      "Engineering",
      "HR",
      "IT",
      "Finance",
      "Marketing"
    ];

    if (!validDepartments.includes(department)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department"
      });
    }

    // Check employee exists
    const [employees] = await db.query(
  `
  SELECT *
  FROM employees
  WHERE employee_id = ?
  AND role = 'employee'
  `,
  [employeeId]
);

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
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
    // Update employee
    await db.query(
      `
      UPDATE employees
SET
  name = ?,
  email = ?,
  department = ?
WHERE employee_id = ?
AND role = 'employee'
      `,
      [name, email, department, employeeId]
    );
// Publish RabbitMQ event
const channel = getChannel();

if (channel) {
  await channel.assertQueue("employee.updated");

  channel.sendToQueue(
    "employee.updated",
    Buffer.from(
      JSON.stringify({
        employeeId
      })
    )
  );

  console.log(
    "Published employee.updated:",
    employeeId
  );
}
    res.status(200).json({
      success: true,
      message: "Employee updated successfully"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// Delete Employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const [employees] = await db.query(
      `
      SELECT *
      FROM employees
      WHERE employee_id = ?
      AND role = 'employee'
      `,
      [employeeId]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    await db.query(
      `
      DELETE FROM employees
      WHERE employee_id = ?
      AND role = 'employee'
      `,
      [employeeId]
    );

    const channel = getChannel();

    if (channel) {
      await channel.assertQueue("employee.deleted");

      channel.sendToQueue(
        "employee.deleted",
        Buffer.from(
          JSON.stringify({ employeeId })
        )
      );
    }

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// Check Employee Exists
exports.employeeExists = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const [employees] = await db.query(
      `
      SELECT employee_id
      FROM employees
      WHERE employee_id = ?
      `,
      [employeeId]
    );

    res.status(200).json({
      success: true,
      exists: employees.length > 0
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      exists: false,
      message: "Internal Server Error"
    });
  }
};