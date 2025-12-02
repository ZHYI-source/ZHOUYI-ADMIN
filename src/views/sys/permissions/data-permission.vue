<script setup>
import {ref, reactive, onMounted, computed} from 'vue'
import {useDataPermissionStore} from '@/stores/dataPermission.js'
import {ZyNotification} from '@/utils/util.toast.js'
import {ElMessageBox, ElForm} from 'element-plus'
import {Search, Refresh, InfoFilled} from '@element-plus/icons-vue'

const dataPermissionStore = useDataPermissionStore()

const loading = ref({
  dept: false,
  role: false
})

// 角色列表
const roles = ref([])
// 部门树
const deptTree = ref([])
// 选中的角色
const selectedRole = ref(null)
// 数据权限配置
const dataPermissionForm = reactive({
  type: dataPermissionStore.DATA_PERMISSION_TYPE.ALL,
  deptIds: [],
  userIds: []
})

// 树形配置
const deptTreeProps = {
  children: 'children',
  label: 'deptName'
}

// 用户列表
const userList = ref([])
// 筛选后的用户列表
const filteredUsers = computed(() => {
  if (!userSearchKeyword.value) return userList.value
  
  return userList.value.filter(user => 
    user.nickname.toLowerCase().includes(userSearchKeyword.value.toLowerCase()) ||
    user.username.toLowerCase().includes(userSearchKeyword.value.toLowerCase()) ||
    user.deptName.toLowerCase().includes(userSearchKeyword.value.toLowerCase())
  )
})
// 选中的用户
const selectedUsers = ref([])
// 用户搜索关键词
const userSearchKeyword = ref('')

// 模拟获取角色列表
const getRoles = async () => {
  try {
    loading.value.role = true
    const roleList = {
      data: {
        "result": [
          {
            "_id": "64a423816f4197cfc70375e3",
            "roleName": "超级管理员",
            "roleAuth": "SUPER-ADMIN",
            "remark": "拥有所有权限"
          },
          {
            "_id": "64a426a56f4197cfc70375f6",
            "roleName": "普通管理员",
            "roleAuth": "NORMALL-ADMIN",
            "remark": "拥有部分权限"
          },
          {
            "_id": "64a7aa20a971facd04696242",
            "roleName": "访客",
            "roleAuth": "VISITOR-ADMIN",
            "remark": "一般访客，更多的是有查看权限"
          }
        ]
      }
    }
    roles.value = roleList.data.result
    selectedRole.value = roles.value[1]
    loading.value.role = false
  } catch (e) {
    loading.value.role = false
  }
}

// 模拟获取部门树
const getDeptTree = async () => {
  try {
    loading.value.dept = true
    const deptData = {
      data: {
        "result": [
          {
            "_id": "1",
            "deptName": "公司总部",
            "children": [
              {
                "_id": "1-1",
                "deptName": "技术部",
                "children": [
                  {
                    "_id": "1-1-1",
                    "deptName": "前端开发组"
                  },
                  {
                    "_id": "1-1-2",
                    "deptName": "后端开发组"
                  },
                  {
                    "_id": "1-1-3",
                    "deptName": "测试组"
                  }
                ]
              },
              {
                "_id": "1-2",
                "deptName": "产品部",
                "children": [
                  {
                    "_id": "1-2-1",
                    "deptName": "产品设计组"
                  },
                  {
                    "_id": "1-2-2",
                    "deptName": "产品运营组"
                  }
                ]
              },
              {
                "_id": "1-3",
                "deptName": "市场部"
              }
            ]
          },
          {
            "_id": "2",
            "deptName": "北京分公司",
            "children": [
              {
                "_id": "2-1",
                "deptName": "北京技术部"
              }
            ]
          }
        ]
      }
    }
    deptTree.value = deptData.data.result
    loading.value.dept = false
  } catch (e) {
    loading.value.dept = false
  }
}

