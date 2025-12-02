<script setup>
import {ref, reactive, computed, onMounted} from 'vue';
import {ElTable, ElTableColumn, ElTree, ElButton, ElRow, ElCol, ElCard, ElSelect, ElOption, ElRadioGroup, ElRadio, ElAlert, ElMessage, ElDialog, ElForm, ElFormItem} from 'element-plus';
import {useRouter} from 'vue-router';
import {TimeUtils} from 'utils/util.time';
import {ZyConfirm, ZyNotification} from '@/utils/util.toast.js';
import {useDataPermissionStore} from '@/stores/dataPermission.js';

const router = useRouter()
const dataPermissionStore = useDataPermissionStore()

// 选中的目标类型（用户/角色）
const selectedTargetType = ref('role')
// 目标数据
const targetData = ref([])
// 选中的目标ID
const selectedTargetId = ref('')
// 部门树形数据
const departmentTree = ref([])
// 数据权限规则数据
const dataPermissionRules = ref([])
// 已选部门ID
const selectedDepartmentIds = ref([])
// 权限类型
const permissionType = ref(dataPermissionStore.DATA_PERMISSION_TYPE.DEPARTMENT_SELF)
// 弹窗状态
const dialogVisible = ref(false)
// 加载状态
const loading = ref({
  list: false,
  save: false,
  department: false,
  text: '加载中...'
})

// 数据权限类型选项
const permissionTypeOptions = [
  {
    label: '全部数据',
    value: dataPermissionStore.DATA_PERMISSION_TYPE.ALL,
    desc: '可以查看所有部门的数据'
  },
  {
    label: '本部门数据',
    value: dataPermissionStore.DATA_PERMISSION_TYPE.DEPARTMENT_SELF,
    desc: '只能查看所属部门的数据'
  },
  {
    label: '本部门及子部门数据',
    value: dataPermissionStore.DATA_PERMISSION_TYPE.DEPARTMENT_CHILDREN,
    desc: '可以查看所属部门及所有子部门的数据'
  },
  {
    label: '自定义部门数据',
    value: dataPermissionStore.DATA_PERMISSION_TYPE.ASSIGNED,
    desc: '可以查看指定的多个部门的数据'
  },
  {
    label: '特定部门数据',
    value: dataPermissionStore.DATA_PERMISSION_TYPE.SPECIFIC,
    desc: '只能查看特定部门的数据（不包含子部门）'
  }
]

// 目标类型选项
const targetTypeOptions = [
  { label: '角色', value: dataPermissionStore.DATA_PERMISSION_TARGET.ROLE },
  { label: '用户', value: dataPermissionStore.DATA_PERMISSION_TARGET.USER },
  { label: '部门', value: dataPermissionStore.DATA_PERMISSION_TARGET.DEPARTMENT }
]

