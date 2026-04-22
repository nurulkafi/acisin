import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add interceptors here
axiosInstance.interceptors.request.use(
  (config) => {
    // Perform actions before request is sent
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle global errors here
    return Promise.reject(error);
  }
);

export default axiosInstance;
