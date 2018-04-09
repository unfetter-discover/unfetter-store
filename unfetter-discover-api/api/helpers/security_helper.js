/**
 * @description tests if this is an admin in a valid state
 * @param {*} user
 * @returns true if this user object has the admin role and is not locked, otherwise false
 */
const isAdmin = user => {
    if (!user) {
        return false;
    }

    const role = user.role;
    const isLocked = user.locked;
    const isApproved = user.approved;
    const isTruthy = el => typeof el === 'boolean' && el === true;
    if (role === 'ADMIN' && !isTruthy(isLocked) && isTruthy(isApproved)) {
        return true;
    }

    return false;
};

/**
 * @description
 * A user can see an object if and only if
 *  the object is open to all
 *      ie, the object has a created_by_ref, with a group of unfetter open
 *  current user is admin
 *      ie, the user has the ADMIN role in the database and is seen in the request object
 *  current user has created_by_ref org
 *      ie, the object has a created_by_ref, with a group id this current user belongs
 *  the function is requested as read = true, and an object has published = true
 *
 * @param {*} query a mongo query object
 * @param {*} user user object found for the current user
 * @param {boolean} read - default to true, allows users to see 'published' items as readonly
 * @returns {object} mongo query, with security filter attached
 */
const applySecurityFilter = (query, user, read = true) => {
    if (!query || process.env.RUN_MODE !== 'UAC' || !user) {
        console.log(`skipping filter for query=${query}, RUN_MODE=${process.env.RUN_MODE}, user=${user}`);
        return query;
    }

    const hasAdmin = isAdmin(user);
    // if admin, do not apply security filter
    if (hasAdmin === true) {
        console.log(`skipping filter for admin ${user.id}`);
        return query;
    }

    const unfetterOpenUserId = global.unfetter.openIdentity._id || '';
    const userOrgs = user.organizations || [];
    const orgs = userOrgs
        .map(o => o.toObject())
        .filter(o => o.approved) || [];

    const currentUserOrgIds = orgs.map(el => el.id);
    const hasOpenId = currentUserOrgIds.findIndex(el => el === unfetterOpenUserId) > -1;
    if (hasOpenId === false) {
        currentUserOrgIds.push(unfetterOpenUserId);
    }

    const orgIds = [...currentUserOrgIds]
        .filter(el => el !== undefined)
        .map(el => el.trim())
        .filter(el => el.length > 0)
        .sort((a, b) => {
            if (a === b) {
                return 0;
            }

            if (a > b) {
                return -1;
            }
            return 1;
        });

    let securityFilter;

    // Apply more exceptions mode for applying read permissions
    if (read) {
        securityFilter = {
            $or: [
                { 'metaProperties.published': true },
                { 'stix.created_by_ref': { $exists: true, $in: orgIds } }
            ]
        };
    } else {
        securityFilter = { 'stix.created_by_ref': { $exists: true, $in: orgIds } };
    }

    return { ...query, ...securityFilter };
};

module.exports = {
    applySecurityFilter,
    isAdmin,
};
