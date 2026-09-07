import api from "../api/api";

export const getCustomers = async () => {
  const res = await api.get("/customers");
  return res.data;
};

export const createCustomer = async (
  customer
) => {
  const res = await api.post(
    "/customers",
    customer
  );

  return res.data;
};