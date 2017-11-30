import * as Validator from 'validator';
import { UrlTranslationRequest } from '../models/adapter/url-translation-request';
import { UrlTranslationResponse } from '../models/adapter/url-translation-response';
import { StixLookupMongoService } from '../services/stix-lookup-mongo.service';

/**
 * @description adapt system urls from one form to another
 */
export class SystemUrlAdapter {

    protected stixLookupService: StixLookupMongoService;
    protected readonly parseOpts = { require_valid_protocol: true, require_host: false, require_protocol: false };

    constructor() {
        this.stixLookupService = new StixLookupMongoService();
    }

    public setStixLookupService(service: StixLookupMongoService): void {
        this.stixLookupService = service;
    }

    /**
     * @description attempts to find a translation rule in the database and apply it
     * @param {UrlTranslationRequest} translationReq
     * @return {Promise<UrlTranslationResponse>} response containing a success true or false flag
     */
    public async translateUrl(translationReq: UrlTranslationRequest): Promise<UrlTranslationResponse> {
        const res = new UrlTranslationResponse();
        res.request = translationReq;
        if (!translationReq || !translationReq.systemName || !translationReq.url) {
            return Promise.reject(res);
        }

        const url = translationReq.url ? translationReq.url.trim() : '';
        res.translated.success = false;
        res.translated.url = url;
        if (!Validator.isURL(url, this.parseOpts)) {
            return Promise.resolve(res);
        }

        const translationRule = await this.stixLookupService.findUrlAdapterRule(translationReq.systemName);
        if (!translationRule) {
            return Promise.resolve(res);
        }

        const searchPattern = new RegExp(translationRule.searchPattern, 'gim');
        const replacePattern = translationRule.replacementPattern;
        const translated = url.replace(searchPattern, replacePattern);
        res.translated.success = true;
        res.translated.url = translated;
        return Promise.resolve(res);
    }
}
