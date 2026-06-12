import paisService from '../application/services/paisService.js';

const paisServiceInstance = new paisService();

export async function extractPaisInfo(code, remoteData = null) {
    let countryName = null;

    if (remoteData) {
        countryName = remoteData.country || remoteData.Country || null;
        if (!countryName && remoteData.name) {
            countryName = typeof remoteData.name === 'object' ? remoteData.name.common : remoteData.name;
        }
        if (!countryName) {
            countryName = remoteData.pais || null;
        }
    }

    if (countryName) {
        try {
            return await paisServiceInstance.getByNameAsync(countryName);
        } catch (err) {
            console.error(`extractPaisInfo: error buscando país por nombre "${countryName}":`, err);
        }
    }

    return null;
}
