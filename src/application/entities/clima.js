export default class clima {
    constructor(ip, city, region, country, countryName, countryCode, latitude, longitude, temperature, humidity, weatherCode, currencyCode, weatherData, countryData) {
        this.ip = ip;
        this.city = city;
        this.region = region;
        this.country = country;
        this.country_name = countryName;
        this.country_code = countryCode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.temperature = temperature;
        this.humidity = humidity;
        this.weather_code = weatherCode;
        this.currency_code = currencyCode;
        this.weather = weatherData;
        this.country_info = countryData;
    }
}
