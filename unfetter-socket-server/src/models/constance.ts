export const Constance = {
    links: {
        uiUrl: process.env.UI_URL || 'https://localhost/',
        approveUsers: '/admin/approve-users',
        unfetterHomepage: 'https://iadgov.github.io/unfetter/',
        unfetterContact: process.env.SERVICE_EMAIL ? `mailto:${process.env.SERVICE_EMAIL}` : 'mailto:fakeadmin@fakeunfetter.com'
    }
};
