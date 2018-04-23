export default class StixToUnfetterAdapater {
    /**
     * @param  {any[]} stixToUpload
     * @param  {any[]} enhancedPropsToUpload
     * @returns void
     * @description Finds STIX by ID and adds enhanced extended and enhanced properties
     */
    public static enhanceStix(stixToUpload: any[], enhancedPropsToUpload: any[]): void {
        enhancedPropsToUpload.forEach((enhancedProps: any) => {
            const stixToEnhance = stixToUpload.find((stix: any) => stix._id === enhancedProps.id);
            if (stixToEnhance) {
                if (enhancedProps.extendedProperties !== undefined) {
                    stixToEnhance.extendedProperties = enhancedProps.extendedProperties;
                }

                if (enhancedProps.metaProperties !== undefined) {
                    stixToEnhance.metaProperties = {
                        ...stixToEnhance.metaProperties,
                        ...enhancedProps.metaProperties
                    };
                }
            } else {
                // TODO attempt to upload to database if not in processed STIX document (maybe? idk!)
                console.log('STIX property enhancement failed - Unable to find matching stix for: ', enhancedProps._id);
            }
        });
    }  

    /**
     * @param  {any[]} stixToUpload
     * @returns void
     * @description Sets `published` to true for all STIX documents
     */
    public static autoPublish(stixToUpload: any[]): void {
        stixToUpload.forEach((stix: any) => {
            if (stix.metaProperties === undefined) {
                stix.metaProperties = {};
            }
            stix.metaProperties.published = true;
        });
    }

    /**
     * @param  {any[]} stixToUpload
     * @returns void
     * @description Records modified value at time of ingest into metaProperties
     *      so it can be accessible if the document is modified in Unfetter
     */
    public static saveModified(stixToUpload: any[]): void {
        stixToUpload.forEach((stix: any) => {
            if (stix.stix.modified) {
                if (stix.metaProperties === undefined) {
                    stix.metaProperties = {};
                }
                try {
                    stix.metaProperties.modified_at_ingest = new Date(stix.stix.modified);
                } catch (error) {
                    console.log('Unable to parse modifed date from: ', stix._id);
                }
            }
        });
    }    
}
