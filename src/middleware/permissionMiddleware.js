import { useDataPermissionStore } from '@/stores/dataPermission.js';
import { useAuthStore } from '@/stores/Users.js';
import dbUtils from '@/utils/util.strotage.js';

/**
 * 权限验证中间件
 * 增强路由守卫的数据权限验证逻辑
 */
class PermissionMiddleware {
    constructor() {
        // 延迟初始化store，确保Pinia已经安装
        this.dataPermissionStore = null;
        this.userStore = null;
    }

    /**
     * 初始化store
     */
    initStores() {
        if (!this.dataPermissionStore) {
            this.dataPermissionStore = useDataPermissionStore();
        }
        if (!this.userStore) {
            this.userStore = useAuthStore();
        }
    }

    /**
     * 检查路由权限
     * @param {Object} to - 目标路由
     * @param {Object} from - 来源路由
     * @param {Function} next - 路由跳转函数
     * @returns {Promise<boolean>} - 是否有权限访问
     */
    async checkRoutePermission(to, from, next) {
        try {
            // 检查基础路由权限
            if (!await this.checkBasicPermission(to)) {
                return false;
            }

            // 检查数据权限
            if (!await this.checkDataPermission(to)) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('权限检查失败:', error);
            return false;
        }
    }

    /**
     * 检查基础路由权限
     * @param {Object} to - 目标路由
     * @returns {Promise<boolean>} - 是否有权限访问
     */
    async checkBasicPermission(to) {
        // 如果路由不需要权限验证，直接通过
        if (to.meta && to.meta.requiresAuth === false) {
            return true;
        }

        // 检查用户是否已登录
        if (!this.userStore.isLoggedIn) {
            console.warn('用户未登录，跳转到登录页');
            return false;
        }

        // 检查路由权限
        const routePermissions = to.meta && to.meta.perms ? to.meta.perms : [];
        if (routePermissions.length > 0) {
            const userPermissions = dbUtils.get('perms') || [];
            
            // 检查用户是否有超级管理员权限
            if (userPermissions.includes('*')) {
                return true;
            }
            
            // 检查用户是否拥有路由所需的权限
            const hasPermission = routePermissions.some(perm => userPermissions.includes(perm));
            if (!hasPermission) {
                console.warn('用户没有访问该路由的权限:', routePermissions);
                return false;
            }
        }

        return true;
    }

    /**
     * 检查数据权限
     * @param {Object} to - 目标路由
     * @returns {Promise<boolean>} - 是否有权限访问
     */
    async checkDataPermission(to) {
        // 如果路由不需要数据权限验证，直接通过
        if (to.meta && to.meta.dataPermission === false) {
            return true;
        }

        // 获取当前用户的数据权限配置
        const userDataPermissions = this.dataPermissionStore.userDataPermissions;
        
        // 如果没有数据权限配置，默认允许访问
        if (!userDataPermissions || userDataPermissions.length === 0) {
            return true;
        }

        // 检查路由是否需要特定的数据权限
        const dataPermissionRequired = to.meta && to.meta.dataPermission;
        if (dataPermissionRequired) {
            const userInfo = dbUtils.get('userInfo');
            const userId = userInfo ? userInfo.userId : null;
            
            const hasDataPermission = await this.dataPermissionStore.checkDataPermission(
                userId,
                dataPermissionRequired
            );
            
            if (!hasDataPermission) {
                console.warn('用户没有访问该数据的权限:', dataPermissionRequired);
                return false;
            }
        }

        return true;
    }

    /**
     * 构建数据权限过滤条件
     * @param {string} resourceType - 资源类型
     * @returns {Object} - 数据权限过滤条件
     */
    buildDataPermissionFilter(resourceType) {
        const userDataPermissions = this.dataPermissionStore.userDataPermissions;
        
        // 如果没有数据权限配置，返回空过滤条件
        if (!userDataPermissions || userDataPermissions.length === 0) {
            return {};
        }

        // 查找当前资源类型的数据权限配置
        const dataPermission = userDataPermissions.find(
            perm => perm.resourceType === resourceType && perm.enabled
        );

        if (!dataPermission) {
            return {};
        }

        // 根据数据范围构建过滤条件
        switch (dataPermission.dataScope) {
            case 'self':
                return this.buildSelfFilter(dataPermission);
            case 'department':
                return this.buildDepartmentFilter(dataPermission);
            case 'subordinate':
                return this.buildSubordinateFilter(dataPermission);
            case 'all':
                return this.buildAllFilter(dataPermission);
            default:
                return {};
        }
    }

