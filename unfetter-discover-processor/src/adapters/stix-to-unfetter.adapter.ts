import { IUFStix, IEnhancedProperties, IStix } from '../models/interfaces';

export default class StixToUnfetterAdapater {
    /**
     * @param  {IUFStix[]} stixToUpload
     * @param  {IEnhancedProperties[]} enhancedPropsToUpload
     * @returns void
     * @description Finds STIX by ID and adds enhanced extended and enhanced properties
     */
    public static enhanceStix(stixToUpload: IUFStix[], enhancedPropsToUpload: IEnhancedProperties[]): void {
        enhancedPropsToUpload.forEach((enhancedProps: IEnhancedProperties) => {
            const stixToEnhance = stixToUpload.find((stix: IUFStix) => stix._id === enhancedProps.id);
            if (stixToEnhance) {
                if (enhancedProps.extendedProperties !== undefined) {
                    stixToEnhance.extendedProperties = enhancedProps.extendedProperties;
                }
                
                if (enhancedProps.metaProperties !== undefined) {
                    stixToEnhance.metaProperties = enhancedProps.metaProperties;
                }
            } else {
                // TODO attempt to upload to database if not in processed STIX document (maybe? idk!)
                console.log('STIX property enhancement failed - Unable to find matching stix for: ', enhancedProps.id);
            }
        });
    }  

    /**
     * @param  {IUFStix[]} stixToUpload
     * @returns void
     * @description Sets `published` to true for all STIX documents
     */
    public static autoPublish(stixToUpload: IUFStix[]): void {
        stixToUpload.forEach((stix: IUFStix) => {
            if (stix.metaProperties === undefined) {
                stix.metaProperties = {};
            }
            stix.metaProperties.published = true;
        });
    }

    /**
     * @param  {IUFStix[]} stixToUpload
     * @returns void
     * @description Records modified value at time of ingest into metaProperties
     *      so it can be accessible if the document is modified in Unfetter
     */
    public static saveModified(stixToUpload: IUFStix[]): void {
        stixToUpload.forEach((stix: IUFStix) => {
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

    /**
     * @param  {IStix} stix
     * @returns IUFStix
     * @description Transform STIX into an Unfetter MongoDB document by moving STIX core
     *      properties to `stix` and custom x_ properties to `extendedProperties`
     */
    public static stixToUnfetterStix(stix: IStix): IUFStix {
        const safeStix = { ...stix };
        const retVal: IUFStix | any = {
            _id: stix.id,
            stix: {}
        };
        for (const prop in safeStix) {
            if (prop.match(/^x_/) !== null) {
                if (retVal.extendedProperties === undefined) {
                    retVal.extendedProperties = {};
                }
                retVal.extendedProperties[prop] = safeStix[prop];
            } else {
                retVal.stix[prop] = safeStix[prop];
            }
        }
        return retVal;
    }
}