// 表格列配置
const tableColumns = [
  {
    prop: 'targetName',
    label: '目标名称',
    align: 'left',
    width: 200
  },
  {
    prop: 'targetType',
    label: '目标类型',
    align: 'left',
    width: 100,
    formatter: (row) => {
      return row.targetType === 'role' ? '角色' : row.targetType === 'user' ? '用户' : '部门'
    }
  },
  {
    prop: 'permissionType',
    label: '权限类型',
    align: 'left',
    width: 200,
    formatter: (row) => {
      const option = permissionTypeOptions.find(opt => opt.value === row.permissionType)
      return option?.label || row.permissionType
    }
  },
  {
    prop: 'departmentInfo',
    label: '权限部门',
    align: 'left',
    width: 300,
    formatter: (row) => {
      if (row.permissionType === dataPermissionStore.DATA_PERMISSION_TYPE.ALL) {
        return '全部部门'
      }
      if (row.permissionType === dataPermissionStore.DATA_PERMISSION_TYPE.DEPARTMENT_SELF) {
        return '本部门'
      }
      if (row.permissionType === dataPermissionStore.DATA_PERMISSION_TYPE.DEPARTMENT_CHILDREN) {
        return `本部门及子部门 (${row.departmentNames?.join(', ') || '-'})`
      }
      return row.departmentNames?.join(', ') || '-' || '无'
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
    prop: 'actions',
    label: '操作',
    align: 'center',
    width: 200,
    fixed: 'right'
  }
]

// 树形控件默认展开全部
const defaultExpandedKeys = ref([])

// 权限类型变更
const handlePermissionTypeChange = (value) => {
  permissionType.value = value
  // 根据权限类型重置部门选择
  if (value === dataPermissionStore.DATA_PERMISSION_TYPE.ALL) {
    selectedDepartmentIds.value = []
  }
}

// 目标类型变更
const handleTargetTypeChange = (value) => {
  selectedTargetType.value = value
  getTargetData()
}

// 递归加载部门树
function buildDepartmentTree(data) {
  return data.map(item => {
    const node = {
      id: item._id,
      label: item.deptName,
      disabled: item.disabled || false
    }
    
    if (item.children && item.children.length > 0) {
      node.children = buildDepartmentTree(item.children)
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

// 部门选择变更
const handleDepartmentSelectionChange = (checkedKeys, halfCheckedKeys) => {
  selectedDepartmentIds.value = checkedKeys.concat(halfCheckedKeys)
}

// 获取目标数据（角色/用户/部门）
const getTargetData = async () => {
  try {
    loading.value.list = true
    // TODO: 根据类型调用API获取数据
    // const result = selectedTargetType.value === 'role' 
    //   ? await getRoles() 
    //   : selectedTargetType.value === 'user' 
    //   ? await getUsers() 
    //   : await getDepartments()
    
    // 模拟数据
    if (selectedTargetType.value === 'role') {
      targetData.value = [
        {
          "_id": "6672431d8e067423d01ca17c",
          "roleName": "超级管理员",
          "roleAuth": "SUPER",
          "status": true,
          "createdAt": "2024-06-19T02:31:57.708Z",
          "updatedAt": "2024-06-19T02:31:57.708Z"
        },
        {
          "_id": "66724424a9b358ece99a82af",
          "roleName": "管理员",
          "roleAuth": "ADMIN",
          "status": true,
          "createdAt": "2024-06-19T02:36:20.600Z",
          "updatedAt": "2024-06-19T03:39:21.246Z"
        },
        {
          "_id": "66724534a9b358ece99a82b5",
          "roleName": "普通用户",
          "roleAuth": "USER",
          "status": true,
          "createdAt": "2024-06-19T02:40:20.600Z",
          "updatedAt": "2024-06-19T03:40:21.246Z"
        }
      ]
    } else if (selectedTargetType.value === 'user') {
      targetData.value = [
        {
          "_id": "66724424a9b358ece99a82af",
          "username": "admin",
          "nickname": "超级管理员",
          "status": true,
          "deptName": "技术部",
          "createdAt": "2024-06-19T02:36:20.600Z",
          "updatedAt": "2024-06-19T03:39:21.246Z"
        }
      ]
    } else {
      targetData.value = [
        {
          "_id": "66724645a9b358ece99a82bc",
          "deptName": "技术部",
          "deptCode": "TECH",
          "status": true,
          "createdAt": "2024-06-19T02:44:21.600Z",
          "updatedAt": "2024-06-19T03:44:21.246Z"
        }
      ]
    }
  } catch (error) {
    ZyNotification.error('获取数据失败：' + error.message)
  } finally {
    loading.value.list = false
  }
}

// 获取部门树
const getDepartmentTree = async () => {
  try {
    loading.value.department = true
    // TODO: 调用API获取部门树
    // const result = await getDepartmentsTree()
    
    // 模拟数据
    const deptData = [
      {
        "_id": "66724645a9b358ece99a82bc",
        "deptName": "技术部",
        "deptCode": "TECH",
        "parentId": null,
        "status": true,
        "children": [
          {
            "_id": "66724756a9b358ece99a82c2",
            "deptName": "前端组",
            "deptCode": "FE",
            "parentId": "66724645a9b358ece99a82bc",
            "status": true
          },
          {
            "_id": "66724867a9b358ece99a82c8",
            "deptName": "后端组",
            "deptCode": "BE",
            "parentId": "66724645a9b358ece99a82bc",
            "status": true
          },
          {
            "_id": "66724978a9b358ece99a82ce",
            "deptName": "测试组",
            "deptCode": "TEST",
            "parentId": "66724645a9b358ece99a82bc",
            "status": true
          }
        ]
      },
      {
        "_id": "66724a89a9b358ece99a82d4",
        "deptName": "市场部",
        "deptCode": "MARKET",
        "parentId": null,
        "status": true,
        "children": [
          {
            "_id": "66724b9aa9b358ece99a82da",
            "deptName": "销售组",
            "deptCode": "SALES",
            "parentId": "66724a89a9b358ece99a82d4",
            "status": true
          },
          {
            "_id": "66724caab9b358ece99a82e0",
            "deptName": "推广组",
            "deptCode": "PROMO",
            "parentId": "66724a89a9b358ece99a82d4",
            "status": true
          }
        ]
      },
      {
        "_id": "66724dbba9b358ece99a82e6",
        "deptName": "财务部",
        "deptCode": "FINANCE",
        "parentId": null,
        "status": true
      }
    ]
    
    departmentTree.value = buildDepartmentTree(deptData)
    expandAllNodes(departmentTree.value, defaultExpandedKeys.value)
  } catch (error) {
    ZyNotification.error('获取部门树失败：' + error.message)
  } finally {
    loading.value.department = false
  }
}

// 获取数据权限规则列表
const getDataPermissionRules = async () => {
  try {
    loading.value.list = true
    // TODO: 调用API获取数据权限规则
    // const result = await getDataPermissions()
    
    // 模拟数据
    dataPermissionRules.value = [
      {
        "_id": "66724ecda9b358ece99a82ec",
        "targetId": "6672431d8e067423d01ca17c",
        "targetName": "超级管理员",
        "targetType": "role",
        "permissionType": dataPermissionStore.DATA_PERMISSION_TYPE.ALL,
        "departmentIds": [],
        "departmentNames": [],
        "status": true,
        "createdAt": "2024-06-19T02:50:21.600Z",
        "updatedAt": "2024-06-19T03:50:21.246Z"
      },
      {
        "_id": "66724fdea9b358ece99a82f2",
        "targetId": "66724424a9b358ece99a82af",
        "targetName": "管理员",
        "targetType": "role",
        "permissionType": dataPermissionStore.DATA_PERMISSION_TYPE.DEPARTMENT_CHILDREN,
        "departmentIds": ["66724645a9b358ece99a82bc"],
        "departmentNames": ["技术部"],
        "status": true,
        "createdAt": "2024-06-19T02:52:21.600Z",
        "updatedAt": "2024-06-19T03:52:21.246Z"
      }
    ]
  } catch (error) {
    ZyNotification.error('获取数据权限规则失败：' + error.message)
  } finally {
    loading.value.list = false
  }
}

// 打开配置弹窗
const openConfigDialog = () => {
  if (!selectedTargetId.value) {
    ElMessage.warning('请选择要配置的目标！')
    return
  }
  dialogVisible.value = true
}

// 保存数据权限配置
const saveDataPermission = async () => {
  if (!selectedTargetId.value) {
    ElMessage.warning('请选择要配置的目标！')
    return
  }

  try {
    loading.value.save = true
    // TODO: 调用API保存数据权限配置
    // const result = await saveDataPermissionConfig({
    //   targetId: selectedTargetId.value,
    //   targetType: selectedTargetType.value,
    //   permissionType: permissionType.value,
    //   departmentIds: selectedDepartmentIds.value
    // })
    
    // 模拟API调用成功
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ZyNotification.success('数据权限配置成功')
    dialogVisible.value = false
    getDataPermissionRules()
  } catch (error) {
    ZyNotification.error('数据权限配置失败：' + error.message)
  } finally {
    loading.value.save = false
  }
}

// 删除数据权限规则
const deleteDataPermission = async (id) => {
  try {
    await ZyConfirm('确定要删除该数据权限规则吗？')
    // TODO: 调用API删除数据权限规则
    // const result = await deleteDataPermissionRule({ id })
    
    // 模拟API调用成功
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ZyNotification.success('数据权限规则删除成功')
    getDataPermissionRules()
  } catch (error) {
    if (error !== 'cancel') {
      ZyNotification.error('数据权限规则删除失败：' + error.message)
    }
  }
}

// 查看数据权限规则详情
const viewDataPermission = (row) => {
  // TODO: 查看详情逻辑
  console.log('查看数据权限规则详情：', row)
}

// 组件挂载时初始化数据
onMounted(() => {
  getTargetData()
  getDepartmentTree()
  getDataPermissionRules()
})
</script>

<template>
  <section>
    <ElAlert
      title="数据权限配置"
      description="为用户、角色或部门设置数据可见范围，支持按组织架构树形结构进行配置。"
      type="info"
      show-icon
      style="margin-bottom: 20px;"
    />

    <ElRow :gutter="20" style="margin-bottom: 20px;">
      <ElCol :span="8">
        <div class="target-selector">
          <span class="label">目标类型：</span>
          <ElSelect
            v-model="selectedTargetType"
            style="width: 150px;"
            @change="handleTargetTypeChange"
          >
            <ElOption
              v-for="option in targetTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </div>
      </ElCol>
      <ElCol :span="16">
        <div class="target-selector">
          <span class="label">选择目标：</span>
          <ElSelect
            v-model="selectedTargetId"
            style="width: 250px;"
            placeholder="请选择"
          >
            <ElOption
              v-for="item in targetData"
              :key="item._id"
              :label="item.roleName || item.username || item.deptName"
              :value="item._id"
            />
          </ElSelect>
          <ElButton
            type="primary"
            size="small"
            style="margin-left: 10px;"
            :disabled="!selectedTargetId"
            @click="openConfigDialog"
          >
            配置数据权限
          </ElButton>
        </div>
      </ElCol>
    </ElRow>

    <ElCard title="数据权限规则列表" shadow="hover">
      <ElTable
        v-loading="loading.list"
        :data="dataPermissionRules"
        border
        stripe
        ref="tableRef"
        style="width: 100%;"
      >
        <ElTableColumn
          v-for="column in tableColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :align="column.align"
          :width="column.width"
          :fixed="column.fixed"
          :formatter="column.formatter"
        >
          <template #default="scope" v-if="column.prop === 'actions'">
            <ElButton
              type="text"
              size="small"
              @click="viewDataPermission(scope.row)"
            >
              查看
            </ElButton>
            <ElButton
              type="text"
              size="small"
              danger
              @click="deleteDataPermission(scope.row._id)"
            >
              删除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <!-- 数据权限配置弹窗 -->
    <ElDialog
      title="数据权限配置"
      v-model="dialogVisible"
      width="800px"
      :loading="loading.save"
    >
      <ElForm
        ref="formRef"
        :model="{ permissionType, selectedDepartmentIds }"
        label-width="120px"
      >
        <ElFormItem label="权限类型">
          <ElRadioGroup v-model="permissionType" @change="handlePermissionTypeChange">
            <ElRadio
              v-for="option in permissionTypeOptions"
              :key="option.value"
              :value="option.value"
              style="display: block; margin-bottom: 10px;"
            >
              <div style="line-height: 1.5;">
                <div>{{ option.label }}</div>
                <div style="font-size: 12px; color: #909399;">{{ option.desc }}</div>
              </div>
            </ElRadio>
          </ElRadioGroup>
        </ElFormItem>

        <ElFormItem
          label="权限部门"
          v-if="permissionType !== dataPermissionStore.DATA_PERMISSION_TYPE.ALL"
        >
          <div class="department-tree-wrapper">
            <ElTree
              :data="departmentTree"
              show-checkbox
              :default-expanded-keys="defaultExpandedKeys"
              node-key="id"
              @check-change="handleDepartmentSelectionChange"
            >
              <template #default="{ node, data }">
                <span class="custom-tree-node">
                  <span>{{ data.label }}</span>
                  <span v-if="data.disabled" class="disabled-tip">(禁用)</span>
                </span>
              </template>
            </ElTree>
          </div>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <span class="dialog-footer">
          <ElButton @click="dialogVisible = false">
            取 消
          </ElButton>
          <ElButton type="primary" @click="saveDataPermission">
            确 定
          </ElButton>
        </span>
      </template>
    </ElDialog>
  </section>
</template>

<style scoped lang="scss">
.target-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .label {
    font-weight: 500;
  }
}

.department-tree-wrapper {
  height: 300px;
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

.disabled-tip {
  color: #c0c4cc;
  font-size: 12px;
  margin-left: 5px;
}
</style>