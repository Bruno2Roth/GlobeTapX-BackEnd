import axios from 'axios';
import https from 'https'; // Agente HTTPS para manejar certificados en producción
import clima from '../entities/clima.js';

const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === 'production'
    })
});

export default class climaService {
    constructor() {
        console.log('Estoy en: climaService.constructor()');
    }

    // Servicio de clima. Usa IP geolocation + APIs públicas para obtener clima y país.
    async fetchIpInfoAsync() {
        console.log('climaService.fetchIpInfoAsync()');
        const url = 'https://ipapi.co/json/';
        const response = await axiosInstance.get(url);
        return response.data;
    }

    // Consulta el clima actual para coordenadas geográficas.
    async fetchWeatherAsync(latitude, longitude) {
        console.log(`climaService.fetchWeatherAsync(${latitude}, ${longitude})`);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`;
        const response = await axiosInstance.get(url);
        return response.data;
    }

    async fetchCountryByCodeAsync(countryCode) {
        console.log(`climaService.fetchCountryByCodeAsync(${countryCode})`);
        const url = `https://restcountries.com/v3.1/alpha/${countryCode}`;
        const response = await axiosInstance.get(url);
        return response.data[0];
    }

    async fetchCountryByNameOrCodeAsync(countryIdentifier) {
        console.log(`climaService.fetchCountryByNameOrCodeAsync(${countryIdentifier})`);
        const normalized = countryIdentifier.toString().trim();
        let url;

        if (/^[A-Za-z]{2,3}$/.test(normalized)) {
            url = `https://restcountries.com/v3.1/alpha/${normalized}`;
        } else {
            url = `https://restcountries.com/v3.1/name/${encodeURIComponent(normalized)}?fullText=false`;
        }

        const response = await axiosInstance.get(url);
        return Array.isArray(response.data) ? response.data[0] : response.data;
    }

    getCurrencyCode(currencies) {
        if (!currencies || typeof currencies !== 'object') {
            return null;
        }
        const codes = Object.keys(currencies);
        return codes.length > 0 ? codes[0] : null;
    }

    getCountryLatLng(countryData) {
        if (!countryData || typeof countryData !== 'object') {
            return null;
        }

        if (Array.isArray(countryData.capitalInfo?.latlng) && countryData.capitalInfo.latlng.length >= 2) {
            return countryData.capitalInfo.latlng;
        }

        if (Array.isArray(countryData.latlng) && countryData.latlng.length >= 2) {
            return countryData.latlng;
        }

        return null;
    }

    getHumidityFromWeather(weatherData) {
        if (!weatherData) {
            return null;
        }

        const current = weatherData.current_weather;
        const humidityFromCurrent = current?.relativehumidity_2m ?? current?.relative_humidity_2m;
        if (humidityFromCurrent !== undefined && humidityFromCurrent !== null) {
            return humidityFromCurrent;
        }

        const time = current?.time;
        const hourly = weatherData.hourly;
        const hourlyHumidity = hourly?.relativehumidity_2m;
        const hourlyTime = hourly?.time;

        if (time && Array.isArray(hourlyTime) && Array.isArray(hourlyHumidity)) {
            const index = hourlyTime.indexOf(time);
            if (index >= 0) {
                return hourlyHumidity[index] ?? null;
            }
        }

        return null;
    }

    // Obtiene información de usuario y clima usando la IP pública del cliente.
    async getUserInfoAsync() {

        const ipData = await this.fetchIpInfoAsync();
        const latitude = ipData.latitude || ipData.lat;
        const longitude = ipData.longitude || ipData.lon;
        const countryCode = ipData.country_code || ipData.country;

        if (!latitude || !longitude) {
            throw new Error('No se pudo obtener la latitud y longitud desde ipapi.co');
        }

        const weatherData = await this.fetchWeatherAsync(latitude, longitude);
        const currentWeather = weatherData.current_weather;
        const temperature = currentWeather?.temperature ?? null;
        const humidity = this.getHumidityFromWeather(weatherData);
        const weatherCode = currentWeather?.weathercode ?? currentWeather?.weather_code ?? null;

        const countryData = await this.fetchCountryByCodeAsync(countryCode);
        const currencyCode = this.getCurrencyCode(countryData?.currencies);

        return new clima(
            ipData.ip,
            ipData.city,
            ipData.region,
            ipData.country,
            countryData?.name?.common ?? ipData.country_name ?? ipData.country,
            countryCode,
            Number(latitude),
            Number(longitude),
            temperature,
            humidity,
            weatherCode,
            currencyCode,
            currentWeather,
            countryData
        );
    }

    async getWeatherByCountryAsync(country) {
        console.log(`climaService.getWeatherByCountryAsync(${country})`);

        if (!country || country.toString().trim().length === 0) {
            throw new Error('El parámetro country es obligatorio');
        }

        const countryData = await this.fetchCountryByNameOrCodeAsync(country);
        const latlng = this.getCountryLatLng(countryData);

        if (!Array.isArray(latlng) || latlng.length < 2) {
            throw new Error(`No se encontró latitud/longitud para el país especificado: ${country}`);
        }

        const latitude = latlng[0];
        const longitude = latlng[1];
        const weatherData = await this.fetchWeatherAsync(latitude, longitude);
        const currentWeather = weatherData.current_weather;
        const temperature = currentWeather?.temperature ?? null;
        const humidity = this.getHumidityFromWeather(weatherData);
        const weatherCode = currentWeather?.weathercode ?? currentWeather?.weather_code ?? null;
        const currencyCode = this.getCurrencyCode(countryData?.currencies);

        return {
            country: countryData?.name?.common ?? country,
            country_code: countryData?.cca2 ?? country,
            currency_code: currencyCode,
            latitude,
            longitude,
            temperature,
            humidity,
            weather_code: weatherCode,
            weather: currentWeather,
            country_info: countryData
        };
    }
}
