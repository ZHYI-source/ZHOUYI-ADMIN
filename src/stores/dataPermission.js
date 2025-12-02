import {defineStore} from 'pinia';
import dbUtils from '@/utils/util.strotage.js';

/**
 * 数据权限类型枚举
 */
const DATA_PERMISSION_TYPE = {
    ALL: 'all', // 全部数据权限
    DEPARTMENT_SELF: 'department_self', // 本部门数据权限
    DEPARTMENT_CHILDREN: 'department_children', // 本部门及子部门数据权限
    ASSIGNED: 'assigned', // 自定义分配的数据权限
    SPECIFIC: 'specific' // 特定部门数据权限
};

/**
 * 数据权限标识类型枚举
 */
const DATA_PERMISSION_TARGET = {
    USER: 'user',
    ROLE: 'role',
    DEPARTMENT: 'department'
};

/**
 * 数据权限验证结果枚举
 */
const DATA_PERMISSION_RESULT = {
    ALLOW: 'allow', // 允许访问
    DENY: 'deny', // 拒绝访问
    FILTER: 'filter' // 需要过滤数据后访问
};

export const useDataPermissionStore = defineStore('dataPermission', () => {
    // 数据权限规则列表
    const dataPermissionRules = ref([]);
    // 部门树形结构数据
    const departmentTree = ref([]);
    // 缓存的用户数据权限信息
    const userDataPermissions = ref({});

    /**
     * 初始化数据权限
     */
    function initDataPermission() {
        // 从本地存储获取数据权限规则
        const storedRules = dbUtils.get('dataPermissionRules');
        if (storedRules && storedRules.length) {
            dataPermissionRules.value = storedRules;
        }

        // 从本地存储获取部门树结构
        const storedDeptTree = dbUtils.get('departmentTree');
        if (storedDeptTree && storedDeptTree.length) {
            departmentTree.value = storedDeptTree;
        }

        // 获取用户数据权限缓存
        const storedUserPermissions = dbUtils.get('userDataPermissions');
        if (storedUserPermissions) {
            userDataPermissions.value = storedUserPermissions;
        }
    }

    /**
     * 保存数据权限规则
     * @param {Array} rules - 数据权限规则列表
     */
    function saveDataPermissionRules(rules) {
        dataPermissionRules.value = rules;
        dbUtils.set('dataPermissionRules', rules);
    }

    /**
     * 保存部门树形结构数据
     * @param {Array} deptTree - 部门树结构数据
     */
    function saveDepartmentTree(deptTree) {
        departmentTree.value = deptTree;
        dbUtils.set('departmentTree', deptTree);
    }

    /**
     * 更新用户数据权限缓存
     * @param {String} userId - 用户ID
     * @param {Object} permissions - 数据权限信息
     */
    function updateUserDataPermission(userId, permissions) {
        userDataPermissions.value[userId] = permissions;
        dbUtils.set('userDataPermissions', userDataPermissions.value);
    }

    /**
     * 获取用户的数据权限
     * @param {String} userId - 用户ID
     * @returns {Object} 用户数据权限信息
     */
    function getUserDataPermission(userId) {
        return userDataPermissions.value[userId] || {};
    }

    /**
     * 验证数据权限
     * @param {String} userId - 用户ID
     * @param {String} resourceType - 资源类型
     * @param {Object} data - 待验证的数据对象
     * @returns {String} 验证结果（ALLOW, DENY, FILTER）
     */
    function checkDataPermission(userId, resourceType, data) {
        const userPermission = getUserDataPermission(userId);
        
        // 如果没有数据权限限制，允许访问
        if (!userPermission[resourceType]) {
            return DATA_PERMISSION_RESULT.ALLOW;
        }

        const permissionRule = userPermission[resourceType];
        const dataDeptId = data?.deptId;

        switch (permissionRule.type) {
            case DATA_PERMISSION_TYPE.ALL:
                return DATA_PERMISSION_RESULT.ALLOW;
                
            case DATA_PERMISSION_TYPE.DEPARTMENT_SELF:
                if (!dataDeptId || dataDeptId === permissionRule.deptId) {
                    return DATA_PERMISSION_RESULT.ALLOW;
                }
                return DATA_PERMISSION_RESULT.DENY;
                
            case DATA_PERMISSION_TYPE.DEPARTMENT_CHILDREN:
                if (!dataDeptId) return DATA_PERMISSION_RESULT.ALLOW;
                const isInDept = isInDepartmentHierarchy(dataDeptId, permissionRule.deptId);
                return isInDept ? DATA_PERMISSION_RESULT.ALLOW : DATA_PERMISSION_RESULT.DENY;
                
            case DATA_PERMISSION_TYPE.ASSIGNED:
                if (!dataDeptId) return DATA_PERMISSION_RESULT.ALLOW;
                const hasPermission = permissionRule.deptIds.includes(dataDeptId);
                return hasPermission ? DATA_PERMISSION_RESULT.ALLOW : DATA_PERMISSION_RESULT.DENY;
                
            case DATA_PERMISSION_TYPE.SPECIFIC:
                if (!dataDeptId) return DATA_PERMISSION_RESULT.ALLOW;
                const hasSpecificPermission = permissionRule.deptIds.includes(dataDeptId);
                return hasSpecificPermission ? DATA_PERMISSION_RESULT.ALLOW : DATA_PERMISSION_RESULT.DENY;
                
            default:
                return DATA_PERMISSION_RESULT.ALLOW;
        }
    }

    /**
     * 获取数据权限过滤条件
     * @param {String} userId - 用户ID
     * @param {String} resourceType - 资源类型
     * @returns {Object} 过滤条件对象
     */
    function getDataPermissionFilter(userId, resourceType) {
        const userPermission = getUserDataPermission(userId);
        
        // 如果没有数据权限限制，返回空对象
        if (!userPermission[resourceType]) {
            return {};
        }

        const permissionRule = userPermission[resourceType];
        const filter = {}

        switch (permissionRule.type) {
            case DATA_PERMISSION_TYPE.ALL:
                return filter;
                
            case DATA_PERMISSION_TYPE.DEPARTMENT_SELF:
                filter.deptId = permissionRule.deptId;
                return filter;
                
            case DATA_PERMISSION_TYPE.DEPARTMENT_CHILDREN:
                filter.deptId = { $in: getAllDepartmentIds(permissionRule.deptId) };
                return filter;
                
            case DATA_PERMISSION_TYPE.ASSIGNED:
            case DATA_PERMISSION_TYPE.SPECIFIC:
                filter.deptId = { $in: permissionRule.deptIds };
                return filter;
                
            default:
                return filter;
        }
    }

    /**
     * 检查部门是否在指定部门的层级结构中
     * @param {String} targetDeptId - 目标部门ID
     * @param {String} ancestorDeptId - 祖先部门ID
     * @returns {Boolean} 是否在层级结构中
     */
    function isInDepartmentHierarchy(targetDeptId, ancestorDeptId) {
        if (targetDeptId === ancestorDeptId) return true;
        
        const department = findDepartmentById(departmentTree.value, targetDeptId);
        if (!department) return false;
        
        let currentDeptId = department.parentId;
        while (currentDeptId) {
            if (currentDeptId === ancestorDeptId) return true;
            const parentDept = findDepartmentById(departmentTree.value, currentDeptId);
            if (!parentDept) break;
            currentDeptId = parentDept.parentId;
        }
        
        return false;
    }

    /**
     * 获取指定部门及其所有子部门的ID列表
     * @param {String} deptId - 部门ID
     * @returns {Array} 部门ID列表
     */
    function getAllDepartmentIds(deptId) {
        const deptIds = [];
        
        function traverse(dept) {
            if (dept._id === deptId) {
                deptIds.push(dept._id);
            }
            if (dept.children) {
                dept.children.forEach(child => traverse(child));
            }
        }
        
        departmentTree.value.forEach(rootDept => traverse(rootDept));
        
        return deptIds;
    }

    /**
     * 递归查找部门节点
     * @param {Array} deptTree - 部门树结构
     * @param {String} deptId - 部门ID
     * @returns {Object} 部门节点
     */
    function findDepartmentById(deptTree, deptId) {
        for (const dept of deptTree) {
            if (dept._id === deptId) return dept;
            if (dept.children) {
                const found = findDepartmentById(dept.children, deptId);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * 清除数据权限缓存
     */
    function clearDataPermissionCache() {
        dataPermissionRules.value = [];
        departmentTree.value = [];
        userDataPermissions.value = {};
        dbUtils.remove('dataPermissionRules');
        dbUtils.remove('departmentTree');
        dbUtils.remove('userDataPermissions');
    }

    return {
        dataPermissionRules,
        departmentTree,
        userDataPermissions,
        DATA_PERMISSION_TYPE,
        DATA_PERMISSION_TARGET,
        DATA_PERMISSION_RESULT,
        initDataPermission,
        saveDataPermissionRules,
        saveDepartmentTree,
        updateUserDataPermission,
        getUserDataPermission,
        checkDataPermission,
        getDataPermissionFilter,
        isInDepartmentHierarchy,
        getAllDepartmentIds,
        clearDataPermissionCache
    };
});