import { useDataPermissionStore } from '@/stores/dataPermission.js'

/**
 * 数据权限指令
 * 使用方式：v-data-permission="dataItem"
 * 当用户没有该数据的权限时，元素会被隐藏
 */
export default {
  mounted(el, binding) {
    const dataPermissionStore = useDataPermissionStore()
    const dataItem = binding.value
    
    if (dataItem && !dataPermissionStore.checkDataPermission(dataItem)) {
      el.style.display = 'none'
    }
  },
  updated(el, binding) {
    const dataPermissionStore = useDataPermissionStore()
    const dataItem = binding.value
    
    if (dataItem) {
      if (dataPermissionStore.checkDataPermission(dataItem)) {
        el.style.display = ''
      } else {
        el.style.display = 'none'
      }
    }
  }
}