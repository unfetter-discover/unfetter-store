const XUnfetterThreatBoard = {
    endpoint: 'x-unfetter-threat-boards',
    type: 'x-unfetter-threat-board',
    attributes: {
        boundaries: {
            end_date: '2018-09-13T13:52:21.862Z',
            intrusion_sets: [
                'intrusion-set--16974637-3258-4041-b70c-74693f0cfdb5'
            ],
            malware: [
                'malware--26974637-3258-4041-b70c-74693f0cfdb'
            ],
            start_date: '2018-09-13T13:52:21.862Z',
            targets: [
                'Wigets & Associates'
            ]
        },
        reports: [
            'report--36974637-3258-4041-b70c-74693f0cfdb'
        ],
        created_by_ref: 'identity--4ac44385-691d-411a-bda8-027c61d68e99',
        description: 'lorem ipsum',
        name: 'lorem'
    }
};

XUnfetterThreatBoard.attributes.x_extended_property_test = 'testvalue';
module.exports = XUnfetterThreatBoard;
