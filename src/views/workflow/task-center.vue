<template>
  <div class="task-center-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>任务中心</span>
        </div>
      </template>
      
      <el-tabs v-model="activeTab" type="card">
        <!-- 待办任务 -->
        <el-tab-pane label="待办任务" name="pending">
          <el-table :data="pendingTasks" border style="width: 100%">
            <el-table-column prop="processTitle" label="流程标题" min-width="200"></el-table-column>
            <el-table-column prop="type" label="任务类型" min-width="100">
              <template #default="scope">
                <el-tag type="primary">审批</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" min-width="150">
              <template #default="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="150" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" @click="handleApprove(scope.row)">批准</el-button>
                <el-button type="danger" size="small" @click="handleReject(scope.row)">驳回</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="pendingTasks.length === 0" class="empty-state">
            <el-empty description="暂无待办任务"></el-empty>
          </div>
        </el-tab-pane>
        
        <!-- 已办任务 -->
        <el-tab-pane label="已办任务" name="completed">
          <el-table :data="completedTasks" border style="width: 100%">
            <el-table-column prop="processTitle" label="流程标题" min-width="200"></el-table-column>
            <el-table-column prop="type" label="任务类型" min-width="100">
              <template #default="scope">
                <el-tag type="success">审批</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="处理时间" min-width="150">
              <template #default="scope">
                {{ formatDate(scope.row.updatedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" min-width="100">
              <template #default="scope">
                <el-tag type="success">已完成</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="completedTasks.length === 0" class="empty-state">
            <el-empty description="暂无已办任务"></el-empty>
          </div>
        </el-tab-pane>
        
        <!-- 我发起的流程 -->
        <el-tab-pane label="我发起的流程" name="initiated">
          <el-table :data="initiatedProcesses" border style="width: 100%">
            <el-table-column prop="title" label="流程标题" min-width="200"></el-table-column>
            <el-table-column prop="status" label="流程状态" min-width="100">
              <template #default="scope">
                <el-tag :type="getStatusTagType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" min-width="150">
              <template #default="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="更新时间" min-width="150">
              <template #default="scope">
                {{ formatDate(scope.row.updatedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="100" fixed="right">
              <template #default="scope">
                <el-button type="info" size="small" @click="handleViewProcess(scope.row)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="initiatedProcesses.length === 0" class="empty-state">
            <el-empty description="暂无发起的流程"></el-empty>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 审批对话框 -->
    <el-dialog v-model="approveDialogVisible" title="审批流程" width="500px">
      <el-form ref="approveFormRef" :model="approveForm" label-width="80px">
        <el-form-item label="审批意见">
          <el-input v-model="approveForm.comment" type="textarea" :rows="4" placeholder="请输入审批意见"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmApprove">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 驳回对话框 -->
    <el-dialog v-model="rejectDialogVisible" title="驳回流程" width="500px">
      <el-form ref="rejectFormRef" :model="rejectForm" label-width="80px">
        <el-form-item label="驳回原因">
          <el-input v-model="rejectForm.comment" type="textarea" :rows="4" placeholder="请输入驳回原因"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 流程详情对话框 -->
    <el-dialog v-model="processDetailVisible" title="流程详情" width="600px">
      <div v-if="currentProcess" class="process-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="流程标题">{{ currentProcess.title }}</el-descriptions-item>
          <el-descriptions-item label="流程状态">
            <el-tag :type="getStatusTagType(currentProcess.status)">
              {{ getStatusText(currentProcess.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请人">{{ currentProcess.applicantName }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentProcess.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(currentProcess.updatedAt) }}</el-descriptions-item>
          <el-descriptions-item label="流程内容">
            <pre>{{ JSON.stringify(JSON.parse(currentProcess.content), null, 2) }}</pre>
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="process-history">
          <h4>流程历史</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in currentProcess.history"
              :key="index"
              :timestamp="formatDate(item.timestamp)"
            >
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>{{ item.user }}</span>
                    <span style="margin-left: 10px; color: #606060">{{ item.action }}</span>
                  </div>
                </template>
                <p>{{ item.comment }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useWorkflowStore } from '@/stores/Workflow';

const workflowStore = useWorkflowStore();
const activeTab = ref('pending');

// 对话框状态
const approveDialogVisible = ref(false);
const rejectDialogVisible = ref(false);
const processDetailVisible = ref(false);

// 当前处理的任务和流程
const currentTask = ref(null);
const currentProcess = ref(null);

// 表单数据
const approveForm = ref({ comment: '' });
const rejectForm = ref({ comment: '' });

// 表单引用
const approveFormRef = ref(null);
const rejectFormRef = ref(null);

// 计算属性：待办任务
const pendingTasks = computed(() => {
  return workflowStore.getMyPendingTasks();
});

// 计算属性：已办任务
const completedTasks = computed(() => {
  return workflowStore.getMyCompletedTasks();
});

// 计算属性：我发起的流程
const initiatedProcesses = computed(() => {
  return workflowStore.getMyInitiatedProcesses();
});

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

// 获取状态标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    draft: 'info',
    submitted: 'warning',
    approved: 'success',
    rejected: 'danger',
    completed: 'success'
  };
  return typeMap[status] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    draft: '草稿',
    submitted: '已提交',
    approved: '已批准',
    rejected: '已驳回',
    completed: '已完成'
  };
  return textMap[status] || '未知状态';
};

// 处理批准
const handleApprove = (task) => {
  currentTask.value = task;
  approveForm.value.comment = '';
  approveDialogVisible.value = true;
};

// 确认批准
const confirmApprove = () => {
  if (currentTask.value) {
    const result = workflowStore.approveProcessInstance(currentTask.value.processId, approveForm.value.comment);
    if (result) {
      ElMessage.success('流程批准成功');
      approveDialogVisible.value = false;
    } else {
      ElMessage.error('流程批准失败');
    }
  }
};

// 处理驳回
const handleReject = (task) => {
  currentTask.value = task;
  rejectForm.value.comment = '';
  rejectDialogVisible.value = true;
};

// 确认驳回
const confirmReject = () => {
  if (currentTask.value) {
    const result = workflowStore.rejectProcessInstance(currentTask.value.processId, rejectForm.value.comment);
    if (result) {
      ElMessage.success('流程驳回成功');
      rejectDialogVisible.value = false;
    } else {
      ElMessage.error('流程驳回失败');
    }
  }
};

// 查看流程详情
const handleViewProcess = (process) => {
  currentProcess.value = process;
  processDetailVisible.value = true;
};

// 页面挂载时刷新数据
onMounted(() => {
  // 数据已经在store初始化时加载
});
</script>

<style scoped>
.task-center-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.process-detail {
  padding: 10px;
}

.process-history {
  margin-top: 20px;
}

.process-history h4 {
  margin-bottom: 15px;
}
</style>
