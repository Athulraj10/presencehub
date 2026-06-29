import axios from "axios";

const attendanceApi = axios.create({
  baseURL: "http://localhost:3001",
});

export default attendanceApi;