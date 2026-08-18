// frontend/src/modules/fileProcessor/index.js
import platforms from './platforms';
import tax from './tax';
import certificates from './certificates';

export { platforms, tax, certificates };

export const getPlatformParser = (platformName) => {
    const key = platformName.toLowerCase();
    return platforms[key] || null;
};

export const getTaxCalculator = (countryCode) => {
    const key = countryCode.toUpperCase();
    return tax[key] || null;
};

export const getCertificateHandler = (type) => {
    const key = type.toLowerCase();
    return certificates[key] || null;
};

export const getSupportedPlatforms = () => Object.keys(platforms);
export const getSupportedCountries = () => Object.keys(tax);

export default {
    platforms,
    tax,
    certificates,
    getPlatformParser,
    getTaxCalculator,
    getCertificateHandler,
    getSupportedPlatforms,
    getSupportedCountries,
};