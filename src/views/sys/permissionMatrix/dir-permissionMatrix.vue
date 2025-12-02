<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElTable, ElTableColumn, ElTree, ElCheckbox, ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElMessage, ElMessageBox } from 'element-plus';
import { useDataPermissionStore } from '@/stores/dataPermission.js';
import { ZyNotification } from '@/utils/util.toast.js';
import { TimeUtils } from 'utils/util.time';
import { createPermission, updatePermission, deletePermission } from '@/api/permission.js';

const dataPermissionStore = useDataPermissionStore();

// 表格数据
const tableData = ref([]);

// 角色树
const roleTree = ref([]);

// 权限树
const permissionTree = ref([]);

// 加载状态
const loading = ref({
    list: false,
    tree: false
});

// 查询参数
const query = reactive({
    params: {},
    pagination: {
        current: 1,
        pageSize: 15
    },
    sort: {
        columnKey: "createdAt",
        order: "ascend"
    }
});

// 弹窗状态
const dialogVisible = ref(false);
const dialogTitle = ref('');
const editData = ref(null);

// 表单验证规则
const rules = reactive({
    roleId: [{ required: true, message: '请选择角色', trigger: 'blur' }],
    permissionId: [{ required: true, message: '请选择权限', trigger: 'blur' }]
});

// 表单数据
const formData = ref({
    roleId: '',
    permissionId: '',
    enabled: true
});

// 表格列配置
const columns = reactive([
    {
        prop: 'roleName',
        label: '角色名称',
        width: 180,
        align: 'center'
    },
    {
        prop: 'permissionName',
        label: '权限名称',
        width: 200,
        align: 'center'
    },
    {
        prop: 'permissionKey',
        label: '权限标识',
        width: 180,
        align: 'center'
    },
    {
        prop: 'enabled',
        label: '状态',
        width: 100,
        align: 'center',
        formatter: (row) => row.enabled ? '启用' : '禁用'
    },
    {
        prop: 'createdAt',
        label: '创建时间',
        width: 180,
        align: 'center',
        formatter: (row) => TimeUtils.formatTime(row.createdAt)
    },
    {
        prop: 'updatedAt',
        label: '更新时间',
        width: 180,
        align: 'center',
        formatter: (row) => TimeUtils.formatTime(row.updatedAt)
    },
    {
        prop: 'operation',
        label: '操作',
        width: 150,
        align: 'center',
        fixed: 'right'
    }
]);

// 批量操作相关
const selectedRoles = ref([]);
const selectedPermissions = ref([]);
const batchOperation = ref('');

