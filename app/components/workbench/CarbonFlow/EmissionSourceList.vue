<template>
  <div class="emission-source-list">
    <div class="header">
      <h3>排放源清单</h3>
      <div class="actions">
        <a-button type="primary" @click="handleAddSource">
          <template #icon><PlusOutlined /></template>
          添加排放源
        </a-button>
      </div>
    </div>

    <a-table
      :columns="columns"
      :data-source="emissionSources"
      :pagination="false"
      :loading="loading"
    >
      <!-- 排放源名称列 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'name'">
          <div class="source-name">
            <span>{{ record.name }}</span>
            <a-tag v-if="record.isCustom" color="blue">自定义</a-tag>
          </div>
        </template>

        <!-- 排放类型列 -->
        <template v-if="column.dataIndex === 'type'">
          <a-tag :color="getEmissionTypeColor(record.type)">
            {{ getEmissionTypeLabel(record.type) }}
          </a-tag>
        </template>

        <!-- 排放量列 -->
        <template v-if="column.dataIndex === 'amount'">
          <div class="amount-cell">
            <span>{{ formatAmount(record.amount) }}</span>
            <span class="unit">{{ record.unit }}</span>
          </div>
        </template>

        <!-- 证据文件列 -->
        <template v-if="column.dataIndex === 'evidence'">
          <div class="evidence-cell">
            <a-upload
              v-model:file-list="record.fileList"
              :action="`/api/upload-file`"
              :data="{ workflowId: workflowId }"
              :show-upload-list="false"
              :before-upload="(file) => beforeUpload(file, record)"
              @change="(info) => handleFileChange(info, record)"
            >
              <a-button type="link" :loading="record.uploading">
                <template #icon><UploadOutlined /></template>
                {{ record.fileList?.length ? '重新上传' : '上传文件' }}
              </a-button>
            </a-upload>
            <div v-if="record.fileList?.length" class="file-list">
              <div v-for="file in record.fileList" :key="file.uid" class="file-item">
                <PaperClipOutlined />
                <span class="file-name">{{ file.name }}</span>
                <a-button type="link" size="small" @click="handlePreviewFile(file)">
                  预览
                </a-button>
                <a-button type="link" size="small" @click="handleDeleteFile(file, record)">
                  删除
                </a-button>
              </div>
            </div>
          </div>
        </template>

        <!-- 操作列 -->
        <template v-if="column.dataIndex === 'action'">
          <div class="action-buttons">
            <a-button type="link" @click="handleEditSource(record)">
              编辑
            </a-button>
            <a-button type="link" danger @click="handleDeleteSource(record)">
              删除
            </a-button>
          </div>
        </template>
      </template>
    </a-table>

    <!-- 添加/编辑排放源对话框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
      >
        <a-form-item label="排放源名称" name="name">
          <a-input v-model:value="formState.name" placeholder="请输入排放源名称" />
        </a-form-item>
        <a-form-item label="排放类型" name="type">
          <a-select v-model:value="formState.type" placeholder="请选择排放类型">
            <a-select-option value="scope1">范围一</a-select-option>
            <a-select-option value="scope2">范围二</a-select-option>
            <a-select-option value="scope3">范围三</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="排放量" name="amount">
          <a-input-number
            v-model:value="formState.amount"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="单位" name="unit">
          <a-select v-model:value="formState.unit" placeholder="请选择单位">
            <a-select-option value="tCO2e">tCO2e</a-select-option>
            <a-select-option value="kgCO2e">kgCO2e</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, UploadOutlined, PaperClipOutlined } from '@ant-design/icons-vue';
import type { UploadProps } from 'ant-design-vue';
import { supabase } from '~/lib/supabase';

// ... existing code ...

// 文件上传相关
const beforeUpload = (file: File, record: EmissionSource) => {
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error('文件大小不能超过 10MB!');
    return false;
  }
  return true;
};

const handleFileChange: UploadProps['onChange'] = async (info, record) => {
  if (info.file.status === 'uploading') {
    record.uploading = true;
    return;
  }
  if (info.file.status === 'done') {
    record.uploading = false;
    message.success(`${info.file.name} 上传成功`);
    // 更新记录的文件列表
    record.fileList = [info.file];
    
    // 更新排放源的证明材料状态
    try {
      const { error } = await supabase
        .from('emission_sources')
        .update({ 
          evidence_status: 'uploaded',
          evidence_file_id: info.file.uid
        })
        .eq('id', record.id);

      if (error) {
        throw error;
      }

      // 更新本地状态
      record.evidence_status = 'uploaded';
      record.evidence_file_id = info.file.uid;
    } catch (error) {
      console.error('Error updating evidence status:', error);
      message.error('更新证明材料状态失败');
    }
  } else if (info.file.status === 'error') {
    record.uploading = false;
    message.error(`${info.file.name} 上传失败`);
  }
};

const handlePreviewFile = async (file: any) => {
  try {
    const { data: { publicUrl } } = supabase.storage
      .from('files')
      .getPublicUrl(file.url);

    window.open(publicUrl, '_blank');
  } catch (error) {
    console.error('Error previewing file:', error);
    message.error('预览文件失败');
  }
};

const handleDeleteFile = async (file: any, record: EmissionSource) => {
  try {
    // 从 Storage 中删除文件
    const { error: storageError } = await supabase.storage
      .from('files')
      .remove([file.url]);

    if (storageError) {
      throw storageError;
    }

    // 删除 workflow_files 表中的记录
    const { error: workflowFileError } = await supabase
      .from('workflow_files')
      .delete()
      .eq('file_id', file.uid);

    if (workflowFileError) {
      throw new Error(`Failed to delete workflow file record: ${workflowFileError.message}`);
    }

    // 删除 files 表中的记录
    const { error: fileError } = await supabase
      .from('files')
      .delete()
      .eq('id', file.uid);

    if (fileError) {
      throw new Error(`Failed to delete file record: ${fileError.message}`);
    }

    // 更新本地状态
    record.fileList = record.fileList?.filter(f => f.uid !== file.uid);
    message.success('文件删除成功');
  } catch (error) {
    console.error('Error deleting file:', error);
    message.error(`删除文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// ... existing code ...
</script>

<style scoped>
// ... existing code ...

.evidence-cell {
  .file-list {
    margin-top: 8px;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;

    .file-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style> 