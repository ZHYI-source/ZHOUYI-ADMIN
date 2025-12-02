import {defineStore} from 'pinia';
import dbUtils from 'utils/util.strotage.js'

export const useDataPermissionStore = defineStore('dataPermission', () => {
    // 数据权限类型
    const DATA_PERMISSION_TYPE = {
        ALL: 'ALL', // 全部数据
        SELF: 'SELF', // 仅自己
        DEPT: 'DEPT', // 本部门
        DEPT_AND_CHILD: 'DEPT_AND_CHILD', // 本部门及子部门
        CUSTOM: 'CUSTOM' // 自定义
    }

    // 设置数据权限
    function setDataPermission(permission) {
        dbUtils.set('dataPermission', permission)
    }

    // 获取数据权限
    function getDataPermission() {
        return dbUtils.get('dataPermission') || {
            type: DATA_PERMISSION_TYPE.ALL,
            deptIds: [],
            userIds: []
        }
    }

    // 清空数据权限
    function clearDataPermission() {
        dbUtils.remove('dataPermission')
    }

    // 检查数据权限
    function checkDataPermission(data) {
        const permission = getDataPermission()
        
        switch (permission.type) {
            case DATA_PERMISSION_TYPE.ALL:
                return true
            case DATA_PERMISSION_TYPE.SELF:
                return data.createUserId === dbUtils.get('userInfo')?._id
            case DATA_PERMISSION_TYPE.DEPT:
                return data.deptId && permission.deptIds.includes(data.deptId)
            case DATA_PERMISSION_TYPE.DEPT_AND_CHILD:
                return data.deptId && permission.deptIds.some(deptId => isDeptOrChild(data.deptId, deptId))
            case DATA_PERMISSION_TYPE.CUSTOM:
                return data.userId && permission.userIds.includes(data.userId) || 
                       data.deptId && permission.deptIds.includes(data.deptId)
            default:
                return false
        }
    }

    // 判断是否为本部门或子部门
    function isDeptOrChild(currentDeptId, targetDeptId) {
        // 需要根据实际部门树结构实现
        // 这里暂时简化实现
        return currentDeptId === targetDeptId || currentDeptId.startsWith(`${targetDeptId}-`)
    }

    // 过滤数据列表
    function filterDataList(dataList) {
        return dataList.filter(item => checkDataPermission(item))
    }

    return {
        DATA_PERMISSION_TYPE,
        setDataPermission,
        getDataPermission,
        clearDataPermission,
        checkDataPermission,
        filterDataList
    };
})