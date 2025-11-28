import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import dbUtils from '@/utils/util.strotage.js';

// 流程状态枚举
const PROCESS_STATUS = {
  DRAFT: 'draft',      // 草稿
  SUBMITTED: 'submitted', // 已提交
  APPROVED: 'approved',   // 已批准
  REJECTED: 'rejected',   // 已驳回
  COMPLETED: 'completed'  // 已完成
};

// 任务类型枚举
const TASK_TYPE = {
  APPROVAL: 'approval',   // 审批任务
  REVIEW: 'review',       // 审核任务
  NOTIFICATION: 'notification' // 通知任务
};

// 任务状态枚举
const TASK_STATUS = {
  PENDING: 'pending',     // 待处理
  COMPLETED: 'completed'  // 已完成
};

export const useWorkflowStore = defineStore('Workflow', () => {
  // 流程实例列表
  const processInstances = ref([]);
  // 任务列表
  const tasks = ref([]);

  // 初始化数据
  const initData = () => {
    const savedProcesses = dbUtils.get('workflow_processes');
    const savedTasks = dbUtils.get('workflow_tasks');
    if (savedProcesses) {
      processInstances.value = JSON.parse(savedProcesses);
    }
    if (savedTasks) {
      tasks.value = JSON.parse(savedTasks);
    }
  };

  // 保存数据到本地存储
  const saveData = () => {
    dbUtils.set('workflow_processes', JSON.stringify(processInstances.value));
    dbUtils.set('workflow_tasks', JSON.stringify(tasks.value));
  };

  // 创建流程实例
  const createProcessInstance = (processData) => {
    const userInfo = dbUtils.get('userInfo');
    const processInstance = {
      id: Date.now().toString(),
      type: processData.type,
      title: processData.title,
      content: processData.content,
      applicantId: userInfo._id,
      applicantName: userInfo.nickname,
      status: PROCESS_STATUS.DRAFT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          action: 'create',
          user: userInfo.nickname,
          timestamp: new Date().toISOString(),
          comment: '创建流程'
        }
      ]
    };
    processInstances.value.push(processInstance);
    saveData();
    return processInstance;
  };

  // 提交流程实例
  const submitProcessInstance = (processId) => {
    const userInfo = dbUtils.get('userInfo');
    const processInstance = processInstances.value.find(p => p.id === processId);
    if (processInstance && processInstance.status === PROCESS_STATUS.DRAFT) {
      processInstance.status = PROCESS_STATUS.SUBMITTED;
      processInstance.updatedAt = new Date().toISOString();
      processInstance.history.push({
        action: 'submit',
        user: userInfo.nickname,
        timestamp: new Date().toISOString(),
        comment: '提交流程'
      });

      // 创建审批任务
      const task = {
        id: Date.now().toString(),
        processId: processId,
        processTitle: processInstance.title,
        type: TASK_TYPE.APPROVAL,
        assigneeId: 'approver1', // 这里简单设置为固定审批人，实际项目中应该根据流程配置动态分配
        assigneeName: '审批人',
        status: TASK_STATUS.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      tasks.value.push(task);

      saveData();
      return processInstance;
    }
    return null;
  };

  // 审批流程实例
  const approveProcessInstance = (processId, comment) => {
    const userInfo = dbUtils.get('userInfo');
    const processInstance = processInstances.value.find(p => p.id === processId);
    if (processInstance && processInstance.status === PROCESS_STATUS.SUBMITTED) {
      processInstance.status = PROCESS_STATUS.APPROVED;
      processInstance.updatedAt = new Date().toISOString();
      processInstance.history.push({
        action: 'approve',
        user: userInfo.nickname,
        timestamp: new Date().toISOString(),
        comment: comment || '批准流程'
      });

      // 完成对应的审批任务
      const task = tasks.value.find(t => t.processId === processId && t.status === TASK_STATUS.PENDING);
      if (task) {
        task.status = TASK_STATUS.COMPLETED;
        task.updatedAt = new Date().toISOString();
      }

      // 这里简单设置为审批后直接完成流程，实际项目中可能需要更多步骤
      processInstance.status = PROCESS_STATUS.COMPLETED;

      saveData();
      return processInstance;
    }
    return null;
  };

  // 驳回流程实例
  const rejectProcessInstance = (processId, comment) => {
    const userInfo = dbUtils.get('userInfo');
    const processInstance = processInstances.value.find(p => p.id === processId);
    if (processInstance && processInstance.status === PROCESS_STATUS.SUBMITTED) {
      processInstance.status = PROCESS_STATUS.REJECTED;
      processInstance.updatedAt = new Date().toISOString();
      processInstance.history.push({
        action: 'reject',
        user: userInfo.nickname,
        timestamp: new Date().toISOString(),
        comment: comment || '驳回流程'
      });

      // 完成对应的审批任务
      const task = tasks.value.find(t => t.processId === processId && t.status === TASK_STATUS.PENDING);
      if (task) {
        task.status = TASK_STATUS.COMPLETED;
        task.updatedAt = new Date().toISOString();
      }

      saveData();
      return processInstance;
    }
    return null;
  };

  // 获取我的待办任务
  const getMyPendingTasks = () => {
    const userInfo = dbUtils.get('userInfo');
    // 这里简单处理，实际项目中应该根据用户角色和权限判断
    return tasks.value.filter(t => t.status === TASK_STATUS.PENDING);
  };

  // 获取我的已办任务
  const getMyCompletedTasks = () => {
    const userInfo = dbUtils.get('userInfo');
    // 这里简单处理，实际项目中应该根据用户角色和权限判断
    return tasks.value.filter(t => t.status === TASK_STATUS.COMPLETED);
  };

  // 获取我发起的流程
  const getMyInitiatedProcesses = () => {
    const userInfo = dbUtils.get('userInfo');
    return processInstances.value.filter(p => p.applicantId === userInfo._id);
  };

  // 获取流程实例详情
  const getProcessInstanceById = (processId) => {
    return processInstances.value.find(p => p.id === processId);
  };

  // 获取任务详情
  const getTaskById = (taskId) => {
    return tasks.value.find(t => t.id === taskId);
  };

  // 初始化数据
  initData();

  return {
    processInstances,
    tasks,
    createProcessInstance,
    submitProcessInstance,
    approveProcessInstance,
    rejectProcessInstance,
    getMyPendingTasks,
    getMyCompletedTasks,
    getMyInitiatedProcesses,
    getProcessInstanceById,
    getTaskById,
    PROCESS_STATUS,
    TASK_TYPE,
    TASK_STATUS
  };
});
