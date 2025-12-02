<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElTable, ElTableColumn, ElTree, ElCheckbox, ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElMessage, ElMessageBox, ElRadio, ElRadioGroup } from 'element-plus';
import { useDataPermissionStore } from '@/stores/dataPermission.js';
import { ZyNotification } from '@/utils/util.toast.js';
import { TimeUtils } from 'utils/util.time';

const dataPermissionStore = useDataPermissionStore();

// 表格数据
const tableData = ref([]);

// 组织架构树
const organizationTree = ref([]);

// 用户/角色树
const userRoleTree = ref([]);

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
    userId: [{ required: true, message: '请选择用户/角色', trigger: 'blur' }],
    resourceType: [{ required: true, message: '请选择资源类型', trigger: 'blur' }],
    dataScope: [{ required: true, message: '请选择数据范围', trigger: 'blur' }]
});

// 表单数据
const formData = ref({
    userId: '',
    resourceType: '',
    dataScope: '',
    enabled: true,
    inherit: false
});

// 表格列配置
const columns = reactive([
    {
        prop: 'userName',
        label: '用户/角色名称',
        width: 180,
        align: 'center'
    },
    {
        prop: 'resourceType',
        label: '资源类型',
        width: 150,
        align: 'center'
    },
    {
        prop: 'dataScope',
        label: '数据范围',
        width: 150,
        align: 'center',
        formatter: (row) => {
            const scopeMap = {
                'self': '仅自己',
                'department': '本部门',
                'subordinate': '下属部门',
                'all': '全部'
            };
            return scopeMap[row.dataScope] || row.dataScope;
        }
    },
    {
        prop: 'inherit',
        label: '继承上级',
        width: 100,
        align: 'center',
        formatter: (row) => row.inherit ? '是' : '否'
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
const selectedUsers = ref([]);
const selectedResources = ref([]);
const batchOperation = ref('');

// 加载数据权限配置
const loadDataPermissions = async () => {
    try {
        loading.value.list = true;
        
        // 模拟加载数据
        const mockData = [
            {
                id: 1,
                userId: '1',
                userName: '超级管理员',
                resourceType: 'user',
                dataScope: 'all',
                inherit: false,
                enabled: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 2,
                userId: '2',
                userName: '管理员',
                resourceType: 'user',
                dataScope: 'department',
                inherit: true,
                enabled: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 3,
                userId: '3',
                userName: '普通用户',
                resourceType: 'user',
                dataScope: 'self',
                inherit: false,
                enabled: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        tableData.value = mockData;
        loading.value.list = false;
    } catch (error) {
        console.error('加载数据权限配置失败:', error);
        loading.value.list = false;
        ZyNotification.error('加载数据权限配置失败');
    }
};

// 加载组织架构树
const loadOrganizationTree = async () => {
    try {
        loading.value.tree = true;
        
        // 模拟加载组织架构树
        const mockOrganizationTree = [
            {
                id: '1',
                label: '总公司',
                children: [
                    {
                        id: '2',
                        label: '技术部',
                        children: [
                            {
                                id: '3',
                                label: '前端开发组',
                                children: []
                            },
                            {
                                id: '4',
                                label: '后端开发组',
                                children: []
                            }
                        ]
                    },
                    {
                        id: '5',
                        label: '市场部',
                        children: []
                    },
                    {
                        id: '6',
                        label: '财务部',
                        children: []
                    }
                ]
            }
        ];
        
        organizationTree.value = mockOrganizationTree;
        loading.value.tree = false;
    } catch (error) {
        console.error('加载组织架构树失败:', error);
        loading.value.tree = false;
        ZyNotification.error('加载组织架构树失败');
    }
};

// 加载用户/角色树
const loadUserRoleTree = async () => {
    try {
        loading.value.tree = true;
        
        // 模拟加载用户/角色树
        const mockUserRoleTree = [
            {
                id: '1',
                label: '超级管理员',
                type: 'role',
                children: []
            },
            {
                id: '2',
                label: '管理员',
                type: 'role',
                children: [
                    {
                        id: '3',
                        label: '张三',
                        type: 'user',
                        children: []
                    },
                    {
                        id: '4',
                        label: '李四',
                        type: 'user',
                        children: []
                    }
                ]
            },
            {
                id: '5',
                label: '普通用户',
                type: 'role',
                children: [
                    {
                        id: '6',
                        label: '王五',
                        type: 'user',
                        children: []
                    }
                ]
            }
        ];
        
        userRoleTree.value = mockUserRoleTree;
        loading.value.tree = false;
    } catch (error) {
        console.error('加载用户/角色树失败:', error);
        loading.value.tree = false;
        ZyNotification.error('加载用户/角色树失败');
    }
};

// 打开添加/编辑弹窗
const openDialog = (type, data = null) => {
    dialogTitle.value = type === 'add' ? '添加数据权限' : '编辑数据权限';
    dialogVisible.value = true;
    
    if (type === 'edit' && data) {
        editData.value = data;
        formData.value = { ...data };
    } else {
        editData.value = null;
        formData.value = {
            userId: '',
            resourceType: '',
            dataScope: '',
            enabled: true,
            inherit: false
        };
    }
};

// 关闭弹窗
const closeDialog = () => {
    dialogVisible.value = false;
    editData.value = null;
    formData.value = {
        userId: '',
        resourceType: '',
        dataScope: '',
        enabled: true,
        inherit: false
    };
};

// 保存数据权限
const saveDataPermission = async () => {
    try {
        // 这里应该调用后端API保存数据权限
        if (editData.value) {
            // 编辑模式
            const index = tableData.value.findIndex(item => item.id === editData.value.id);
            if (index !== -1) {
                tableData.value[index] = { ...tableData.value[index], ...formData.value };
            }
        } else {
            // 添加模式
            const newItem = {
                id: Date.now(),
                ...formData.value,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            tableData.value.unshift(newItem);
        }
        
        ZyNotification.success('保存成功');
        closeDialog();
    } catch (error) {
        console.error('保存数据权限失败:', error);
        ZyNotification.error('保存数据权限失败');
    }
};

// 删除数据权限
const deleteDataPermission = async (id) => {
    try {
        await ElMessageBox.confirm('确定要删除这条数据权限吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });
        
        // 这里应该调用后端API删除数据权限
        const index = tableData.value.findIndex(item => item.id === id);
        if (index !== -1) {
            tableData.value.splice(index, 1);
        }
        
        ZyNotification.success('删除成功');
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除数据权限失败:', error);
            ZyNotification.error('删除数据权限失败');
        }
    }
};

// 批量操作
const batchOperate = async () => {
    if (selectedUsers.value.length === 0 || selectedResources.value.length === 0) {
        ZyNotification.warning('请选择要操作的用户/角色和资源类型');
        return;
    }
    
    if (!batchOperation.value) {
        ZyNotification.warning('请选择操作类型');
        return;
    }
    
    try {
        await ElMessageBox.confirm(`确定要对选中的${selectedUsers.value.length}个用户/角色和${selectedResources.value.length}个资源类型执行${batchOperation.value === 'grant' ? '授权' : '取消授权'}操作吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });
        
        // 这里应该调用后端API执行批量操作
        ZyNotification.success(`批量${batchOperation.value === 'grant' ? '授权' : '取消授权'}成功`);
        
        // 清空选择
        selectedUsers.value = [];
        selectedResources.value = [];
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
    loadDataPermissions();
    loadOrganizationTree();
    loadUserRoleTree();
});
</script>

<template>
    <div class="data-permission-page">
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
                        :disabled="!batchOperation || selectedUsers.length === 0 || selectedResources.length === 0"
                    >
                        执行批量操作
                    </el-button>
                </el-col>
            </el-row>
        </div>

        <!-- 数据权限配置表格 -->
        <div class="permission-table">
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
                            @click="deleteDataPermission(row.id)"
                            style="margin-left: 5px"
                        >
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <!-- 组织架构树和用户/角色树 -->
        <div class="tree-container">
            <el-row :gutter="20">
                <el-col :span="12">
                    <div class="tree-card">
                        <div class="tree-header">
                            <h3>组织架构树</h3>
                        </div>
                        <el-tree
                            :data="organizationTree"
                            :props="{ label: 'label', children: 'children' }"
                            show-checkbox
                            default-expand-all
                            :check-strictly="true"
                            @check-change="handleOrganizationCheckChange"
                            :loading="loading.tree"
                        />
                    </div>
                </el-col>
                <el-col :span="12">
                    <div class="tree-card">
                        <div class="tree-header">
                            <h3>用户/角色树</h3>
                            <span>已选择: {{ selectedUsers.length }} 个</span>
                        </div>
                        <el-tree
                            :data="userRoleTree"
                            :props="{ label: 'label', children: 'children' }"
                            show-checkbox
                            default-expand-all
                            :check-strictly="true"
                            @check-change="handleUserRoleCheckChange"
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
                <el-form-item label="用户/角色" prop="userId">
                    <el-select v-model="formData.userId" placeholder="请选择用户/角色" style="width: 100%">
                        <el-option
                            v-for="item in userRoleTree"
                            :key="item.id"
                            :label="item.label"
                            :value="item.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="资源类型" prop="resourceType">
                    <el-select v-model="formData.resourceType" placeholder="请选择资源类型" style="width: 100%">
                        <el-option label="用户" value="user" />
                        <el-option label="角色" value="role" />
                        <el-option label="部门" value="department" />
                        <el-option label="菜单" value="menu" />
                    </el-select>
                </el-form-item>
                <el-form-item label="数据范围" prop="dataScope">
                    <el-radio-group v-model="formData.dataScope">
                        <el-radio label="self">仅自己</el-radio>
                        <el-radio label="department">本部门</el-radio>
                        <el-radio label="subordinate">下属部门</el-radio>
                        <el-radio label="all">全部</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="继承上级">
                    <el-switch
                        v-model="formData.inherit"
                        active-text="是"
                        inactive-text="否"
                    />
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
                    <el-button type="primary" @click="saveDataPermission">保存</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<style scoped>
.data-permission-page {
    padding: 20px;
}

.batch-operation {
    margin-bottom: 20px;
    padding: 15px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.permission-table {
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