// 模拟获取用户列表
const getUsers = async () => {
  try {
    const userData = {
      data: {
        "result": [
          {
            "_id": "1001",
            "username": "zhangsan",
            "nickname": "张三",
            "deptName": "技术部-前端开发组"
          },
          {
            "_id": "1002",
            "username": "lisi",
            "nickname": "李四",
            "deptName": "技术部-后端开发组"
          },
          {
            "_id": "1003",
            "username": "wangwu",
            "nickname": "王五",
            "deptName": "产品部-产品设计组"
          },
          {
            "_id": "1004",
            "username": "zhaoliu",
            "nickname": "赵六",
            "deptName": "市场部"
          }
        ]
      }
    }
    userList.value = userData.data.result
  } catch (e) {
    console.error(e)
  }
}

// 切换权限类型
const handleTypeChange = (type) => {
  dataPermissionForm.type = type
  if (type !== dataPermissionStore.DATA_PERMISSION_TYPE.CUSTOM) {
    dataPermissionForm.deptIds = []
    dataPermissionForm.userIds = []
    selectedUsers.value = []
  }
}

// 部门选择变化
const handleDeptChange = (value) => {
  dataPermissionForm.deptIds = value
}

// 用户选择变化
const handleUserChange = (value) => {
  selectedUsers.value = value
  dataPermissionForm.userIds = value.map(user => user._id)
}

// 刷新数据
const refreshData = () => {
  getRoles()
  getDeptTree()
  getUsers()
  ZyNotification.success('数据已刷新')
}

// 保存数据权限配置
const saveDataPermission = async () => {
  try {
    if (!selectedRole.value) {
      ZyNotification.warning('请先选择要配置的角色！')
      return
    }
    
    if (dataPermissionForm.type === dataPermissionStore.DATA_PERMISSION_TYPE.CUSTOM && 
        dataPermissionForm.deptIds.length === 0 && dataPermissionForm.userIds.length === 0) {
      ZyNotification.warning('自定义权限请至少选择部门或用户！')
      return
    }

    ElMessageBox.confirm(
      '确认保存当前角色的数据权限配置吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(async () => {
      // 调用API保存数据权限配置
      // await saveRoleDataPermission(selectedRole.value._id, dataPermissionForm)
      dataPermissionStore.setDataPermission(dataPermissionForm)
      ZyNotification.success('数据权限配置保存成功！')
    })
  } catch (e) {
    console.error(e)
  }
}

// 切换选中角色
const handleRoleChange = (role) => {
  selectedRole.value = role
  // 加载角色已有的数据权限配置
  const savedPermission = dataPermissionStore.getDataPermission()
  Object.assign(dataPermissionForm, savedPermission)
  
  if (savedPermission.type === dataPermissionStore.DATA_PERMISSION_TYPE.CUSTOM) {
    selectedUsers.value = userList.value.filter(user => savedPermission.userIds.includes(user._id))
  }
}

onMounted(() => {
  getRoles()
  getDeptTree()
  getUsers()
})
</script>

