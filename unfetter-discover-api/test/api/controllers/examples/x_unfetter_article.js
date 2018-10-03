const XUnfetterArticle = {
    endpoint: 'x-unfetter-articles',
    type: 'x-unfetter-article',
    attributes: {
        content: 'Article content',
        sources: ['report--4ac44385-691d-411a-bda8-027c61d68e98'],
        created_by_ref: 'identity--4ac44385-691d-411a-bda8-027c61d68e99',
        description: 'lorem ipsum',
        name: 'lorem'
    }
};

XUnfetterArticle.attributes.x_extended_property_test = 'testvalue';
module.exports = XUnfetterArticle;
