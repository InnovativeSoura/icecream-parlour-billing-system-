import axios from "axios";

// Change this URL after deploying backend
const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add JWT token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ==========================
   AUTH APIs
========================== */

export const loginUser = (userData) =>
  API.post("/auth/login", userData);

export const registerUser = (userData) =>
  API.post("/auth/register", userData);

/* ==========================
   PRODUCT APIs
========================== */

export const getProducts = () =>
  API.get("/products");

export const getProductById = (id) =>
  API.get(`/products/${id}`);

export const addProduct = (productData) =>
  API.post("/products", productData);

export const updateProduct = (id, productData) =>
  API.put(`/products/${id}`, productData);

export const deleteProduct = (id) =>
  API.delete(`/products/${id}`);

/* ==========================
   ORDER APIs
========================== */

export const createOrder = (orderData) =>
  API.post("/orders", orderData);

export const getOrders = () =>
  API.get("/orders");

export const getOrderById = (id) =>
  API.get(`/orders/${id}`);

/* ==========================
   REPORT APIs
========================== */

export const getDailyReport = () =>
  API.get("/reports/daily");

export const getMonthlyReport = () =>
  API.get("/reports/monthly");

/* ==========================
   INVENTORY APIs
========================== */

export const getInventory = () =>
  API.get("/inventory");

export const updateInventory = (id, data) =>
  API.put(`/inventory/${id}`, data);

export default API;