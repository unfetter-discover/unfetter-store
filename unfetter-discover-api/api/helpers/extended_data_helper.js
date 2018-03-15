

/**
 * @description method to accept stix data and rewrite the extended and metadata fields for storage into mongo
 * ie 
 * @code { extendedproperties, stix, metaProperties } => { stix: { extendedproperties, metaProperties }}
 * @param {*} result 
 * @param {*} swaggerParams 
 * @returns {object} object with extended fields rewritten, as needed
 */
const getEnhancedData = (result, swaggerParams) => {
    let data;
    // No params present
    if (swaggerParams.extendedproperties === undefined && swaggerParams.metaproperties === undefined) {
        return result
            .map(res => res.toObject())
            .map(res => res.stix);
    }

    // no extended or meta properties
    if (swaggerParams.extendedproperties !== undefined && swaggerParams.extendedproperties.value !== undefined && swaggerParams.extendedproperties.value === false && (swaggerParams.metaproperties !== undefined && swaggerParams.metaproperties.value === undefined || swaggerParams.metaproperties.value === false)) {
        data = result
            .map(res => res.toObject())
            .map(res => res.stix);

        // both extended and meta properties
    } else if ((swaggerParams.extendedproperties !== undefined && swaggerParams.extendedproperties.value === undefined || swaggerParams.extendedproperties.value === true) && swaggerParams.metaproperties !== undefined && swaggerParams.metaproperties.value !== undefined && swaggerParams.metaproperties.value === true) {
        data = result
            .map(res => res.toObject())
            .map(res => {
                let temp = res.stix;
                if (res.extendedProperties !== undefined) {
                    temp = { ...temp, ...res.extendedProperties };
                }
                if (res.metaProperties !== undefined) {
                    temp = { ...temp, metaProperties: res.metaProperties };
                }
                return temp;
            });

        // Exteded properties only
    } else if (((swaggerParams.extendedproperties !== undefined && swaggerParams.extendedproperties.value === undefined) || swaggerParams.extendedproperties.value === true) && (swaggerParams.metaproperties !== undefined && swaggerParams.metaproperties.value === undefined || swaggerParams.metaproperties.value === false)) {
        data = result
            .map(res => res.toObject())
            .map(res => {
                if (res.extendedProperties !== undefined) {
                    return { ...res.stix, ...res.extendedProperties };
                } else {
                    return res.stix;
                }
            });

        // Meta properties only
    } else if (swaggerParams.extendedproperties !== undefined && swaggerParams.extendedproperties.value !== undefined && swaggerParams.extendedproperties.value === false && swaggerParams.metaproperties !== undefined && swaggerParams.metaproperties.value !== undefined && swaggerParams.metaproperties.value === true) {
        data = result
            .map(res => res.toObject())
            .map(res => {
                if (res.metaProperties !== undefined) {
                    return { ...res.stix, metaProperties: res.metaProperties };
                } else {
                    return res.stix;
                }
            });

        // Delete this if this function works!
    } else {
        console.log('DOOOOM!!!! This block should never be reached.');
    }
    return data;
}

module.exports = {
    getEnhancedData,
};
