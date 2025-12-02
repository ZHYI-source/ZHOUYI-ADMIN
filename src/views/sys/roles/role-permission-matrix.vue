<script setup>
import {ref, reactive, onMounted, computed} from 'vue'
import {TimeUtils} from 'utils/util.time'
import {ZyNotification} from '@/utils/util.toast.js'
import {ElMessageBox} from 'element-plus'
import {Search, Refresh} from '@element-plus/icons-vue'

const loading = ref({
  list: false,
  text: '加载中...'
})

// 角色列表
const roles = ref([])
// 权限列表
const permissions = ref([])
// 筛选后的权限列表
const filteredPermissions = computed(() => {
  if (!searchKeyword.value) return permissions.value
  
  const filter = (nodes) => {
    return nodes.filter(node => {
      const match = node.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) || node.key.toLowerCase().includes(searchKeyword.value.toLowerCase())
      if (node.children) {
        node.children = filter(node.children)
      }
      return match || (node.children && node.children.length > 0)
    })
  }
  
  return filter(JSON.parse(JSON.stringify(permissions.value)))
})
// 选中的角色
const selectedRole = ref(null)
// 权限矩阵数据
const permissionMatrix = ref({})
// 树形表格配置
const treeProps = {
  children: 'children',
  label: 'name'
}

// 搜索关键词
const searchKeyword = ref('')

// 模拟获取角色列表
const getRoles = async () => {
  try {
    loading.value.list = true
    const roleList = {
      data: {
        "result": [
          {
            "_id": "64a423816f4197cfc70375e3",
            "roleName": "超级管理员",
            "roleAuth": "SUPER-ADMIN",
            "perms": ["*"],
            "remark": "拥有所有权限",
            "status": true
          },
          {
            "_id": "64a426a56f4197cfc70375f6",
            "roleName": "普通管理员",
            "roleAuth": "NORMALL-ADMIN",
            "perms": [
              "index",
              "blog:blog_articles:list",
              "blog:comments:list"
            ],
            "remark": "拥有部分权限",
            "status": true
          },
          {
            "_id": "64a7aa20a971facd04696242",
            "roleName": "访客",
            "roleAuth": "VISITOR-ADMIN",
            "perms": [
              "index",
              "components:echart:chinaMap"
            ],
            "remark": "一般访客，更多的是有查看权限",
            "status": true
          }
        ]
      }
    }
    roles.value = roleList.data.result
    selectedRole.value = roles.value[0]
    loading.value.list = false
  } catch (e) {
    loading.value.list = false
  }
}

// 模拟获取权限列表
const getPermissions = async () => {
  try {
    loading.value.list = true
    const permissionList = {
      data: {
        "result": [
          {
            "_id": "64a6767b2f517ae48b51de4a",
            "name": "首页",
            "key": "index",
            "auth": false,
            "status": true,
            "children": []
          },
          {
            "_id": "64a676872f517ae48b51de50",
            "name": "系统管理",
            "key": "sys",
            "auth": false,
            "status": true,
            "children": [
              {
                "_id": "64a676942f517ae48b51de56",
                "name": "用户管理",
                "key": "sys:users",
                "parent_key": "sys",
                "auth": false,
                "status": true,
                "children": [
                  {
                    "_id": "64a676a62f517ae48b51de5c",
                    "name": "查询",
                    "key": "sys:users:list",
                    "parent_key": "sys:users",
                    "auth": true,
                    "status": true
                  },
                  {
                    "_id": "64a676b72f517ae48b51de62",
                    "name": "增加",
                    "key": "sys:users:create",
                    "parent_key": "sys:users",
                    "auth": true,
                    "status": true
                  },
                  {
                    "_id": "64a676ca2f517ae48b51de68",
                    "name": "删除",
                    "key": "sys:users:delete",
                    "parent_key": "sys:users",
                    "auth": true,
                    "status": true
                  }
                ]
              },
              {
                "_id": "64a6f171d2fac9dd58d3025c",
                "name": "角色管理",
                "key": "sys:roles",
                "parent_key": "sys",
                "auth": false,
                "status": true,
                "children": [
                  {
                    "_id": "64a6f171d2fac9dd58d3025d",
                    "name": "查询",
                    "key": "sys:roles:list",
                    "parent_key": "sys:roles",
                    "auth": true,
                    "status": true
                  },
                  {
                    "_id": "64a6f171d2fac9dd58d3025e",
                    "name": "增加",
                    "key": "sys:roles:create",
                    "parent_key": "sys:roles",
                    "auth": true,
                    "status": true
                  }
                ]
              }
            ]
          }
        ]
      }
    }
    permissions.value = permissionList.data.result
    initPermissionMatrix()
    loading.value.list = false
  } catch (e) {
    loading.value.list = false
  }
}

