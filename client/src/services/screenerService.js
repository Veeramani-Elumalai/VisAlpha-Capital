import axios from "axios";

export const getScreenerData = async (symbol) => {
  const res = await axios.get(
    `http://localhost:5000/api/screener/${symbol}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  return res.data;
};
