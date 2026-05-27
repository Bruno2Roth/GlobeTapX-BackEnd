import axios from 'axios';
import currency from '../entities/currency.js';

export default class currencyService {
    constructor() {
        console.log('Estoy en: currencyService.constructor()');
        this.apiKey = process.env.CURRENCY_API_KEY;
        this.apiSecret = process.env.CURRENCY_API_SECRET;
    }

    normalizeCountry(country) {
        return country.toString().trim();
    }

    async getCurrencyByCountryAsync(country) {
        console.log(`currencyService.getCurrencyByCountryAsync(${country})`);

        const normalized = this.normalizeCountry(country);
        const url = `https://restcountries.com/v3.1/name/${normalized}`;
        
        const response = await axios.get(url);
        const data = response.data[0];

        if (!data || !data.currencies) {
            throw new Error(`No se encontró información de moneda para el país: ${country}`);
        }

        const currencyCodes = Object.keys(data.currencies);
        const currencyCode = currencyCodes[0];
        const currencyInfo = data.currencies[currencyCode];

        return {
            country: data.name.common,
            country_official: data.name.official,
            country_code: data.cca2,
            currency_code: currencyCode,
            currency_name: currencyInfo.name,
            currency_symbol: currencyInfo.symbol,
            currencies: data.currencies,
            flag: data.flag,
            region: data.region,
        };
    }

    validateConversionParams(fromCurrency, toCurrency, amount) {
        if (!fromCurrency || !toCurrency) {
            throw new Error('Debe indicar las monedas origen y destino');
        }

        const amountNumber = Number(amount);
        if (Number.isNaN(amountNumber) || amountNumber <= 0) {
            throw new Error('El monto debe ser un número mayor a cero');
        }

        return amountNumber;
    }

    buildRequestConfig() {
        return {
            baseURL: 'https://api.apilayer.com/exchangerates_data',
            headers: this.apiKey ? { apikey: this.apiKey } : {},
        };
    }

    normalizeCurrency(currency) {
        return currency.toString().trim().toUpperCase();
    }

    async convertWithApilayer(from, to, amountNumber) {
        const client = axios.create(this.buildRequestConfig());
        const response = await client.get('/convert', {
            params: { from, to, amount: amountNumber },
        });

        const data = response.data;
        const rate = data.info && data.info.rate ? data.info.rate : null;
        const convertedAmount = data.result;
        const date = data.date || null;

        if (!rate || convertedAmount === undefined || convertedAmount === null) {
            throw new Error('No se pudo obtener la conversión desde Apilayer');
        }

        return new currency(from, to, amountNumber, rate, convertedAmount, date, 'apilayer');
    }

    async convertWithExchangeRateHost(from, to, amountNumber) {
        const client = axios.create({ baseURL: 'https://open.er-api.com/v6' });
        const response = await client.get(`/latest/${from}`);

        const data = response.data;
        const rate = data.rates && data.rates[to] ? data.rates[to] : null;
        const convertedAmount = rate !== null ? amountNumber * rate : null;
        const date = data.time_last_update_utc || null;

        if (!rate || convertedAmount === undefined || convertedAmount === null) {
            throw new Error('No se pudo obtener la conversión desde open.er-api.com');
        }

        return new currency(from, to, amountNumber, rate, convertedAmount, date, 'open.er-api.com');
    }

    convertAsync = async (fromCurrency, toCurrency, amount) => {
        console.log(`currencyService.convertAsync(${fromCurrency}, ${toCurrency}, ${amount})`);

        const amountNumber = this.validateConversionParams(fromCurrency, toCurrency, amount);
        const from = this.normalizeCurrency(fromCurrency);
        const to = this.normalizeCurrency(toCurrency);

        if (this.apiKey) {
            try {
                return await this.convertWithApilayer(from, to, amountNumber);
            } catch (error) {
                console.log('Apilayer conversion failed:', error.message || error);
                console.log('Falling back to open.er-api.com because Apilayer no está disponible o la clave es inválida');
                return await this.convertWithExchangeRateHost(from, to, amountNumber);
                throw error;
            }
        }

        return await this.convertWithExchangeRateHost(from, to, amountNumber);
    }
}
