const db = require("../config/db");
const { getChannel } = require("../config/rabbitmq");

exports.registerEmployee = async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      department
    } = req.body;

    // Validation
    if (!employeeId || !name || !email || !department) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
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

    // Save employee to MySQL
    await db.query(
      `
      INSERT INTO employees
      (employee_id, name, email, department)
      VALUES (?, ?, ?, ?)
      `,
      [employeeId, name, email, department]
    );

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
exports.getEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

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
exports.getAllEmployees = async (req, res) => {
  try {
    const [employees] = await db.query(
      `
      SELECT employee_id, name, email, department, created_at
      FROM employees
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
exports.updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const {
      name,
      email,
      department
    } = req.body;

    // Validation
    if (!name || !email || !department) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Check employee exists
    const [employees] = await db.query(
      `
      SELECT *
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

    // Update employee
    await db.query(
      `
      UPDATE employees
      SET
        name = ?,
        email = ?,
        department = ?
      WHERE employee_id = ?
      `,
      [name, email, department, employeeId]
    );

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
exports.deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Check employee exists
    const [employees] = await db.query(
      `
      SELECT *
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

    // Delete employee
    await db.query(
      `
      DELETE FROM employees
      WHERE employee_id = ?
      `,
      [employeeId]
    );

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