<script setup>
import {ref, reactive, onMounted, computed} from 'vue';
import {ElTable, ElTableColumn, ElTree, ElButton, ElRow, ElCol, ElCard, ElCheckbox, ElAlert, ElMessage, ElTag, ElDialog, ElMessageBox, ElEmpty} from 'element-plus';
import {useRouter} from 'vue-router';
import {TimeUtils} from 'utils/util.time';
import {ZyConfirm, ZyNotification} from '@/utils/util.toast.js';
import GetPage from '@/views/components/page/get-page.vue';

const router = useRouter()

// 角色数据
const rolesData = ref([])
// 权限树形数据
const permissionTree = ref([])
// 已选角色权限关系
const rolePermissions = ref([])
// 选中的角色ID
const selectedRoleIds = ref([])
// 选中的权限ID
const selectedPermissionIds = ref([])
// 批量操作按钮状态
const batchBtnDisabled = ref(true)
// 加载状态
const loading = ref({
  list: false,
  save: false,
  view: false,
  text: '加载中...'
})

// 表格列配置
const tableColumns = [
  {
    type: 'selection',
    align: 'center',
    fixed: 'left'
  },
  {
    prop: 'roleName',
    label: '角色名称',
    align: 'left',
    width: 200
  },
  {
    prop: 'roleAuth',
    label: '角色标识',
    align: 'left',
    width: 200
  },
  {
    prop: 'status',
    label: '状态',
    align: 'center',
    width: 100,
    formatter: (row) => {
      return row.status ? '启用' : '禁用'
    }
  },
  {
    prop: 'createdAt',
    label: '创建时间',
    align: 'center',
    width: 200,
    formatter: (row) => {
      return TimeUtils.formatTime(row.createdAt)
    }
  },
  {
    prop: 'description',
    label: '角色描述',
    align: 'left',
    minWidth: 200,
    showOverflowTooltip: true
  },
  {
    prop: 'actions',
    label: '操作',
    align: 'center',
    width: 120,
    fixed: 'right'
  }
]

// 树形控件默认展开全部
const defaultExpandedKeys = ref([])
// 树形控件默认选中的权限
const defaultCheckedKeys = ref([])
// 树形控件默认半选中的权限
const defaultHalfCheckedKeys = ref([])
// 树形控件懒加载标志
const loadData = ref(false)
// 权限查看对话框相关
const showPermissionDialog = ref(false)
const selectedRolePermissions = ref([])
const currentRole = ref(null)

// 角色选择变更
const handleRoleSelectionChange = (selectedItems) => {
  selectedRoleIds.value = selectedItems.map(item => item._id)
  batchBtnDisabled.value = selectedItems.length === 0
  // 清空权限选择
  selectedPermissionIds.value = []
  defaultCheckedKeys.value = []
  defaultHalfCheckedKeys.value = []
}

// 权限树形选择变更
const handlePermissionSelectionChange = (data, checked, indeterminate) => {
  if (checked) {
    // 选中时添加该权限的ID
    if (!selectedPermissionIds.value.includes(data.id)) {
      selectedPermissionIds.value.push(data.id)
    }
    // 如果有子权限，也需要添加
    if (data.children && data.children.length > 0) {
      data.children.forEach(child => {
        if (!selectedPermissionIds.value.includes(child.id)) {
          selectedPermissionIds.value.push(child.id)
        }
      })
    }
  } else {
    // 取消选中时移除该权限的ID
    const index = selectedPermissionIds.value.indexOf(data.id)
    if (index > -1) {
      selectedPermissionIds.value.splice(index, 1)
    }
    // 如果有子权限，也需要移除
    if (data.children && data.children.length > 0) {
      data.children.forEach(child => {
        const childIndex = selectedPermissionIds.value.indexOf(child.id)
        if (childIndex > -1) {
          selectedPermissionIds.value.splice(childIndex, 1)
        }
      })
    }
  }
}