<template>
  <section class="data-permission-page">
    <div class="container">
      <el-card shadow="hover">
        <template #header>
          <div class="page-header">
            <span>数据权限配置</span>
            <div class="header-actions">
              <el-button 
                size="small" 
                icon="Refresh"
                @click="refreshData"
                tooltip="刷新数据"
              />
            </div>
          </div>
        </template>

        <div class="config-content">
          <div class="role-select-section">
            <el-form :model="dataPermissionForm" label-width="100px">
              <el-form-item 
                label="选择角色" 
                required
                :status="selectedRole ? '' : 'error'"
              >
                <el-select 
                  v-model="selectedRole" 
                  placeholder="请选择要配置的角色"
                  style="width: 350px"
                  @change="handleRoleChange"
                  filterable
                >
                  <el-option 
                    v-for="role in roles" 
                    :key="role._id"
                    :label="role.roleName"
                    :value="role"
                  >
                    <template #label>
                      <span style="display: flex; justify-content: space-between; align-items: center; width: 100%">
                        <span>{{ role.roleName }}</span>
                        <el-tag size="small" type="info">{{ role.roleAuth }}</el-tag>
                      </span>
                    </template>
                  </el-option>
                </el-select>
                <template #help>
                  <span class="form-help-text">选择需要配置数据权限的目标角色</span>
                </template>
              </el-form-item>

              <el-form-item 
                label="权限策略" 
                required
                class="permission-strategy"
              >
                <el-radio-group v-model="dataPermissionForm.type" @change="handleTypeChange">
                  <div class="radio-group-row">
                    <el-radio :label="dataPermissionStore.DATA_PERMISSION_TYPE.ALL">
                      <div class="radio-item">
                        <div class="radio-title">全部数据权限</div>
                        <div class="radio-desc">可以查看系统中的所有数据，不受任何范围限制</div>
                      </div>
                    </el-radio>
                  </div>
                  <div class="radio-group-row">
                    <el-radio :label="dataPermissionStore.DATA_PERMISSION_TYPE.SELF">
                      <div class="radio-item">
                        <div class="radio-title">仅查看自己创建的数据</div>
                        <div class="radio-desc">只能查看自己创建的相关业务数据</div>
                      </div>
                    </el-radio>
                  </div>
                  <div class="radio-group-row">
                    <el-radio :label="dataPermissionStore.DATA_PERMISSION_TYPE.DEPT">
                      <div class="radio-item">
                        <div class="radio-title">仅查看本部门数据</div>
                        <div class="radio-desc">只能查看当前用户所在部门的数据</div>
                      </div>
                    </el-radio>
                  </div>
                  <div class="radio-group-row">
                    <el-radio :label="dataPermissionStore.DATA_PERMISSION_TYPE.DEPT_AND_CHILD">
                      <div class="radio-item">
                        <div class="radio-title">查看本部门及子部门数据</div>
                        <div class="radio-desc">可以查看当前用户所在部门及其所有子部门的数据</div>
                      </div>
                    </el-radio>
                  </div>
                  <div class="radio-group-row">
                    <el-radio :label="dataPermissionStore.DATA_PERMISSION_TYPE.CUSTOM">
                      <div class="radio-item">
                        <div class="radio-title">自定义数据权限</div>
                        <div class="radio-desc">灵活配置可以查看的部门和用户数据</div>
                      </div>
                    </el-radio>
                  </div>
                </el-radio-group>
              </el-form-item>

              <el-form-item 
                v-if="dataPermissionForm.type === dataPermissionStore.DATA_PERMISSION_TYPE.CUSTOM"
                label="部门权限"
              >
                <div class="dept-tree-container">
                  <div class="tree-header">
                    <span>选择可见部门</span>
                    <span class="selected-count">已选: {{ dataPermissionForm.deptIds.length }}</span>
                  </div>
                  <el-tree
                    :data="deptTree"
                    :props="deptTreeProps"
                    :loading="loading.dept"
                    show-checkbox
                    node-key="_id"
                    :default-expanded-keys="['1']"
                    :checked-keys="dataPermissionForm.deptIds"
                    @check-change="handleDeptChange"
                    highlight-current
                  />
                </div>
              </el-form-item>

              <el-form-item 
                v-if="dataPermissionForm.type === dataPermissionStore.DATA_PERMISSION_TYPE.CUSTOM"
                label="用户权限"
              >
                <div class="user-select-container">
                  <el-input
                    v-model="userSearchKeyword"
                    placeholder="搜索用户姓名或账号"
                    size="small"
                    prefix-icon="Search"
                    style="margin-bottom: 10px;"
                  />
                  <el-select
                    v-model="selectedUsers"
                    multiple
                    placeholder="请选择可见用户"
                    style="width: 100%"
                    @change="handleUserChange"
                    :collapse-tags="true"
                    :max-collapse-tags="3"
                  >
                    <el-option
                      v-for="user in filteredUsers"
                      :key="user._id"
                      :label="`${user.nickname} (${user.username}) - ${user.deptName}`"
                      :value="user"
                    >
                      <template #label>
                        <span style="display: flex; justify-content: space-between; align-items: center; width: 100%">
                          <span>{{ user.nickname }} ({{ user.username }})</span>
                          <el-tag size="small" type="primary" effect="plain">{{ user.deptName }}</el-tag>
                        </span>
                      </template>
                    </el-option>
                  </el-select>
                  <template #help>
                    <span class="form-help-text">最多可选择100个用户，已选: {{ selectedUsers.length }}</span>
                  </template>
                </div>
              </el-form-item>

              <div class="action-buttons">
                <el-button 
                  type="primary" 
                  size="large"
                  @click="saveDataPermission" 
                  :disabled="!selectedRole"
                  :loading="loading.save"
                >
                  <el-icon><Save /></el-icon> 保存数据权限配置
                </el-button>
                <el-button 
                  size="large"
                  @click="() => { 
                    Object.assign(dataPermissionForm, {type: dataPermissionStore.DATA_PERMISSION_TYPE.ALL, deptIds: [], userIds: []});
                    selectedUsers.value = [];
                  }"
                >
                  <el-icon><Refresh /></el-icon> 重置配置
                </el-button>
              </div>
            </el-form>
          </div>

          <div class="description-section">
            <el-card shadow="hover" class="tips-card">
              <template #header>
                <div class="tips-header">
                  <el-icon class="tips-icon"><InfoFilled /></el-icon>
                  <span>配置小贴士</span>
                </div>
              </template>
              <div class="tips-list">
                <div class="tips-item">
                  <div class="tips-title">💡 权限优先级</div>
                  <div class="tips-content">超级管理员默认拥有全部数据权限，不受配置限制</div>
                </div>
                <div class="tips-item">
                  <div class="tips-title">⚠️ 注意事项</div>
                  <div class="tips-content">配置完成后需要重新登录才能生效数据权限变更</div>
                </div>
                <div class="tips-item">
                  <div class="tips-title">📊 权限生效范围</div>
                  <div class="tips-content">数据权限将作用于所有业务模块的数据查询接口</div>
                </div>
                <div class="tips-item">
                  <div class="tips-title">🔒 安全建议</div>
                  <div class="tips-content">避免给普通用户分配过大的数据权限范围，遵循最小权限原则</div>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </el-card>
    </div>
  </section>
