# ZHOUYI·ADMIN 权限管理系统使用说明

## 概述

本系统在原有基础上新增了细粒度的权限管理功能，包括角色权限矩阵管理和数据权限控制，提供了更精细化的权限控制能力。

## 新增功能

### 1. 角色权限矩阵管理

**功能描述：**
- 可视化的角色权限配置界面
- 矩阵式布局，直观展示角色与权限的关系
- 支持按模块、功能点进行权限的批量分配和取消
- 高效的多层级权限树状结构和批量操作逻辑

**访问路径：**
- 系统管理 > 角色权限矩阵
- 路由地址：`/permissionMatrix`

**使用说明：**
1. 在角色树中选择要配置权限的角色
2. 在权限树中选择要分配的权限
3. 使用批量操作按钮进行权限的批量分配或取消
4. 点击保存按钮保存权限配置

### 2. 数据权限控制

**功能描述：**
- 基于用户/角色的数据范围权限控制
- 支持按组织架构树形结构设置数据可见范围
- 提供数据权限的继承和覆盖机制
- 支持以下数据范围：
  - 仅自己：只能查看自己的数据
  - 本部门：只能查看本部门的数据
  - 下属部门：可以查看本部门及下属部门的数据
  - 全部：可以查看所有数据

**访问路径：**
- 系统管理 > 数据权限控制
- 路由地址：`/dataPermission`

**使用说明：**
1. 在用户/角色树中选择要配置数据权限的用户或角色
2. 在组织架构树中选择数据可见范围
3. 选择数据范围类型（仅自己、本部门、下属部门、全部）
4. 设置是否继承上级权限
5. 点击保存按钮保存数据权限配置

## 技术实现

### 1. 数据权限状态管理

**文件：** `src/stores/dataPermission.js`

**功能：**
- 数据权限配置的状态管理
- 组织架构树的状态管理
- 用户数据权限的加载和保存
- 数据权限检查和过滤条件构建

**核心方法：**
- `loadDataPermissions()`: 加载数据权限配置
- `saveDataPermission(permission)`: 保存数据权限配置
- `deleteDataPermission(id)`: 删除数据权限配置
- `checkDataPermission(userId, resourceType)`: 检查用户是否有访问特定资源的权限
- `getUserDataPermissions()`: 获取当前用户的数据权限配置
- `buildDataPermissionFilter(resourceType)`: 构建数据权限过滤条件

### 2. 权限验证中间件

**文件：** `src/middleware/permissionMiddleware.js`

**功能：**
- 增强路由守卫的数据权限验证逻辑
- 在现有路由守卫基础上，添加数据权限验证
- 确保用户在访问受控数据时，自动过滤其权限范围内的数据

**核心方法：**
- `checkRoutePermission(to, from, next)`: 检查路由权限
- `checkBasicPermission(to)`: 检查基础路由权限
- `checkDataPermission(to)`: 检查数据权限
- `buildDataPermissionFilter(resourceType)`: 构建数据权限过滤条件
- `requestInterceptor(config)`: 请求拦截器，添加数据权限过滤条件
- `responseInterceptor(response, resourceType)`: 响应拦截器，过滤响应数据
- `routerMiddleware(to, from, next)`: 路由守卫中间件

### 3. 路由配置

**文件：** `src/router/routes.js`

**新增路由：**
- `/permissionMatrix`: 角色权限矩阵管理
- `/dataPermission`: 数据权限控制

**路由元数据：**
- `requiresAuth`: 是否需要登录
- `cache`: 是否缓存
- `perms`: 权限控制列表
- `dataPermission`: 是否需要数据权限验证

## 使用示例

### 1. 在API请求中使用数据权限过滤

```javascript
import permissionMiddleware from '@/middleware/permissionMiddleware.js';

// 在请求配置中添加数据权限过滤条件
const config = {
  url: '/api/users',
  method: 'get',
  dataPermission: 'user' // 指定资源类型
};

// 使用权限验证中间件的请求拦截器
const filteredConfig = permissionMiddleware.requestInterceptor(config);

// 发送请求
const response = await axios(filteredConfig);

// 使用权限验证中间件的响应拦截器
const filteredResponse = permissionMiddleware.responseInterceptor(response, 'user');

console.log('过滤后的数据:', filteredResponse.data);
```

### 2. 在组件中使用数据权限过滤

```javascript
import { useDataPermissionStore } from '@/stores/dataPermission.js';

const dataPermissionStore = useDataPermissionStore();

// 构建数据权限过滤条件
const filter = dataPermissionStore.buildDataPermissionFilter('user');

// 使用过滤条件获取数据
const users = await api.getUsers(filter);
```

### 3. 在路由中配置数据权限验证

```javascript
// 在路由配置中添加数据权限验证
{
  path: '/users',
  name: 'users',
  component: () => import('@/views/sys/users/dir-users.vue'),
  meta: {
    title: '管理员管理',
    requiresAuth: true,
    cache: true,
    perms: [
      '/sys/users/list',
      '/sys/users/create',
      '/sys/users/delete',
      '/sys/users/update',
    ],
    dataPermission: 'user' // 指定需要数据权限验证的资源类型
  },
}
```

## 权限管理最佳实践

### 1. 角色权限矩阵管理

- 按模块和功能点组织权限，便于批量分配
- 为不同角色设置不同的权限组合
- 定期审核和更新角色权限

### 2. 数据权限控制

- 根据用户的岗位职责设置合适的数据范围
- 对于敏感数据，使用更严格的数据权限控制
- 利用继承机制简化权限配置

### 3. 权限验证

- 在路由级别进行基础权限验证
- 在API级别进行数据权限验证
- 实现请求和响应的双重权限验证

## 注意事项

1. 数据权限控制需要后端API的支持，确保API能够正确处理过滤条件
2. 权限验证中间件会自动处理数据权限过滤，但需要在路由配置中正确设置`dataPermission`元数据
3. 数据权限配置会影响用户在系统中的数据可见性，请谨慎配置
4. 建议在生产环境中定期备份权限配置数据

## 技术支持

如果在使用过程中遇到问题，请查看系统文档或联系技术支持。