// 初始化权限矩阵
const initPermissionMatrix = () => {
  if (!selectedRole.value) return
  
  permissionMatrix.value = {}
  const rolePerms = selectedRole.value.perms || []
  
  // 递归遍历权限树
  const traversePermissions = (nodes) => {
    nodes.forEach(node => {
      permissionMatrix.value[node.key] = rolePerms.includes(node.key) || rolePerms.includes('*')
      if (node.children) {
        traversePermissions(node.children)
      }
    })
  }
  
  traversePermissions(permissions.value)
}

// 切换权限
const togglePermission = (key, row) => {
  permissionMatrix.value[key] = !permissionMatrix.value[key]
  
  // 如果是父节点，同步子节点权限
  if (row.children && row.children.length > 0) {
    const syncChildPermissions = (nodes, value) => {
      nodes.forEach(node => {
        permissionMatrix.value[node.key] = value
        if (node.children) {
          syncChildPermissions(node.children, value)
        }
      })
    }
    syncChildPermissions(row.children, permissionMatrix.value[key])
  }
}

// 刷新数据
const refreshData = () => {
  getRoles()
  getPermissions()
  ZyNotification.success('数据已刷新')}

// 批量操作
const handleBatchAction = (action, node = null) => {
  let keys = []
  
  if (node) {
    // 获取节点及其所有子节点的key
    const getNodeKeys = (n) => {
      let nodeKeys = [n.key]
      if (n.children) {
        n.children.forEach(child => {
          nodeKeys = nodeKeys.concat(getNodeKeys(child))
        })
      }
      return nodeKeys
    }
    keys = getNodeKeys(node)
  } else {
    // 获取所有权限的key
    const getAllKeys = (nodes) => {
      let allKeys = []
      nodes.forEach(n => {
        allKeys.push(n.key)
        if (n.children) {
          allKeys = allKeys.concat(getAllKeys(n.children))
        }
      })
      return allKeys
    }
    keys = getAllKeys(permissions.value)
  }
  
  keys.forEach(key => {
    permissionMatrix.value[key] = action === 'grant'
  })
}

// 保存权限配置
const savePermissions = async () => {
  try {
    const perms = Object.keys(permissionMatrix.value).filter(key => permissionMatrix.value[key])
    
    ElMessageBox.confirm(
      '确认保存当前角色的权限配置吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(async () => {
      // 调用API保存权限配置
      // await updateRolePermissions(selectedRole.value._id, perms)
      ZyNotification.success('权限配置保存成功！')
      selectedRole.value.perms = perms
    })
  } catch (e) {
    console.error(e)
  }
}

// 切换选中角色
const handleRoleChange = (role) => {
  selectedRole.value = role
  initPermissionMatrix()
}

onMounted(() => {
  getRoles()
  getPermissions()
})
</script>