</template>

<style scoped>
.data-permission-page {
  padding: 20px;
}

.container {
  max-width: 1500px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-content {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.role-select-section {
  flex: 1;
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.description-section {
  width: 420px;
}

.permission-strategy {
  padding-top: 10px;
}

.radio-group-row {
  margin-bottom: 12px;
}

.radio-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.3s;
  margin-left: 8px;
}

.radio-item:hover {
  background-color: #f9fafb;
}

.radio-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.radio-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.form-help-text {
  font-size: 12px;
  color: #9ca3af;
}

.dept-tree-container {
  height: 400px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow-y: auto;
  background-color: #ffffff;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
  font-size: 13px;
  font-weight: 500;
}

.selected-count {
  color: #3b82f6;
  font-size: 12px;
  background-color: #eff6ff;
  padding: 2px 6px;
  border-radius: 10px;
}

.user-select-container {
  background-color: #ffffff;
}

.action-buttons {
  margin-top: 40px;
  display: flex;
  gap: 12px;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid #f3f4f6;
}

.tips-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #334155;
}

.tips-icon {
  color: #3b82f6;
  font-size: 18px;
}

.tips-list {
  padding: 10px 0;
}

.tips-item {
  margin-bottom: 20px;
  padding: 12px;
  background-color: #ffffff;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.tips-item:last-child {
  margin-bottom: 0;
}

.tips-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 6px;
  color: #1e293b;
}

.tips-content {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
}
</style>