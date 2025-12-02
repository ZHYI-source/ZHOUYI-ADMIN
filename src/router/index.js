import {createRouter, createWebHashHistory, createWebHistory} from "vue-router";
import NProgress from 'nprogress'; // progress bar
import 'nprogress/nprogress.css'; // progress bar style
import routes from "./routes";
import { useSearchStore } from "@/stores/SearchPanel.js";
import dbUtils from "utils/util.strotage.js";
import permissionMiddleware from "@/middleware/permissionMiddleware.js";

NProgress.configure({ showSpinner: false }); // NProgress Configuration


const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes,
    // 刷新时，滚动条位置还原
    scrollBehavior: () => ({ left: 0, top: 0 }),
});


/**
 * 检查路由对象是否具有权限
 * @param {Array} perms - 权限列表
 * @param {Object} route - 路由对象
 * @returns {boolean} - 是否具有权限
 */
function hasPermission(perms, route) {
    if (perms.includes('*')) return true
    if (route.meta && route.meta.perms) {
        // 如果路由对象定义了 meta 属性或者定义 meta.perms 属性，那么就根据权限值来判断是否具有权限
        return perms.some(perm => route.meta.perms.includes(perm))
    } else {
        // 如果路由对象没有定义 meta 属性或者没有定义 meta.perms 属性，那么默认认为具有权限，返回 true。
        return true
    }
}


router.beforeEach(async (to, from, next) => {
    const searchStore = useSearchStore()
    searchStore.showSearchPanel(false)
    NProgress.start();
    
    // 使用权限验证中间件检查权限
    try {
        // 初始化store
        permissionMiddleware.initStores();
        
        const hasPermission = await permissionMiddleware.checkRoutePermission(to, from, next);
        
        if (hasPermission) {
            // 有权限直接访问
            NProgress.done();
            return next();
        } else {
            // 无权限则重定向到401
            NProgress.done();
            return next({name: '401'});
        }
    } catch (error) {
        console.error('权限验证中间件错误:', error);
        NProgress.done();
        return next({name: '401'});
    }
})
router.afterEach((to, from) => {
    NProgress.done();
    window.document.title = to.meta.title + " | ZHOUYI";
})

export default router
