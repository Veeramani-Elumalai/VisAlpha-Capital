import axios from "axios";

const PYTHON_SERVICE_URL = "http://127.0.0.1:8000";

export const getLivePrice = async (symbol) => {
  try {
    const res = await axios.get(`${PYTHON_SERVICE_URL}/price/${symbol}`);
    return res.data;
  } catch (err) {
    console.error("Microservice Error:", err.message);
    return null;
  }
};
