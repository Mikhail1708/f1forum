// services/f1Api.js
import axios from 'axios';

class F1ApiService {
    constructor() {
        this.baseURL = 'https://api.jolpi.ca/ergast/f1';
        this.cache = new Map();
        this.cacheTime = 5 * 60 * 1000; // 5 минут кэша
    }

    // Кэширование запросов
    async cachedRequest(cacheKey, requestFn) {
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTime) {
            return cached.data;
        }

        try {
            const data = await requestFn();
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            return data;
        } catch (error) {
            if (cached) {
                console.warn('Используем кэшированные данные из-за ошибки API');
                return cached.data;
            }
            throw error;
        }
    }

    // Базовый метод для API запросов
    async makeRequest(endpoint) {
        try {
            console.log(`🔄 API запрос: ${endpoint}`);
            const response = await axios.get(`${this.baseURL}${endpoint}`);
            console.log('✅ API ответ получен');
            return response.data.MRData;
        } catch (error) {
            console.error(`❌ API Error for ${endpoint}:`, error);
            throw error;
        }
    }

    // Получение текущего сезона
    async getCurrentSeason() {
        return this.cachedRequest('currentSeason', async () => {
            const data = await this.makeRequest('/current.json');
            return {
                year: parseInt(data.RaceTable.season),
                url: data.url
            };
        });
    }

    // Получение пилотов текущего сезона
    async getDrivers() {
        return this.cachedRequest('drivers', async () => {
            const season = await this.getCurrentSeason();
            const data = await this.makeRequest(`/${season.year}/drivers.json`);
            return data.DriverTable.Drivers || [];
        });
    }

    // Получение команд
    async getConstructors() {
        return this.cachedRequest('constructors', async () => {
            const season = await this.getCurrentSeason();
            const data = await this.makeRequest(`/${season.year}/constructors.json`);
            return data.ConstructorTable.Constructors || [];
        });
    }

    // Получение трасс
    async getCircuits() {
        return this.cachedRequest('circuits', async () => {
            const season = await this.getCurrentSeason();
            const data = await this.makeRequest(`/${season.year}/circuits.json`);
            return data.CircuitTable.Circuits || [];
        });
    }

    // Получение календаря сезона
    async getCalendar(year = null) {
        if (!year) {
            const season = await this.getCurrentSeason();
            year = season.year;
        }
        
        return this.cachedRequest(`calendar-${year}`, async () => {
            const data = await this.makeRequest(`/${year}.json`);
            return data.RaceTable.Races || [];
        });
    }

    // Получение чемпионата пилотов
    async getDriverStandings(year = null) {
        if (!year) {
            const season = await this.getCurrentSeason();
            year = season.year;
        }
        
        return this.cachedRequest(`driverStandings-${year}`, async () => {
            const data = await this.makeRequest(`/${year}/driverStandings.json`);
            const standings = data.StandingsTable.StandingsLists[0]?.DriverStandings || [];
            
            return standings.map(standing => ({
                position: standing.position,
                Driver: {
                    givenName: standing.Driver.givenName,
                    familyName: standing.Driver.familyName,
                    code: standing.Driver.code
                },
                Constructors: standing.Constructors,
                points: standing.points,
                wins: standing.wins
            }));
        });
    }

    // Получение чемпионата конструкторов
    async getConstructorStandings(year = null) {
        if (!year) {
            const season = await this.getCurrentSeason();
            year = season.year;
        }
        
        return this.cachedRequest(`constructorStandings-${year}`, async () => {
            const data = await this.makeRequest(`/${year}/constructorStandings.json`);
            return data.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
        });
    }

    // Получение следующей гонки
    async getNextRace() {
        return this.cachedRequest('nextRace', async () => {
            const calendar = await this.getCalendar();
            const now = new Date();
            const upcomingRaces = calendar.filter(race => new Date(race.date) > now);
            return upcomingRaces.length > 0 ? upcomingRaces[0] : null;
        });
    }

    // Получение предыдущей гонки
    async getPreviousRace() {
        try {
            const calendar = await this.getCalendar();
            const now = new Date();
            
            // Находим все прошедшие гонки
            const pastRaces = calendar.filter(race => new Date(race.date) < now);
            
            // Сортируем по дате (последняя гонка первая)
            pastRaces.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            return pastRaces[0] || null;
        } catch (error) {
            console.error('Error getting previous race:', error);
            return null;
        }
    }

    // Получение результатов гонки - УЛУЧШЕННАЯ ВЕРСИЯ
    async getRaceResults(round, season = 'current') {
        try {
            console.log(`🎯 Запрос результатов гонки: сезон ${season}, раунд ${round}`);
            const data = await this.makeRequest(`/${season}/${round}/results.json`);
            
            // Проверяем структуру ответа
            if (!data.RaceTable || !data.RaceTable.Races || data.RaceTable.Races.length === 0) {
                console.warn('❌ Нет данных о гонке в ответе API');
                return [];
            }

            const race = data.RaceTable.Races[0];
            const results = race.Results || [];
            
            console.log(`✅ Найдено результатов гонки: ${results.length}`);
            
            return results.map(result => ({
                position: result.position,
                Driver: {
                    givenName: result.Driver.givenName,
                    familyName: result.Driver.familyName,
                    code: result.Driver.code || result.Driver.driverId?.substring(0, 3).toUpperCase()
                },
                Constructor: {
                    name: result.Constructor.name
                },
                Time: result.Time,
                points: result.points,
                status: result.status
            }));
        } catch (error) {
            console.error(`❌ Ошибка получения результатов гонки для раунда ${round}:`, error);
            return [];
        }
    }

    // Получение результатов квалификации - УЛУЧШЕННАЯ ВЕРСИЯ
    async getQualifyingResults(round, season = 'current') {
        try {
            console.log(`🎯 Запрос квалификации: сезон ${season}, раунд ${round}`);
            const data = await this.makeRequest(`/${season}/${round}/qualifying.json`);
            
            // Проверяем структуру ответа
            if (!data.RaceTable || !data.RaceTable.Races || data.RaceTable.Races.length === 0) {
                console.warn('❌ Нет данных о гонке в ответе API');
                return [];
            }

            const race = data.RaceTable.Races[0];
            const results = race.QualifyingResults || [];
            
            console.log(`✅ Найдено результатов квалификации: ${results.length}`);
            
            return results.map(result => ({
                position: result.position,
                Driver: {
                    givenName: result.Driver.givenName,
                    familyName: result.Driver.familyName,
                    code: result.Driver.code || result.Driver.driverId?.substring(0, 3).toUpperCase()
                },
                Constructor: {
                    name: result.Constructor.name
                },
                Q1: result.Q1,
                Q2: result.Q2,
                Q3: result.Q3
            }));
        } catch (error) {
            console.error(`❌ Ошибка получения квалификации для раунда ${round}:`, error);
            return [];
        }
    }

    // Получение информации о пилоте
    async getDriverDetails(driverId) {
        return this.cachedRequest(`driver-${driverId}`, async () => {
            const data = await this.makeRequest(`/drivers/${driverId}.json`);
            return data.DriverTable.Drivers[0];
        });
    }
