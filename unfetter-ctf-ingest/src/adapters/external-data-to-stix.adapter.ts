import { ExternalDataTranslationRequest } from '../models/adapter/external-data-translation-request';
import { ExternalDataTranslationResponse } from '../models/adapter/external-data-translation-response';
import { WrappedStix } from '../models/wrapped-stix';
import { StixLookupMongoService } from '../services/stix-lookup-mongo.service';

// tslint:disable-next-line:no-var-requires
const jspath = require('jspath');

/**
 * @description adapt system urls from one form to another
 */
export class ExternalDataToStixAdapter {

    protected stixLookupService: StixLookupMongoService;

    constructor() {
        this.stixLookupService = new StixLookupMongoService();
    }

    public setStixLookupService(service: StixLookupMongoService): void {
        this.stixLookupService = service;
    }

    public async translateData(req: ExternalDataTranslationRequest): Promise<ExternalDataTranslationResponse> {
        const res = new ExternalDataTranslationResponse();
        res.request = req;
        if (!req || !req.systemName || !req.payload) {
            return Promise.reject(res);
        }

        const systemName = req.systemName ? req.systemName.trim() : '';
        const translationRules = await this.stixLookupService.findDataAdapterRules(systemName);
        if (!translationRules || !translationRules.rules || translationRules.rules.length === 0) {
            res.translated.success = false;
            return Promise.resolve(res);
        }

        // apply rules
        let targetObj = new WrappedStix();
        const payload = req.payload;
        const rules = translationRules.rules;
        rules
            .filter((rule) => rule !== undefined)
            .map((rule) => {
                const jsonPath = rule.jsonPath;
                const stixPath = rule.stixPath;
                targetObj = this.buildStix(payload, jsonPath, stixPath, targetObj);
            });

        res.translated.success = true;
        res.translated.payload = targetObj;
        return Promise.resolve(res);
    }

    /**
     * @description
     * @param {any} sourceObj
     * @param jsonPath
     * @param stixPath
     * @param {any} targetObj stix data
     * @return {any} stix target object, with new data applied
     */
    public buildStix(sourceObj: any, jsonPath: string, stixPath: string, targetObj: any): any {
        const srcData = jspath.apply(jsonPath, sourceObj);

        // we did not find data at given path
        if (!srcData || srcData.length === 0) {
            console.log('did not find data at path', jsonPath);
            return targetObj;
        }

        const data = srcData[0];
        // console.log(srcData);
        // console.log(jsonPath);
        // console.log(stixPath);
        // console.log(targetObj);
        const markings = 'granular_markings';
        const externalRefs = 'external_references';
        const path = stixPath.split('.');
        const dataEl = path.pop() || '';
        if (path.length > 0) {
            this.ensureDataShape(targetObj, path);
        }
        const leafObj = this.traverseObjectGraph(targetObj, path);
        leafObj[dataEl] = data;
        return targetObj;
    }

    /**
     * @description build out empty objects and arrays on the data object given using the paths given
     * @param {any} data
     * @param {sting[]} path array in the form of 'stix', 'stix.id', stix.description'
     */
    private ensureDataShape(data: any, path: string[]): any {
        const markings = 'granular_markings';
        const externalRefs = 'external_references';
        path.reduce((memo, context) => {
            const curContext = memo[context];
            if (typeof curContext === 'undefined') {
                if (context === markings || context === externalRefs) {
                    memo[context] = [{}];
                } else {
                    memo[context] = {};
                }
            }
            return memo[context];
        }, data);
        return data;
    }

    /**
     * @description
     * @param {any} data
     * @param {string[]} path
     * @return {any} leaf data element of the given path in the given data object
     */
    private traverseObjectGraph(data: any, path: string[]): any {
        let curPath = data;
        path.forEach((context) => {
            curPath = curPath[context];
            if (Array.isArray(curPath)) {
                curPath = curPath[0];
            } else {
                curPath = curPath;
            }
        });
        return curPath;
    }
}