<template>
  <section class="permission-matrix-page">
    <div class="role-selector">
      <el-card shadow="hover" class="role-card">
        <template #header>
          <div class="role-header">
            <span>角色选择</span>
            <el-button 
              size="small" 
              icon="Refresh"
              @click="refreshData"
              tooltip="刷新角色列表"
            />
          </div>
        </template>
        <el-scrollbar height="500px">
          <div class="role-list">
            <div 
              class="role-item"
              :class="{ active: selectedRole && selectedRole._id === role._id }"
              v-for="role in roles" 
              :key="role._id"
              @click="handleRoleChange(role)"
            >
              <div class="role-header-item">
                <div class="role-name">{{ role.roleName }}</div>
                <el-tag 
                  size="small" 
                  :type="role.status ? 'success' : 'danger'"
                >
                  {{ role.status ? '启用' : '禁用' }}
                </el-tag>
              </div>
              <div class="role-desc">{{ role.remark }}</div>
              <div class="role-perm-count">
                <span class="perm-count">权限数: {{ role.perms ? role.perms.length : 0 }}</span>
              </div>
            </div>
          </div>
        </el-scrollbar>
      </el-card>
    </div>

    <div class="permission-content">
      <el-card shadow="hover" class="permission-card">
        <template #header>
          <div class="card-header">
            <span>权限矩阵配置</span>
            <div class="header-actions">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索权限名称或标识"
                size="small"
                prefix-icon="Search"
                style="width: 250px; margin-right: 10px;"
              />
              <el-button type="primary" size="small" @click="handleBatchAction('grant')" tooltip="全选所有权限">
                <el-icon><Check /></el-icon> 全选
              </el-button>
              <el-button size="small" @click="handleBatchAction('revoke')" tooltip="取消所有权限">
                <el-icon><Close /></el-icon> 全不选
              </el-button>
              <el-button type="success" size="small" @click="savePermissions" tooltip="保存当前配置">
                <el-icon><Save /></el-icon> 保存配置
              </el-button>
            </div>
          </div>
        </template>

        <el-table 
          :data="filteredPermissions" 
          :loading="loading.list"
          row-key="key"
          border
          default-expand-all
          :tree-props="treeProps"
          :row-class-name="({row}) => row.auth ? 'auth-row' : ''"
          @row-mouse-enter="({row}) => $event.currentTarget.classList.add('hover-row')"
          @row-mouse-leave="({row}) => $event.currentTarget.classList.remove('hover-row')"
        >
          <el-table-column prop="name" label="权限名称" width="300">
            <template #default="scope">
              <span class="permission-name">{{ scope.row.name }}</span>
              <span v-if="scope.row.auth" class="auth-tag">按钮权限</span>
            </template>
          </el-table-column>
          <el-table-column prop="key" label="权限标识" min-width="200" />
          <el-table-column label="操作" width="120" align="center">
            <template #default="scope">
              <div class="batch-actions" v-if="!scope.row.auth">
                <el-button size="small" @click="handleBatchAction('grant', scope.row)">
                  勾选子项
                </el-button>
                <el-button size="small" @click="handleBatchAction('revoke', scope.row)">
                  取消子项
                </el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="权限状态" width="150" align="center">
            <template #default="scope">
              <div class="permission-switch">
                <el-switch 
                  v-model="permissionMatrix[scope.row.key]" 
                  @change="togglePermission(scope.row.key, scope.row)"
                  :disabled="selectedRole && selectedRole.roleAuth === 'SUPER-ADMIN'"
                  active-text="已授权"
                  inactive-text="未授权"
                />
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </section>
</template>

<style scoped>
.permission-matrix-page {
  display: flex;
  gap: 20px;
  padding: 20px;
  height: calc(100vh - 80px);
}

.role-selector {
  width: 300px;
}

.role-card {
  height: 100%;
}

.role-list {
  padding: 10px 0;
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.role-item {
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  background-color: #ffffff;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.role-item:hover {
  transform: translateX(4px);
  background-color: #f9fafb;
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.role-item.active {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1);
}

.role-header-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.role-name {
  font-weight: 600;
  font-size: 14px;
}

.role-desc {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
  line-height: 1.4;
}

.role-perm-count {
  font-size: 11px;
  color: #9ca3af;
}

.perm-count {
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 10px;
}

.permission-content {
  flex: 1;
  overflow: hidden;
}

.permission-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.permission-name {
  margin-right: 8px;
  font-weight: 500;
}

.auth-tag {
  font-size: 11px;
  background-color: #fef2f2;
  color: #dc2626;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.batch-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.permission-switch {
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-row {
  background-color: #fef2f2 !important;
}

.hover-row {
  background-color: #f9fafb !important;
}
</style>