// 加载角色权限矩阵数据
const loadPermissionMatrix = async () => {
    try {
        loading.value.list = true;
        
        // 模拟加载数据
        const mockData = [
            {
                id: 1,
                roleId: '1',
                roleName: '超级管理员',
                permissionId: '1',
                permissionName: '系统管理',
                permissionKey: 'sys',
                enabled: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 2,
                roleId: '2',
                roleName: '管理员',
                permissionId: '2',
                permissionName: '用户管理',
                permissionKey: 'sys:users',
                enabled: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 3,
                roleId: '3',
                roleName: '普通用户',
                permissionId: '3',
                permissionName: '查询用户',
                permissionKey: 'sys:users:list',
                enabled: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        tableData.value = mockData;
        loading.value.list = false;
    } catch (error) {
        console.error('加载角色权限矩阵失败:', error);
        loading.value.list = false;
        ZyNotification.error('加载角色权限矩阵失败');
    }
};

// 加载角色树
const loadRoleTree = async () => {
    try {
        loading.value.tree = true;
        
        // 模拟加载角色树
        const mockRoleTree = [
            {
                id: '1',
                label: '超级管理员',
                children: []
            },
            {
                id: '2',
                label: '管理员',
                children: [
                    {
                        id: '3',
                        label: '普通用户',
                        children: []
                    }
                ]
            }
        ];
        
        roleTree.value = mockRoleTree;
        loading.value.tree = false;
    } catch (error) {
        console.error('加载角色树失败:', error);
        loading.value.tree = false;
        ZyNotification.error('加载角色树失败');
    }
};

// 加载权限树
const loadPermissionTree = async () => {
    try {
        loading.value.tree = true;
        
        // 模拟加载权限树
        const mockPermissionTree = [
            {
                id: '1',
                label: '系统管理',
                key: 'sys',
                children: [
                    {
                        id: '2',
                        label: '用户管理',
                        key: 'sys:users',
                        children: [
                            {
                                id: '3',
                                label: '查询用户',
                                key: 'sys:users:list',
                                children: []
                            },
                            {
                                id: '4',
                                label: '创建用户',
                                key: 'sys:users:create',
                                children: []
                            },
                            {
                                id: '5',
                                label: '编辑用户',
                                key: 'sys:users:update',
                                children: []
                            },
                            {
                                id: '6',
                                label: '删除用户',
                                key: 'sys:users:delete',
                                children: []
                            }
                        ]
                    },
                    {
                        id: '7',
                        label: '角色管理',
                        key: 'sys:roles',
                        children: []
                    }
                ]
            }
        ];
        
        permissionTree.value = mockPermissionTree;
        loading.value.tree = false;
    } catch (error) {
        console.error('加载权限树失败:', error);
        loading.value.tree = false;
        ZyNotification.error('加载权限树失败');
    }
};

// 打开添加/编辑弹窗
const openDialog = (type, data = null) => {
    dialogTitle.value = type === 'add' ? '添加角色权限' : '编辑角色权限';
    dialogVisible.value = true;
    
    if (type === 'edit' && data) {
        editData.value = data;
        // 正确初始化表单数据，确保包含所有必要字段
        formData.value = {
            roleId: data.roleId || '',
            permissionId: data.permissionId || '',
            enabled: data.enabled !== undefined ? data.enabled : true
        };
    } else {
        editData.value = null;
        formData.value = {
            roleId: '',
            permissionId: '',
            enabled: true
        };
    }
};

// 关闭弹窗
const closeDialog = () => {
    dialogVisible.value = false;
    editData.value = null;
    formData.value = {
        roleId: '',
        permissionId: '',
        enabled: true
    };
};

// 保存角色权限
const savePermission = async () => {
    try {
        if (editData.value) {
            // 编辑模式 - 更新现有权限
            await updateRolePermission(formData.value);
            ZyNotification.success('权限更新成功');
        } else {
            // 添加模式 - 创建新权限
            await createRolePermission(formData.value);
            ZyNotification.success('权限添加成功');
        }
        
        dialogVisible.value = false;
        loadPermissionMatrix();
    } catch (error) {
        console.error('保存权限失败:', error);
        ZyNotification.error('保存权限失败，请稍后重试');
    }
};

// 删除角色权限
const deletePermission = async (id) => {
    try {
        await ElMessageBox.confirm('确定要删除这条角色权限吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });
        
        // 调用后端API删除角色权限
        await deletePermission(id);
        
        // 从前端表格中删除数据
        const index = tableData.value.findIndex(item => item.id === id);
        if (index !== -1) {
            tableData.value.splice(index, 1);
        }
        
        ZyNotification.success('删除成功');
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除角色权限失败:', error);
            ZyNotification.error('删除角色权限失败');
        }
    }
};

// 批量操作
const batchOperate = async () => {
    if (selectedRoles.value.length === 0 || selectedPermissions.value.length === 0) {
        ZyNotification.warning('请选择要操作的角色和权限');
        return;
    }
    
    if (!batchOperation.value) {
        ZyNotification.warning('请选择操作类型');
        return;
    }
    
    try {
        await ElMessageBox.confirm(`确定要对选中的${selectedRoles.value.length}个角色和${selectedPermissions.value.length}个权限执行${batchOperation.value === 'grant' ? '授权' : '取消授权'}操作吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });
        
        // 这里应该调用后端API执行批量操作
        ZyNotification.success(`批量${batchOperation.value === 'grant' ? '授权' : '取消授权'}成功`);
        
        // 清空选择
        selectedRoles.value = [];
        selectedPermissions.value = [];
        batchOperation.value = '';
    } catch (error) {
        if (error !== 'cancel') {
            console.error('批量操作失败:', error);
            ZyNotification.error('批量操作失败');
        }
    }
};

// 初始化
onMounted(() => {
    loadPermissionMatrix();
    loadRoleTree();
    loadPermissionTree();
});
</script>

<template>
    <div class="permission-matrix-page">
        <!-- 批量操作区域 -->
        <div class="batch-operation">
            <el-row :gutter="20">
                <el-col :span="8">
                    <el-select
                        v-model="batchOperation"
                        placeholder="请选择操作类型"
                        style="width: 100%"
                    >
                        <el-option label="批量授权" value="grant" />
                        <el-option label="批量取消授权" value="revoke" />
                    </el-select>
                </el-col>
                <el-col :span="8">
                    <el-button
                        type="primary"
                        @click="batchOperate"
                        :disabled="!batchOperation || selectedRoles.length === 0 || selectedPermissions.length === 0"
                    >
                        执行批量操作
                    </el-button>
                </el-col>
            </el-row>
        </div>

        <!-- 角色权限矩阵表格 -->
        <div class="matrix-table">
            <el-table
                :data="tableData"
                border
                style="width: 100%"
                :loading="loading.list"
                @selection-change="handleSelectionChange"
            >
                <el-table-column
                    type="selection"
                    width="55"
                />
                <el-table-column
                    v-for="column in columns"
                    :key="column.prop"
                    :prop="column.prop"
                    :label="column.label"
                    :width="column.width"
                    :align="column.align"
                    :fixed="column.fixed"
                >
                    <template #default="{ row }" v-if="column.prop === 'operation'">
                        <el-button
                            type="primary"
                            size="small"
                            @click="openDialog('edit', row)"
                        >
                            编辑
                        </el-button>
                        <el-button
                            type="danger"
                            size="small"
                            @click="deletePermission(row.id)"
                            style="margin-left: 5px"
                        >
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <!-- 角色树和权限树 -->
        <div class="tree-container">
            <el-row :gutter="20">
                <el-col :span="12">
                    <div class="tree-card">
                        <div class="tree-header">
                            <h3>角色树</h3>
                            <span>已选择: {{ selectedRoles.length }} 个角色</span>
                        </div>
                        <el-tree
                            :data="roleTree"
                            :props="{ label: 'label', children: 'children' }"
                            show-checkbox
                            default-expand-all
                            :check-strictly="true"
                            @check-change="handleRoleCheckChange"
                            :loading="loading.tree"
                        />
                    </div>
                </el-col>
                <el-col :span="12">
                    <div class="tree-card">
                        <div class="tree-header">
                            <h3>权限树</h3>
                            <span>已选择: {{ selectedPermissions.length }} 个权限</span>
                        </div>
                        <el-tree
                            :data="permissionTree"
                            :props="{ label: 'label', children: 'children' }"
                            show-checkbox
                            default-expand-all
                            :check-strictly="true"
                            @check-change="handlePermissionCheckChange"
                            :loading="loading.tree"
                        />
                    </div>
                </el-col>
            </el-row>
        </div>

        <!-- 添加/编辑弹窗 -->
        <el-dialog
            v-model="dialogVisible"
            :title="dialogTitle"
            width="500px"
            @close="closeDialog"
        >
            <el-form
                :model="formData"
                :rules="rules"
                ref="formRef"
                label-width="100px"
            >
                <el-form-item label="角色" prop="roleId">
                    <el-select v-model="formData.roleId" placeholder="请选择角色" style="width: 100%">
                        <el-option
                            v-for="role in roleTree"
                            :key="role.id"
                            :label="role.label"
                            :value="role.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="权限" prop="permissionId">
                    <el-select v-model="formData.permissionId" placeholder="请选择权限" style="width: 100%">
                        <el-option
                            v-for="permission in permissionTree"
                            :key="permission.id"
                            :label="permission.label"
                            :value="permission.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="状态">
                    <el-switch
                        v-model="formData.enabled"
                        active-text="启用"
                        inactive-text="禁用"
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="closeDialog">取消</el-button>
                    <el-button type="primary" @click="savePermission">保存</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<style scoped>
.permission-matrix-page {
    padding: 20px;
}

.batch-operation {
    margin-bottom: 20px;
    padding: 15px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.matrix-table {
    margin-bottom: 20px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.tree-container {
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    padding: 15px;
}

.tree-card {
    height: 400px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;
}

.tree-header {
    padding: 10px 15px;
    background: #f5f7fa;
    border-bottom: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.tree-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.tree-header span {
    font-size: 14px;
    color: #606266;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
</style>