// 递归加载权限树
function buildPermissionTree(data, parentPath = '') {
  return data.map(item => {
    const node = {
      id: item.key,
      label: item.name,
      disabled: item.disabled || false
    }
    
    if (item.children && item.children.length > 0) {
      node.children = buildPermissionTree(item.children, `${parentPath}${item.key}:`)
    }
    
    return node
  })
}

// 展开所有节点
function expandAllNodes(tree, keys) {
  tree.forEach(node => {
    keys.push(node.id)
    if (node.children && node.children.length > 0) {
      expandAllNodes(node.children, keys)
    }
  })
}

// 全选权限
const selectAllPermissions = () => {
  const allKeys = []
  expandAllNodes(permissionTree.value, allKeys)
  defaultCheckedKeys.value = allKeys
  // 更新选中的权限ID数组
  selectedPermissionIds.value = [...allKeys]
}

// 全不选权限
const deselectAllPermissions = () => {
  defaultCheckedKeys.value = []
  defaultHalfCheckedKeys.value = []
  // 清空选中的权限ID数组
  selectedPermissionIds.value = []
}

// 计算属性：是否有选中的角色
const hasSelectedRole = computed(() => selectedRoleIds.value.length > 0)

// 计算属性：是否有选中的权限
const hasSelectedPermission = computed(() => selectedPermissionIds.value.length > 0)

