import axios from 'axios';

const F1_API_BASE = 'https://f1api.dev/api';

async function testEndpoints() {
    console.log('🔍 Тестирование F1 API endpoints...');
    
    try {
        // Тестируем основные endpoints
        const endpoints = [
            '/seasons/current',
            '/drivers',
            '/constructors',
            '/circuits',
            '/calendar/2024'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(`${F1_API_BASE}${endpoint}`);
                console.log(`✅ ${endpoint}:`, {
                    status: response.status,
                    data: response.data
                });
            } catch (error) {
                console.log(`❌ ${endpoint}:`, error.response?.status || error.message);
            }
            await new Promise(resolve => setTimeout(resolve, 500)); // Задержка между запросами
        }
    } catch (error) {
        console.error('Ошибка тестирования:', error);
    }
}

// Запускаем тест
testEndpoints();