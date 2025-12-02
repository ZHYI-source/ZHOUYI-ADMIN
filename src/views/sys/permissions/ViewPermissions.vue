<script setup>
import { ref, reactive, onMounted } from 'vue'

const props = defineProps({
  updateData: {
    type: Object,
    default: () => {}
  }
})

const emits = defineEmits(['close'])

const close = () => {
  emits('close')
}

onMounted(() => {
  // 组件挂载时的初始化逻辑
})
</script>

<template>
  <section>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="权限名称">
        {{ updateData.name || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="权限标识">
        <el-tag>{{ updateData.key || '-' }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="父级标识">
        <el-tag>{{ updateData.parent_key || '-' }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="权限类型">
        <el-tag :type="updateData.auth ? 'success' : 'info'">
          {{ updateData.auth ? '权限按钮' : '普通菜单' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="updateData.status ? 'success' : 'warning'">
          {{ updateData.status ? '正常' : '停用' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="排序">
        {{ updateData.sortOrder || 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ updateData.createdAt || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ updateData.updatedAt || '-' }}
      </el-descriptions-item>
    </el-descriptions>
    
    <div class="form-footer">
      <el-button size="default" @click="close">关闭</el-button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.form-footer {
  text-align: right;
  margin-top: 20px;
}
</style>