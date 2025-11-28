// frontend/services/api.js
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

// Создаем экземпляр axios с базовыми настройками
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
});

// Interceptor для запросов
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    config.headers['Content-Type'] = 'application/json';
    
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    console.log('📦 Headers:', config.headers);
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor для ответов
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.message,
      code: error.code,
      url: error.config?.url
    });
    
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      console.log('🔒 Auth error, logging out...');
      authStore.logout();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Метод для экспорта отчетов в PDF
api.exportReportsPDF = async (params = {}) => {
    try {
        const response = await api.get('/moderator/reports/export/pdf', {
            params,
            responseType: 'blob' // Важно для скачивания файлов
        });
        
        // Создаем URL для скачивания
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        
        // Получаем имя файла из заголовков или генерируем
        const contentDisposition = response.headers['content-disposition'];
        let fileName = `reports_${new Date().toISOString().split('T')[0]}.pdf`;
        
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
            if (fileNameMatch && fileNameMatch.length === 2) {
                fileName = fileNameMatch[1];
            }
        }
        
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        return { success: true, fileName };
    } catch (error) {
        console.error('❌ PDF Export Error:', error);
        throw error;
    }
};

export default api;