// 为选中角色批量添加权限
const batchAddPermissions = async () => {
  if (!hasSelectedRole.value || !hasSelectedPermission.value) {
    ElMessage.warning('请选择要操作的角色和权限！')
    return
  }

  try {
    // 获取选中角色的名称
    const selectedRoles = rolesData.value.filter(role => selectedRoleIds.value.includes(role._id))
    const roleNames = selectedRoles.map(role => role.roleName).join(', ')
    
    await ElMessageBox.confirm(
      `确定要为 [${roleNames}] 添加选中的 ${selectedPermissionIds.value.length} 项权限吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    loading.value.save = true
    // TODO: 调用API为选中角色批量添加权限
    // const result = await batchAddRolePermissions({
    //   roleIds: selectedRoleIds.value,
    //   permissionIds: selectedPermissionIds.value
    // })
    
    // 模拟API调用成功
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ZyNotification.success(`成功为 ${selectedRoleIds.value.length} 个角色添加了 ${selectedPermissionIds.value.length} 项权限`)
    deselectAllPermissions()
  } catch (error) {
    if (error !== 'cancel') {
      ZyNotification.error('权限分配失败：' + error.message)
    }
  } finally {
    loading.value.save = false
  }
}

// 为选中角色批量移除权限
const batchRemovePermissions = async () => {
  if (!hasSelectedRole.value || !hasSelectedPermission.value) {
    ElMessage.warning('请选择要操作的角色和权限！')
    return
  }

  try {
    // 获取选中角色的名称
    const selectedRoles = rolesData.value.filter(role => selectedRoleIds.value.includes(role._id))
    const roleNames = selectedRoles.map(role => role.roleName).join(', ')
    
    await ElMessageBox.confirm(
      `确定要为 [${roleNames}] 移除选中的 ${selectedPermissionIds.value.length} 项权限吗？此操作不可恢复！`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    loading.value.save = true
    // TODO: 调用API为选中角色批量移除权限
    // const result = await batchRemoveRolePermissions({
    //   roleIds: selectedRoleIds.value,
    //   permissionIds: selectedPermissionIds.value
    // })
    
    // 模拟API调用成功
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ZyNotification.success(`成功为 ${selectedRoleIds.value.length} 个角色移除了 ${selectedPermissionIds.value.length} 项权限`)
    deselectAllPermissions()
  } catch (error) {
    if (error !== 'cancel') {
      ZyNotification.error('权限移除失败：' + error.message)
    }
  } finally {
    loading.value.save = false
  }
}

// 处理查看权限操作
const handleViewPermissions = async (role) => {
  currentRole.value = role
  showPermissionDialog.value = true
  loading.value.view = true
  
  try {
    // 模拟获取角色权限
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 从权限树中获取角色已有的权限
    const rolePermissions = []
    const traverseTree = (nodes) => {
      nodes.forEach(node => {
        // 如果角色权限包含此权限key
        if (role.perms && role.perms.includes(node.id)) {
          rolePermissions.push({
            id: node.id,
            name: node.label,
            key: node.id,
            type: node.id.includes(':') ? node.id.split(':').pop() : '其他'
          })
        }
        if (node.children && node.children.length > 0) {
          traverseTree(node.children)
        }
      })
    }
    traverseTree(permissionTree.value)
    
    selectedRolePermissions.value = rolePermissions
  } catch (error) {
    ZyNotification.error('获取角色权限失败：' + error.message)
  } finally {
    loading.value.view = false
  }
}

// 关闭权限查看对话框
const closePermissionDialog = () => {
  showPermissionDialog.value = false
  selectedRolePermissions.value = []
  currentRole.value = null
}

// 获取角色列表
const getRolesList = async () => {
  try {
    loading.value.list = true
    // TODO: 调用API获取角色列表
    // const result = await getRoles()
    
    // 模拟数据
    rolesData.value = [
      {
        "_id": "6672431d8e067423d01ca17c",
        "roleName": "超级管理员",
        "roleAuth": "SUPER",
        "perms": ["*"],
        "status": true,
        "createdAt": "2024-06-19T02:31:57.708Z",
        "updatedAt": "2024-06-19T02:31:57.708Z"
      },
      {
        "_id": "66724424a9b358ece99a82af",
        "roleName": "管理员",
        "roleAuth": "ADMIN",
        "perms": ["sys:users:list", "sys:roles:list", "sys:permissions:list"],
        "status": true,
        "createdAt": "2024-06-19T02:36:20.600Z",
        "updatedAt": "2024-06-19T03:39:21.246Z"
      },
      {
        "_id": "66724534a9b358ece99a82b5",
        "roleName": "普通用户",
        "roleAuth": "USER",
        "perms": ["sys:users:list"],
        "status": true,
        "createdAt": "2024-06-19T02:40:20.600Z",
        "updatedAt": "2024-06-19T03:40:21.246Z"
      }
    ]
  } catch (error) {
    ZyNotification.error('获取角色列表失败：' + error.message)
  } finally {
    loading.value.list = false
  }
}

// 获取权限树
const getPermissionTree = async () => {
  try {
    // TODO: 调用API获取权限树
    // const result = await getPermissions()
    
    // 模拟数据
    const permissionData = [
      {
        "_id": "64a676872f517ae48b51de50",
        "name": "系统管理",
        "key": "sys",
        "auth": false,
        "status": true,
        "disabled": false,
        "children": [
          {
            "_id": "64a676942f517ae48b51de56",
            "name": "用户管理",
            "key": "sys:users",
            "parent_key": "sys",
            "auth": false,
            "status": true,
            "disabled": false,
            "children": [
              {
                "_id": "64a676a62f517ae48b51de5c",
                "name": "查询",
                "key": "sys:users:list",
                "parent_key": "sys:users",
                "auth": true,
                "status": true,
                "disabled": false
              },
              {
                "_id": "64a676b72f517ae48b51de62",
                "name": "增加",
                "key": "sys:users:create",
                "parent_key": "sys:users",
                "auth": true,
                "status": true,
                "disabled": false
              },
              {
                "_id": "64a676ca2f517ae48b51de68",
                "name": "删除",
                "key": "sys:users:delete",
                "parent_key": "sys:users",
                "auth": true,
                "status": true,
                "disabled": false
              },
              {
                "_id": "64a676d82f517ae48b51de6e",
                "name": "重置密码",
                "key": "sys:users:reset",
                "parent_key": "sys:users",
                "auth": true,
                "status": true,
                "disabled": false
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
            "disabled": false,
            "children": [
              {
                "_id": "64a6f183d2fac9dd58d30262",
                "name": "查询",
                "key": "sys:roles:list",
                "parent_key": "sys:roles",
                "auth": true,
                "status": true,
                "disabled": false
              },
              {
                "_id": "64a6f194d2fac9dd58d30268",
                "name": "增加",
                "key": "sys:roles:create",
                "parent_key": "sys:roles",
                "auth": true,
                "status": true,
                "disabled": false
              },
              {
                "_id": "64a6f1a5d2fac9dd58d3026e",
                "name": "删除",
                "key": "sys:roles:delete",
                "parent_key": "sys:roles",
                "auth": true,
                "status": true,
                "disabled": false
              }
            ]
          },
          {
            "_id": "64a7a6e1f97cdac3cb1bbc16",
            "name": "权限管理",
            "key": "sys:permissions",
            "parent_key": "sys",
            "auth": false,
            "status": true,
            "disabled": false,
            "children": [
              {
                "_id": "64a7a6f2f97cdac3cb1bbc1c",
                "name": "查询",
                "key": "sys:permissions:list",
                "parent_key": "sys:permissions",
                "auth": true,
                "status": true,
                "disabled": false
              },
              {
                "_id": "64a7a703f97cdac3cb1bbc22",
                "name": "增加",
                "key": "sys:permissions:create",
                "parent_key": "sys:permissions",
                "auth": true,
                "status": true,
                "disabled": false
              },
              {
                "_id": "64a7a714f97cdac3cb1bbc28",
                "name": "删除",
                "key": "sys:permissions:delete",
                "parent_key": "sys:permissions",
                "auth": true,
                "status": true,
                "disabled": false
              }
            ]
          }
        ]
      }
    ]
    
    permissionTree.value = buildPermissionTree(permissionData)
    expandAllNodes(permissionTree.value, defaultExpandedKeys.value)
  } catch (error) {
    ZyNotification.error('获取权限树失败：' + error.message)
  }
}

// 组件挂载时初始化数据
onMounted(() => {
  getRolesList()
  getPermissionTree()
})
</script>

<template>
  <section>
    <ElAlert
      title="角色权限矩阵管理"
      description="使用下方表格选择角色，树形控件选择权限，然后进行批量权限分配操作。"
      type="info"
      show-icon
      style="margin-bottom: 20px;"
    />

    <ElRow :gutter="20">
      <!-- 角色列表 -->
      <ElCol :span="10">
        <ElCard title="角色列表" shadow="hover">
          <div class="batch-actions">
            <ElButton
              type="primary"
              size="small"
              :disabled="batchBtnDisabled"
              @click="batchAddPermissions"
              :loading="loading.save"
            >
              为选中角色添加权限
            </ElButton>
            <ElButton
              type="danger"
              size="small"
              :disabled="batchBtnDisabled"
              @click="batchRemovePermissions"
              :loading="loading.save"
            >
              为选中角色移除权限
            </ElButton>
          </div>

          <ElTable
            v-loading="loading.list"
            :data="rolesData"
            border
            stripe
            ref="tableRef"
            @selection-change="handleRoleSelectionChange"
            style="width: 100%;"
          >
            <ElTableColumn
              v-for="column in tableColumns"
              :key="column.prop || column.type"
              :type="column.type"
              :prop="column.prop"
              :label="column.label"
              :align="column.align"
              :width="column.width"
              :fixed="column.fixed"
              :formatter="column.formatter"
            >
              <template #default="scope" v-if="column.prop === 'actions'">
                <ElButton
                  type="primary"
                  size="small"
                  icon="View"
                  @click="handleViewPermissions(scope.row)"
                >
                  查看权限
                </ElButton>
              </template>
              <template #default="scope" v-if="column.prop === 'status'">
                <ElTag :type="scope.row.status ? 'success' : 'danger'">
                  {{ scope.row.status ? '启用' : '禁用' }}
                </ElTag>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </ElCol>

      <!-- 权限树形结构 -->
      <ElCol :span="14">
        <ElCard title="权限列表" shadow="hover">
          <div class="permission-actions">
            <ElButton
              type="default"
              size="small"
              @click="selectAllPermissions"
            >
              全选
            </ElButton>
            <ElButton
              type="default"
              size="small"
              @click="deselectAllPermissions"
            >
              全不选
            </ElButton>
          </div>

          <div class="permission-tree-wrapper">
            <ElTree
              :data="permissionTree"
              show-checkbox
              :default-expanded-keys="defaultExpandedKeys"
              :default-checked-keys="defaultCheckedKeys"
              :default-half-checked-keys="defaultHalfCheckedKeys"
              node-key="id"
              @check-change="handlePermissionSelectionChange"
            >
              <template #default="{ node, data }">
                <span class="custom-tree-node">
                  <span class="permission-icon">
                    {{ node.level === 1 ? '📁' : '📄' }}
                  </span>
                  <span class="permission-label">
                    {{ data.label }}
                  </span>
                  <span v-if="data.disabled" class="disabled-tip">(禁用)</span>
                  <span v-if="data.id" class="permission-key">
                    {{ data.id }}
                  </span>
                </span>
              </template>
            </ElTree>
          </div>
        </ElCard>
      </ElCol>
    </ElRow>

    <!-- 权限查看对话框 -->
    <ElDialog
      v-model="showPermissionDialog"
      :title="`${currentRole?.roleName || '角色'} - 权限详情`"
      width="700px"
      top="5%"
      destroy-on-close
    >
      <div class="permission-view-content">
        <ElAlert
          title="角色权限信息"
          description="以下是该角色已拥有的所有权限列表，包括功能权限和数据权限。"
          type="info"
          show-icon
          style="margin-bottom: 20px;"
        />
        
        <ElTable
          v-loading="loading.view"
          :data="selectedRolePermissions"
          border
          stripe
          style="width: 100%;"
        >
          <ElTableColumn
            prop="id"
            label="权限ID"
            width="120"
            align="center"
          />
          <ElTableColumn
            prop="name"
            label="权限名称"
            min-width="150"
          />
          <ElTableColumn
            prop="key"
            label="权限标识"
            min-width="200"
            show-overflow-tooltip
          />
          <ElTableColumn
            prop="type"
            label="权限类型"
            width="100"
            align="center"
          >
            <template #default="scope">
              <ElTag :type="scope.row.type === 'list' ? 'success' : 'primary'" size="small">
                {{ scope.row.type }}
              </ElTag>
            </template>
          </ElTableColumn>
        </ElTable>
        
        <div class="permission-stats" v-if="selectedRolePermissions.length > 0">
          <ElTag type="info" size="small">
            总计: {{ selectedRolePermissions.length }} 项权限
          </ElTag>
          <ElTag type="success" size="small" style="margin-left: 10px;">
            功能权限: {{ selectedRolePermissions.filter(p => p.type !== 'data').length }} 项
          </ElTag>
          <ElTag type="warning" size="small" style="margin-left: 10px;">
            数据权限: {{ selectedRolePermissions.filter(p => p.type === 'data').length }} 项
          </ElTag>
        </div>
        
        <div v-else-if="!loading.view" class="empty-permissions">
          <ElEmpty
            description="该角色暂无权限，请在权限管理中分配权限。"
          />
        </div>
      </div>
      
      <template #footer>
        <ElButton type="primary" @click="closePermissionDialog">
          关闭
        </ElButton>
      </template>
    </ElDialog>
  </section>
</template>

<style scoped lang="scss">
.batch-actions {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
}

.permission-actions {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
}

.permission-tree-wrapper {
  height: 500px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.permission-icon {
  margin-right: 8px;
  font-size: 12px;
}

.permission-label {
  flex: 1;
  color: #606266;
}

.permission-key {
  font-size: 11px;
  color: #909399;
  margin-left: 10px;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
}

.disabled-tip {
  color: #c0c4cc;
  font-size: 12px;
  margin-left: 5px;
}

.permission-view-content {
  max-height: 500px;
  overflow-y: auto;
}

.permission-stats {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.empty-permissions {
  padding: 40px 0;
  text-align: center;
}
</style>