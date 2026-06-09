import axios from 'axios';
import https from 'https';
import clima from '../entities/clima.js';

const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === 'production'
    })
});

export default class climaService {
    // Constructor vacío, sin logs innecesarios
    constructor() {}

    async fetchIpInfoAsync() {
        const { data } = await axiosInstance.get('https://ipapi.co/json/');
        return data;
    }

    async fetchWeatherAsync(latitude, longitude) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`;
        const { data } = await axiosInstance.get(url);
        return data;
    }

    async fetchCountryByCodeAsync(countryCode) {
        const { data } = await axiosInstance.get(`https://restcountries.com/v3.1/alpha/${countryCode}`);
        return data?.[0] ?? null;
    }

    async fetchCountryByNameOrCodeAsync(countryIdentifier) {
        const normalized = String(countryIdentifier).trim();
        const isCode = /^[A-Za-z]{2,3}$/.test(normalized);
        const url = isCode
            ? `https://restcountries.com/v3.1/alpha/${normalized}`
            : `https://restcountries.com/v3.1/name/${encodeURIComponent(normalized)}?fullText=false`;

        const { data } = await axiosInstance.get(url);
        return Array.isArray(data) ? data[0] : data;
    }

    getCurrencyCode(currencies) {
        return currencies && typeof currencies === 'object' ? Object.keys(currencies)[0] ?? null : null;
    }

    getCountryLatLng(countryData) {
        const latlng = countryData?.capitalInfo?.latlng ?? countryData?.latlng;
        return Array.isArray(latlng) && latlng.length >= 2 ? [latlng[0], latlng[1]] : null;
    }

    getHumidityFromWeather(weatherData) {
        const current = weatherData?.current_weather;
        if (!current) return null;
        const direct = current?.relativehumidity_2m ?? current?.relative_humidity_2m;
        if (direct !== undefined) return direct;

        const time = current?.time;
        const hourlyTime = weatherData?.hourly?.time;
        const hourlyHumidity = weatherData?.hourly?.relativehumidity_2m;
        if (time && Array.isArray(hourlyTime) && Array.isArray(hourlyHumidity)) {
            const idx = hourlyTime.indexOf(time);
            return idx >= 0 ? hourlyHumidity[idx] ?? null : null;
        }

        return null;
    }

    async getUserInfoAsync() {
        const ipData = await this.fetchIpInfoAsync();
        const latitude = ipData.latitude ?? ipData.lat;
        const longitude = ipData.longitude ?? ipData.lon;
        const countryCode = ipData.country_code ?? ipData.country;

        if (!latitude || !longitude) throw new Error('No se pudo obtener la latitud y longitud desde ipapi.co');

        const weatherData = await this.fetchWeatherAsync(latitude, longitude);
        const currentWeather = weatherData?.current_weather ?? null;
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
        if (!country || String(country).trim() === '') throw new Error('El parámetro country es obligatorio');

        const countryData = await this.fetchCountryByNameOrCodeAsync(country);
        const latlng = this.getCountryLatLng(countryData);
        if (!latlng) throw new Error(`No se encontró latitud/longitud para el país especificado: ${country}`);

        const [latitude, longitude] = latlng;
        const weatherData = await this.fetchWeatherAsync(latitude, longitude);
        const currentWeather = weatherData?.current_weather ?? null;
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
