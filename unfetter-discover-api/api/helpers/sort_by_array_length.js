module.exports = (a, b, field) => {
    if (a.metaProperties && a.metaProperties[field] && (!b.metaProperties || !b.metaProperties[field])) {
        return -1;
    } else if ((!a.metaProperties || !a.metaProperties[field]) && b.metaProperties && b.metaProperties[field]) {
        return 1;
    } else if (a.metaProperties && a.metaProperties[field] && b.metaProperties && b.metaProperties[field]) {
        return b.metaProperties[field].length - a.metaProperties[field].length;
    }
    return 0;
};
