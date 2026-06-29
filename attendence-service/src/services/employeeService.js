const axios = require("axios");

const validateEmployee =
  async (employeeId) => {

    try {

      const response =
        await axios.get(
          `${process.env.API_GATEWAY_URL}/employees/exists/${employeeId}`
        );

      return response.data.exists;

    } catch (error) {

      console.error(
        "Employee validation failed:",
        error.message
      );

      return false;
    }
  };

module.exports = {
  validateEmployee
};






