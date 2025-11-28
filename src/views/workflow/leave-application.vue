<template>
  <div class="leave-application-container">
    <el-card title="请假申请">
      <el-form ref="formRef" :model="formData" label-width="100px">
        <el-form-item label="请假类型" prop="type" :rules="[{ required: true, message: '请选择请假类型', trigger: 'change' }]">
          <el-select v-model="formData.type" placeholder="请选择请假类型">
            <el-option label="事假" value="personal"></el-option>
            <el-option label="病假" value="sick"></el-option>
            <el-option label="年假" value="annual"></el-option>
            <el-option label="调休" value="compensatory"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="请假标题" prop="title" :rules="[{ required: true, message: '请输入请假标题', trigger: 'blur' }]">
          <el-input v-model="formData.title" placeholder="请输入请假标题"></el-input>
        </el-form-item>
        <el-form-item label="请假时间" prop="timeRange" :rules="[{ required: true, message: '请选择请假时间', trigger: 'change' }]">
          <el-date-picker
            v-model="formData.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="请假天数" prop="days" :rules="[{ required: true, message: '请输入请假天数', trigger: 'blur' }]">
          <el-input-number v-model="formData.days" :min="0.5" :step="0.5" placeholder="请输入请假天数"></el-input-number>
        </el-form-item>
        <el-form-item label="请假原因" prop="reason" :rules="[{ required: true, message: '请输入请假原因', trigger: 'blur' }]">
          <el-input v-model="formData.reason" type="textarea" :rows="4" placeholder="请输入请假原因"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm">提交申请</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { useWorkflowStore } from '@/stores/Workflow';
import { useRouter } from 'vue-router';

const formRef = ref(null);
const router = useRouter();
const workflowStore = useWorkflowStore();

const formData = reactive({
  type: '',
  title: '',
  timeRange: [],
  days: 0,
  reason: ''
});

const submitForm = async () => {
  try {
    await formRef.value.validate();
    
    // 创建流程实例
    const processData = {
      type: 'leave',
      title: formData.title,
      content: JSON.stringify({
        type: formData.type,
        timeRange: formData.timeRange,
        days: formData.days,
        reason: formData.reason
      })
    };
    
    const processInstance = workflowStore.createProcessInstance(processData);
    
    // 提交流程实例
    const submittedProcess = workflowStore.submitProcessInstance(processInstance.id);
    
    if (submittedProcess) {
      ElMessage.success('请假申请提交成功');
      router.push('/workflow/task-center');
    } else {
      ElMessage.error('请假申请提交失败');
    }
  } catch (error) {
    console.error('表单验证失败:', error);
    ElMessage.error('表单验证失败，请检查填写内容');
  }
};

const resetForm = () => {
  formRef.value.resetFields();
};
</script>

<style scoped>
.leave-application-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
</style>
