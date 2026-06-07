export const hasPermission = (user, moduleName, permissionType = 'View') => {
    if (!user || !Array.isArray(user.permissions)) return false;

    const acceptedTypes = permissionType === 'View'
        ? ['View', 'Read']
        : permissionType === 'Read'
            ? ['Read', 'View']
            : permissionType === 'Edit'
                ? ['Edit', 'Update']
                : permissionType === 'Update'
                    ? ['Update', 'Edit']
                    : [permissionType];

    return user.permissions.some(permission =>
        permission.moduleName === moduleName &&
        acceptedTypes.includes(permission.permissionType)
    );
};

export const groupPermissionsByModule = (permissions = []) => {
    return permissions.reduce((groups, permission) => {
        if (!groups[permission.moduleName]) {
            groups[permission.moduleName] = [];
        }
        groups[permission.moduleName].push(permission);
        return groups;
    }, {});
};
