import api from "../api/api";

export const createInvoice = async (
  invoice
) => {
  const res = await api.post(
    "/billing",
    invoice
  );

  return res.data;
};

export const getInvoices = async () => {
  const res = await api.get("/billing");
  return res.data;
};