import { defineStore } from 'pinia';
import dbUtils from "@/utils/util.strotage.js";

/**
 * 数据权限状态管理
 * 管理基于用户/角色的数据范围权限控制
 */
export const useDataPermissionStore = defineStore("dataPermission", () => {
    // 数据权限配置
    const dataPermissions = ref([]);
    
    // 组织架构树
    const organizationTree = ref([]);
    
    // 当前用户的数据权限
    const userDataPermissions = ref([]);
    
    // 加载数据权限配置
    const loadDataPermissions = async () => {
        try {
            // 从本地缓存加载数据权限配置
            const cachedPermissions = dbUtils.get('dataPermissions');
            if (cachedPermissions) {
                dataPermissions.value = cachedPermissions;
            }
            
            // 加载组织架构树
            const cachedOrganization = dbUtils.get('organizationTree');
            if (cachedOrganization) {
                organizationTree.value = cachedOrganization;
            }
            
            // 加载当前用户的数据权限
            const cachedUserPermissions = dbUtils.get('userDataPermissions');
            if (cachedUserPermissions) {
                userDataPermissions.value = cachedUserPermissions;
            }
            
            return true;
        } catch (error) {
            console.error('加载数据权限配置失败:', error);
            return false;
        }
    };
    
    // 保存数据权限配置
    const saveDataPermissions = async (permissions) => {
        try {
            dataPermissions.value = permissions;
            dbUtils.set('dataPermissions', permissions);
            return true;
        } catch (error) {
            console.error('保存数据权限配置失败:', error);
            return false;
        }
    };
    
    // 保存组织架构树
    const saveOrganizationTree = async (tree) => {
        try {
            organizationTree.value = tree;
            dbUtils.set('organizationTree', tree);
            return true;
        } catch (error) {
            console.error('保存组织架构树失败:', error);
            return false;
        }
    };
    
    // 保存用户数据权限
    const saveUserDataPermissions = async (permissions) => {
        try {
            userDataPermissions.value = permissions;
            dbUtils.set('userDataPermissions', permissions);
            return true;
        } catch (error) {
            console.error('保存用户数据权限失败:', error);
            return false;
        }
    };
    
    // 检查数据权限
    const checkDataPermission = (resourceType, dataScope) => {
        if (userDataPermissions.value.includes('*')) {
            return true; // 超级管理员拥有所有数据权限
        }
        
        // 检查用户是否有特定资源类型的数据权限
        const userResourcePermissions = userDataPermissions.value.filter(perm => 
            perm.startsWith(`${resourceType}:`)
        );
        
        if (userResourcePermissions.length === 0) {
            return false; // 没有该资源类型的权限
        }
        
        // 检查数据范围
        return userResourcePermissions.some(perm => {
            const scope = perm.split(':')[1];
            return scope === '*' || scope === dataScope;
        });
    };
    
    // 获取用户数据权限范围
    const getUserDataScope = (resourceType) => {
        if (userDataPermissions.value.includes('*')) {
            return '*'; // 超级管理员拥有所有数据权限
        }
        
        const userResourcePermissions = userDataPermissions.value.filter(perm => 
            perm.startsWith(`${resourceType}:`)
        );
        
        if (userResourcePermissions.length === 0) {
            return [];
        }
        
        return userResourcePermissions.map(perm => perm.split(':')[1]);
    };
    
    // 构建数据权限过滤条件
    const buildDataFilter = (resourceType) => {
        const dataScope = getUserDataScope(resourceType);
        
        if (dataScope.includes('*')) {
            return {}; // 所有数据
        }
        
        if (dataScope.length === 0) {
            return { $or: [] }; // 无数据权限
        }
        
        // 根据数据范围构建过滤条件
        const filterConditions = dataScope.map(scope => {
            if (scope === 'self') {
                return { createdBy: dbUtils.get('userInfo')?.userId };
            } else if (scope === 'department') {
                return { departmentId: dbUtils.get('userInfo')?.departmentId };
            } else if (scope === 'subordinate') {
                return { departmentId: { $in: getSubordinateDepartments(scope) } };
            } else {
                return { departmentId: scope };
            }
        });
        
        return { $or: filterConditions };
    };
    
    // 获取下属部门
    const getSubordinateDepartments = (departmentId) => {
        // 递归获取所有下属部门
        const findSubordinates = (node, subordinates = []) => {
            if (node.children) {
                node.children.forEach(child => {
                    subordinates.push(child.id);
                    findSubordinates(child, subordinates);
                });
            }
            return subordinates;
        };
        
        const department = findDepartmentById(departmentId);
        return department ? findSubordinates(department) : [];
    };
    
    // 根据ID查找部门
    const findDepartmentById = (departmentId) => {
        const findNode = (nodes) => {
            for (const node of nodes) {
                if (node.id === departmentId) {
                    return node;
                }
                if (node.children) {
                    const found = findNode(node.children);
                    if (found) return found;
                }
            }
            return null;
        };
        
        return findNode(organizationTree.value);
    };
    
    // 清空数据权限缓存
    const clearDataPermissions = () => {
        dataPermissions.value = [];
        organizationTree.value = [];
        userDataPermissions.value = [];
        dbUtils.remove('dataPermissions');
        dbUtils.remove('organizationTree');
        dbUtils.remove('userDataPermissions');
    };
    
    return {
        dataPermissions,
        organizationTree,
        userDataPermissions,
        loadDataPermissions,
        saveDataPermissions,
        saveOrganizationTree,
        saveUserDataPermissions,
        checkDataPermission,
        getUserDataScope,
        buildDataFilter,
        clearDataPermissions
    };
});