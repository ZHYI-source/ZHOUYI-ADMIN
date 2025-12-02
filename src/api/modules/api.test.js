import service from '../server.js';

/**
 * 测试数据权限控制的API接口
 */

export const testDataPermission = async (params) => {
  try {
    const response = await service.get('/test/dataPermission', {
      params
    });
    return response.data;
  } catch (error) {
    console.error('测试数据权限控制失败:', error);
    throw error;
  }
};

export const testUserList = async (params) => {
  try {
    const response = await service.get('/test/users', {
      params
    });
    return response.data;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    throw error;
  }
};

export const testDepartmentList = async (params) => {
  try {
    const response = await service.get('/test/departments', {
      params
    });
    return response.data;
  } catch (error) {
    console.error('获取部门列表失败:', error);
    throw error;
  }
};

export const testRoleList = async (params) => {
  try {
    const response = await service.get('/test/roles', {
      params
    });
    return response.data;
  } catch (error) {
    console.error('获取角色列表失败:', error);
    throw error;
  }
};

export const testPermissionList = async (params) => {
  try {
    const response = await service.get('/test/permissions', {
      params
    });
    return response.data;
  } catch (error) {
    console.error('获取权限列表失败:', error);
    throw error;
  }
};