    /**
     * 构建仅自己的数据权限过滤条件
     * @param {Object} dataPermission - 数据权限配置
     * @returns {Object} - 过滤条件
     */
    buildSelfFilter(dataPermission) {
        const userInfo = dbUtils.get('userInfo');
        const userId = userInfo ? userInfo.userId : null;
        return {
            userId: userId
        };
    }

    /**
     * 构建本部门的数据权限过滤条件
     * @param {Object} dataPermission - 数据权限配置
     * @returns {Object} - 过滤条件
     */
    buildDepartmentFilter(dataPermission) {
        const userInfo = dbUtils.get('userInfo');
        const userDepartment = userInfo ? userInfo.departmentId : null;
        if (!userDepartment) {
            return {};
        }

        return {
            departmentId: userDepartment
        };
    }

    /**
     * 构建下属部门的数据权限过滤条件
     * @param {Object} dataPermission - 数据权限配置
     * @returns {Object} - 过滤条件
     */
    buildSubordinateFilter(dataPermission) {
        const userInfo = dbUtils.get('userInfo');
        const userDepartment = userInfo ? userInfo.departmentId : null;
        if (!userDepartment) {
            return {};
        }

        // 简化实现：暂时只返回当前部门ID，需要完整的部门层级结构来实现下属部门过滤
        return {
            departmentId: userDepartment
        };
    }

    /**
     * 构建全部数据权限过滤条件
     * @param {Object} dataPermission - 数据权限配置
     * @returns {Object} - 过滤条件
     */
    buildAllFilter(dataPermission) {
        return {};
    }

    /**
     * 拦截器：在请求前添加数据权限过滤条件
     * @param {Object} config - 请求配置
     * @returns {Object} - 修改后的请求配置
     */
    requestInterceptor(config) {
        // 检查是否需要添加数据权限过滤条件
        if (config.dataPermission) {
            const filter = this.buildDataPermissionFilter(config.dataPermission);
            if (Object.keys(filter).length > 0) {
                // 在请求参数中添加数据权限过滤条件
                if (config.params) {
                    config.params = { ...config.params, ...filter };
                } else {
                    config.params = filter;
                }
            }
        }
        
        return config;
    }

    /**
     * 拦截器：在响应后过滤数据
     * @param {Object} response - 响应数据
     * @param {string} resourceType - 资源类型
     * @returns {Object} - 过滤后的响应数据
     */
    responseInterceptor(response, resourceType) {
        // 检查是否需要过滤响应数据
        const filter = this.buildDataPermissionFilter(resourceType);
        if (Object.keys(filter).length > 0) {
            // 过滤响应数据
            if (Array.isArray(response.data)) {
                response.data = response.data.filter(item => this.matchesFilter(item, filter));
            }
        }
        
        return response;
    }

    /**
     * 检查数据项是否匹配过滤条件
     * @param {Object} item - 数据项
     * @param {Object} filter - 过滤条件
     * @returns {boolean} - 是否匹配
     */
    matchesFilter(item, filter) {
        for (const [key, value] of Object.entries(filter)) {
            if (typeof value === 'object' && value.$in) {
                // 处理数组包含条件
                if (!value.$in.includes(item[key])) {
                    return false;
                }
            } else if (item[key] !== value) {
                // 处理等值条件
                return false;
            }
        }
        return true;
    }

    /**
     * 路由守卫中间件
     * @param {Object} to - 目标路由
     * @param {Object} from - 来源路由
     * @param {Function} next - 路由跳转函数
     * @returns {Promise<void>}
     */
    async routerMiddleware(to, from, next) {
        try {
            // 检查权限
            const hasPermission = await this.checkRoutePermission(to, from, next);
            
            if (hasPermission) {
                // 构建数据权限过滤条件并添加到路由元数据中
                if (to.meta && to.meta.dataPermission) {
                    const filter = this.buildDataPermissionFilter(to.meta.dataPermission);
                    to.meta.dataPermissionFilter = filter;
                }
                
                next();
            } else {
                // 没有权限，跳转到无权限页面
                next('/403');
            }
        } catch (error) {
            console.error('路由守卫中间件错误:', error);
            next('/403');
        }
    }
}

// 创建单例实例
const permissionMiddleware = new PermissionMiddleware();

export default permissionMiddleware;