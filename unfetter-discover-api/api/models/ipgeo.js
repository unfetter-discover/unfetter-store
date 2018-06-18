class IPGeoProvider {

    constructor(id, url, active = true, batchSeparator = null) {
        this.id = id;
        this.url = url;
        this.active = active;
        this.batchSeparator = batchSeparator;
        this.setKey = req => {};
    }

    withHeaderKey(header, key) {
        this.setKey = req => {
            req.headers = { header, key, };
        };
        return this;
    }

    withQueryParamKey(param, key) {
        this.setKey = req => {
            req.uri = `${req.uri}${(req.uri.indexOf('?') > 0) ? '&' : '?'}${param}=${key}`;
        };
        return this;
    }

}

module.exports = { IPGeoProvider };