// Добавьте эти методы в класс F1ApiService в f1Api.js

// Получение результатов пилота за сезон
async getDriverSeasonResults(driverId, season = 'current') {
    try {
        console.log(`🎯 Запрос результатов пилота ${driverId} за сезон ${season}`);
        const data = await this.makeRequest(`/${season}/drivers/${driverId}/results.json`);
        const races = data.RaceTable.Races || [];
        
        return races.map(race => ({
            round: race.round,
            raceName: race.raceName,
            date: race.date,
            Circuit: race.Circuit,
            Results: race.Results?.[0] || null
        }));
    } catch (error) {
        console.error(`❌ Ошибка получения результатов пилота ${driverId}:`, error);
        return [];
    }
}

// Получение квалификационных результатов пилота за сезон
async getDriverQualifyingResults(driverId, season = 'current') {
    try {
        console.log(`🎯 Запрос квалификации пилота ${driverId} за сезон ${season}`);
        const data = await this.makeRequest(`/${season}/drivers/${driverId}/qualifying.json`);
        const races = data.RaceTable.Races || [];
        
        return races.map(race => ({
            round: race.round,
            raceName: race.raceName,
            QualifyingResults: race.QualifyingResults?.[0] || null
        }));
    } catch (error) {
        console.error(`❌ Ошибка получения квалификации пилота ${driverId}:`, error);
        return [];
    }
}

// Получение статистики пилота
async getDriverStats(driverId) {
    try {
        console.log(`📊 Запрос статистики пилота ${driverId}`);
        const data = await this.makeRequest(`/drivers/${driverId}/driverStandings.json`);
        const standingsLists = data.StandingsTable.StandingsLists || [];
        
        return standingsLists.map(season => ({
            season: season.season,
            position: season.DriverStandings?.[0]?.position,
            points: season.DriverStandings?.[0]?.points,
            wins: season.DriverStandings?.[0]?.wins,
            Constructors: season.DriverStandings?.[0]?.Constructors || []
        }));
    } catch (error) {
        console.error(`❌ Ошибка получения статистики пилота ${driverId}:`, error);
        return [];
    }
}
    // Получение информации о команде
    async getConstructorDetails(constructorId) {
        return this.cachedRequest(`constructor-${constructorId}`, async () => {
            const data = await this.makeRequest(`/constructors/${constructorId}.json`);
            return data.ConstructorTable.Constructors[0];
        });
    }

    // Получение информации о гонке по ID
    async getRaceById(round, season = 'current') {
        try {
            const calendar = await this.getCalendar(season);
            const race = calendar.find(r => r.round === round.toString());
            
            if (!race) {
                console.warn(`❌ Гонка с round=${round} не найдена`);
                return null;
            }
            
            return race;
        } catch (error) {
            console.error(`❌ Ошибка получения гонки ${round}:`, error);
            return null;
        }
    }

    // Очистка кэша
    clearCache() {
        this.cache.clear();
    }

    // Дополнительные методы для отладки
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    // Проверка доступности API
    async healthCheck() {
        try {
            await this.makeRequest('/current.json');
            return true;
        } catch (error) {
            return false;
        }
    }
}

export default new F1ApiService();