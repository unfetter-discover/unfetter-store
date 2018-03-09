/**
 * @description tests if this is an admin in a valid state
 * @param {*} user
 * @returns true if this user object has the admin role and is not locked, otherwise false 
 */
const isAdmin = (user) => {
    if (!user) {
        return false;
    }

    const role = user.role;
    const isLocked = user.locked;
    const isApproved = user.approved;
    const isTruthy = (el) => typeof el === 'boolean' && el === true;
    if (role === 'ADMIN' && !isTruthy(isLocked) && isTruthy(isApproved)) {
        return true;
    }

    return false;
}

/**
 * @description
 * A user can see an object iff
 *  the object is open to all
 *      ie, the object has a created_by_ref, with a group of unfetter open
 *  current user is admin
 *      ie, the user has the ADMIN role in the database and is seen in the request object
 *  current user has created_by_ref org
 *      ie, the object has a created_by_ref, with a group id this current user belongs
 * 
 * @param {*} query a mongo query object 
 * @param {*} user user object found for the current user
 * @returns {object} mongo query, with security filter attached
 */
const applySecurityFilter = (query, user) => {
    if (!query || process.env.RUN_MODE !== 'UAC' || !user) {
        return query;
    }

    const hasAdmin = isAdmin(user);
    // if admin, do not apply security filter
    if (hasAdmin === true) {
        return query;
    }

    const unfetterOpenUserId = global.unfetter.openIdentity._id || '';
    const orgs = user.organizations || [];
    const currentUserOrgIds = orgs.map((el) => el.id);
    const hasOpenId = currentUserOrgIds.findIndex((el) => el === unfetterOpenUserId) > -1;
    if (hasOpenId === false) {
        currentUserOrgIds.push(unfetterOpenUserId);
    }

    const orgIds = [...currentUserOrgIds]
        .filter((el) => el !== undefined)
        .map((el) => el.trim())
        .filter((el) => el.length > 0)
        .sort((a, b) => {
            if (a === b) {
                return 0;
            }

            if (a > b) {
                return -1;
            } else {
                return 1;
            }
        });

    const securityFilter = { 'stix.created_by_ref': { $exists: true, $in: orgIds } };
    return { ...query, ...securityFilter };
}

module.exports = {
    applySecurityFilter,
    isAdmin,
};