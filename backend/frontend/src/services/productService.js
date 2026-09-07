import api from "../api/api";

export const getProducts = async () => {
  const res = await api.get("/products");
  return res.data;
};

export const createProduct = async (
  product
) => {
  const res = await api.post(
    "/products",
    product
  );

  return res.data;
};