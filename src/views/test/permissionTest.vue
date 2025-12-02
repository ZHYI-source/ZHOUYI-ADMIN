<template>
  <div class="permission-test">
    <h1>权限管理功能测试</h1>
    
    <div class="test-section">
      <h2>1. 角色权限矩阵管理</h2>
      <p>功能描述：可视化的角色权限配置界面，支持按模块、功能点进行权限的批量分配和取消</p>
      <el-button type="primary" @click="goToPermissionMatrix">访问角色权限矩阵</el-button>
    </div>
    
    <div class="test-section">
      <h2>2. 数据权限控制</h2>
      <p>功能描述：基于用户/角色的数据范围权限控制，支持按组织架构树形结构设置数据可见范围</p>
      <el-button type="primary" @click="goToDataPermission">访问数据权限控制</el-button>
    </div>
    
    <div class="test-section">
      <h2>3. 权限验证中间件</h2>
      <p>功能描述：增强路由守卫的数据权限验证逻辑，确保用户在访问受控数据时，自动过滤其权限范围内的数据</p>
      <el-button type="primary" @click="testPermissionMiddleware">测试权限验证中间件</el-button>
    </div>
    
    <div class="test-section">
      <h2>4. 数据权限状态管理</h2>
      <p>功能描述：扩展现有Pinia store结构，新增数据权限状态管理</p>
      <el-button type="primary" @click="testDataPermissionStore">测试数据权限状态管理</el-button>
    </div>
    
    <div class="test-section">
      <h2>5. 权限验证结果</h2>
      <p>当前用户：{{ currentUser }}</p>
      <p>用户权限：{{ userPermissions }}</p>
      <p>数据权限配置：{{ dataPermissions }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/Users.js';
import { useDataPermissionStore } from '@/stores/dataPermission.js';
import permissionMiddleware from '@/middleware/permissionMiddleware.js';

const router = useRouter();
const authStore = useAuthStore();
const dataPermissionStore = useDataPermissionStore();

const currentUser = ref('');
const userPermissions = ref([]);
const dataPermissions = ref([]);

// 访问角色权限矩阵
const goToPermissionMatrix = () => {
  router.push('/permissionMatrix');
};

// 访问数据权限控制
const goToDataPermission = () => {
  router.push('/dataPermission');
};

// 测试权限验证中间件
const testPermissionMiddleware = async () => {
  try {
    // 初始化store
    permissionMiddleware.initStores();
    
    // 模拟路由对象
    const to = {
      path: '/test',
      name: 'test',
      meta: {
        requiresAuth: true,
        perms: ['test:view'],
        dataPermission: 'test'
      }
    };
    
    const from = {
      path: '/',
      name: 'home'
    };
    
    const next = () => {
      console.log('权限验证通过');
      alert('权限验证通过');
    };
    
    // 检查权限
    const hasPermission = await permissionMiddleware.checkRoutePermission(to, from, next);
    
    if (hasPermission) {
      console.log('权限验证通过');
      alert('权限验证通过');
    } else {
      console.log('权限验证失败');
      alert('权限验证失败');
    }
  } catch (error) {
    console.error('权限验证中间件测试失败:', error);
    alert('权限验证中间件测试失败');
  }
};

// 测试数据权限状态管理
const testDataPermissionStore = async () => {
  try {
    // 加载数据权限配置
    await dataPermissionStore.loadDataPermissions();
    
    // 获取当前用户的数据权限配置
    const userDataPermissions = dataPermissionStore.getUserDataPermissions();
    console.log('当前用户的数据权限配置:', userDataPermissions);
    
    // 构建数据权限过滤条件
    const filter = dataPermissionStore.buildDataPermissionFilter('test');
    console.log('数据权限过滤条件:', filter);
    
    alert('数据权限状态管理测试成功');
  } catch (error) {
    console.error('数据权限状态管理测试失败:', error);
    alert('数据权限状态管理测试失败');
  }
};

// 初始化页面数据
const initPageData = () => {
  // 获取当前用户信息
  currentUser.value = authStore.user?.username || '未登录';
  
  // 获取用户权限
  userPermissions.value = authStore.perms || [];
  
  // 获取数据权限配置
  dataPermissions.value = dataPermissionStore.dataPermissions || [];
};

// 页面加载时初始化数据
onMounted(() => {
  initPageData();
});
</script>

<style scoped>
.permission-test {
  padding: 20px;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

h1 {
  margin-bottom: 30px;
  color: #303133;
}

h2 {
  margin-bottom: 15px;
  color: #606266;
}

p {
  margin-bottom: 15px;
  color: #909399;
}
</style>