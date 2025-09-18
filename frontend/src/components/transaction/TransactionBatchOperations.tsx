import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Modal,
  Form,
  Select,
  Input,
  message,
  Popconfirm,
  Progress,
  Alert,
  Divider,
  Tag,
  List,
  Typography,
  Tooltip
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  TagsOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

interface Transaction {
  id: string;
  portfolioId: string;
  portfolioName: string;
  assetId: string;
  assetName: string;
  assetSymbol: string;
  transactionType: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAWAL' | 'DIVIDEND' | 'INTEREST';
  side: 'LONG' | 'SHORT';
  quantity: number;
  price: number;
  amount: number;
  fee: number;
  executedAt: string;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'FAILED';
  notes?: string;
  tags: string[];
}

interface BatchOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

interface TransactionBatchOperationsProps {
  selectedTransactions: Transaction[];
  onBatchUpdate: (transactionIds: string[], updates: Partial<Transaction>) => Promise<BatchOperationResult>;
  onBatchDelete: (transactionIds: string[]) => Promise<BatchOperationResult>;
  onBatchExport: (transactionIds: string[], format: 'csv' | 'excel' | 'pdf') => Promise<void>;
  onClearSelection: () => void;
}

const TransactionBatchOperations: React.FC<TransactionBatchOperationsProps> = ({
  selectedTransactions,
  onBatchUpdate,
  onBatchDelete,
  onBatchExport,
  onClearSelection
}) => {
  const [batchUpdateVisible, setBatchUpdateVisible] = useState(false);
  const [batchTagVisible, setBatchTagVisible] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [operationResult, setOperationResult] = useState<BatchOperationResult | null>(null);
  const [form] = Form.useForm();
  const [tagForm] = Form.useForm();

  const selectedCount = selectedTransactions.length;

  // 批量更新状态
  const handleBatchUpdateStatus = async (status: Transaction['status']) => {
    setProcessing(true);
    setProgress(0);
    
    try {
      const transactionIds = selectedTransactions.map(t => t.id);
      const result = await onBatchUpdate(transactionIds, { status });
      
      setOperationResult(result);
      setProgress(100);
      
      if (result.success > 0) {
        message.success(`成功更新 ${result.success} 条交易记录`);
      }
      if (result.failed > 0) {
        message.error(`${result.failed} 条记录更新失败`);
      }
      
      onClearSelection();
    } catch (error) {
      message.error('批量更新失败');
    } finally {
      setProcessing(false);
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    setProcessing(true);
    setProgress(0);
    
    try {
      const transactionIds = selectedTransactions.map(t => t.id);
      const result = await onBatchDelete(transactionIds);
      
      setOperationResult(result);
      setProgress(100);
      
      if (result.success > 0) {
        message.success(`成功删除 ${result.success} 条交易记录`);
      }
      if (result.failed > 0) {
        message.error(`${result.failed} 条记录删除失败`);
      }
      
      onClearSelection();
    } catch (error) {
      message.error('批量删除失败');
    } finally {
      setProcessing(false);
    }
  };

  // 批量更新字段
  const handleBatchUpdate = async (values: any) => {
    setProcessing(true);
    setProgress(0);
    
    try {
      const transactionIds = selectedTransactions.map(t => t.id);
      const updates: Partial<Transaction> = {};
      
      // 只更新有值的字段
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
          updates[key as keyof Transaction] = values[key];
        }
      });
      
      const result = await onBatchUpdate(transactionIds, updates);
      
      setOperationResult(result);
      setProgress(100);
      
      if (result.success > 0) {
        message.success(`成功更新 ${result.success} 条交易记录`);
      }
      if (result.failed > 0) {
        message.error(`${result.failed} 条记录更新失败`);
      }
      
      setBatchUpdateVisible(false);
      form.resetFields();
      onClearSelection();
    } catch (error) {
      message.error('批量更新失败');
    } finally {
      setProcessing(false);
    }
  };

  // 批量添加标签
  const handleBatchAddTags = async (values: { tags: string[] }) => {
    setProcessing(true);
    setProgress(0);
    
    try {
      const transactionIds = selectedTransactions.map(t => t.id);
      
      // 合并现有标签和新标签
      const updates: Partial<Transaction> = {
        tags: values.tags
      };
      
      const result = await onBatchUpdate(transactionIds, updates);
      
      setOperationResult(result);
      setProgress(100);
      
      if (result.success > 0) {
        message.success(`成功为 ${result.success} 条交易记录添加标签`);
      }
      if (result.failed > 0) {
        message.error(`${result.failed} 条记录标签添加失败`);
      }
      
      setBatchTagVisible(false);
      tagForm.resetFields();
      onClearSelection();
    } catch (error) {
      message.error('批量添加标签失败');
    } finally {
      setProcessing(false);
    }
  };

  // 批量导出
  const handleBatchExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setProcessing(true);
    setProgress(0);
    
    try {
      const transactionIds = selectedTransactions.map(t => t.id);
      await onBatchExport(transactionIds, format);
      
      setProgress(100);
      message.success(`成功导出 ${selectedCount} 条交易记录`);
      setExportVisible(false);
    } catch (error) {
      message.error('导出失败');
    } finally {
      setProcessing(false);
    }
  };

  // 获取选中交易的统计信息
  const getSelectionStats = () => {
    const totalAmount = selectedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalFee = selectedTransactions.reduce((sum, t) => sum + t.fee, 0);
    const statusCounts = selectedTransactions.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { totalAmount, totalFee, statusCounts };
  };

  const stats = getSelectionStats();

  if (selectedCount === 0) {
    return null;
  }

  return (
    <Card
      title={
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          已选择 {selectedCount} 条交易记录
        </Space>
      }
      extra={
        <Button size="small" onClick={onClearSelection}>
          清除选择
        </Button>
      }
      style={{ marginBottom: 16 }}
    >
      {/* 选择统计 */}
      <div style={{ marginBottom: 16 }}>
        <Space split={<Divider type="vertical" />}>
          <Text>
            总金额: <Text strong>¥{stats.totalAmount.toLocaleString()}</Text>
          </Text>
          <Text>
            总手续费: <Text strong>¥{stats.totalFee.toLocaleString()}</Text>
          </Text>
          {Object.entries(stats.statusCounts).map(([status, count]) => (
            <Text key={status}>
              {status}: <Text strong>{count}</Text>
            </Text>
          ))}
        </Space>
      </div>

      {/* 批量操作按钮 */}
      <Space wrap>
        {/* 状态更新 */}
        <Button
          icon={<CheckCircleOutlined />}
          onClick={() => handleBatchUpdateStatus('EXECUTED')}
          loading={processing}
        >
          标记为已执行
        </Button>
        <Button
          icon={<CloseCircleOutlined />}
          onClick={() => handleBatchUpdateStatus('CANCELLED')}
          loading={processing}
        >
          标记为已取消
        </Button>
        
        {/* 字段更新 */}
        <Button
          icon={<EditOutlined />}
          onClick={() => setBatchUpdateVisible(true)}
        >
          批量编辑
        </Button>
        
        {/* 标签管理 */}
        <Button
          icon={<TagsOutlined />}
          onClick={() => setBatchTagVisible(true)}
        >
          批量标签
        </Button>
        
        {/* 导出 */}
        <Button
          icon={<ExportOutlined />}
          onClick={() => setExportVisible(true)}
        >
          批量导出
        </Button>
        
        {/* 删除 */}
        <Popconfirm
          title={`确定要删除这 ${selectedCount} 条交易记录吗？`}
          description="此操作不可撤销，请谨慎操作。"
          onConfirm={handleBatchDelete}
          okText="确定删除"
          cancelText="取消"
          icon={<WarningOutlined style={{ color: 'red' }} />}
        >
          <Button
            danger
            icon={<DeleteOutlined />}
            loading={processing}
          >
            批量删除
          </Button>
        </Popconfirm>
      </Space>

      {/* 进度条 */}
      {processing && (
        <div style={{ marginTop: 16 }}>
          <Progress percent={progress} status="active" />
        </div>
      )}

      {/* 操作结果 */}
      {operationResult && (
        <Alert
          style={{ marginTop: 16 }}
          message={`操作完成: 成功 ${operationResult.success} 条，失败 ${operationResult.failed} 条`}
          type={operationResult.failed > 0 ? 'warning' : 'success'}
          showIcon
          closable
          onClose={() => setOperationResult(null)}
          description={
            operationResult.errors.length > 0 && (
              <List
                size="small"
                dataSource={operationResult.errors}
                renderItem={(error) => (
                  <List.Item>
                    <Text type="danger">ID: {error.id} - {error.error}</Text>
                  </List.Item>
                )}
              />
            )
          }
        />
      )}

      {/* 批量编辑模态框 */}
      <Modal
        title="批量编辑交易记录"
        open={batchUpdateVisible}
        onCancel={() => setBatchUpdateVisible(false)}
        onOk={() => form.submit()}
        width={600}
        confirmLoading={processing}
      >
        <Alert
          message={`将对 ${selectedCount} 条交易记录进行批量更新`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleBatchUpdate}
        >
          <Form.Item
            name="transactionType"
            label="交易类型"
            help="留空表示不更新此字段"
          >
            <Select placeholder="选择交易类型" allowClear>
              <Option value="BUY">买入</Option>
              <Option value="SELL">卖出</Option>
              <Option value="DEPOSIT">存款</Option>
              <Option value="WITHDRAWAL">取款</Option>
              <Option value="DIVIDEND">分红</Option>
              <Option value="INTEREST">利息</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="side"
            label="交易方向"
            help="留空表示不更新此字段"
          >
            <Select placeholder="选择交易方向" allowClear>
              <Option value="LONG">多头</Option>
              <Option value="SHORT">空头</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="status"
            label="交易状态"
            help="留空表示不更新此字段"
          >
            <Select placeholder="选择交易状态" allowClear>
              <Option value="PENDING">待执行</Option>
              <Option value="EXECUTED">已执行</Option>
              <Option value="CANCELLED">已取消</Option>
              <Option value="FAILED">失败</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="备注"
            help="留空表示不更新此字段"
          >
            <TextArea
              placeholder="输入备注信息"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量标签模态框 */}
      <Modal
        title="批量管理标签"
        open={batchTagVisible}
        onCancel={() => setBatchTagVisible(false)}
        onOk={() => tagForm.submit()}
        width={500}
        confirmLoading={processing}
      >
        <Alert
          message={`将为 ${selectedCount} 条交易记录管理标签`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form
          form={tagForm}
          layout="vertical"
          onFinish={handleBatchAddTags}
        >
          <Form.Item
            name="tags"
            label="标签"
            rules={[{ required: true, message: '请选择或输入标签' }]}
          >
            <Select
              mode="tags"
              placeholder="选择或输入标签"
              style={{ width: '100%' }}
            >
              <Option value="科技股">科技股</Option>
              <Option value="长期持有">长期持有</Option>
              <Option value="短期交易">短期交易</Option>
              <Option value="定期投资">定期投资</Option>
              <Option value="获利了结">获利了结</Option>
              <Option value="止损">止损</Option>
              <Option value="分散投资">分散投资</Option>
              <Option value="价值投资">价值投资</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量导出模态框 */}
      <Modal
        title="批量导出交易记录"
        open={exportVisible}
        onCancel={() => setExportVisible(false)}
        footer={null}
        width={400}
      >
        <Alert
          message={`将导出 ${selectedCount} 条交易记录`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            block
            size="large"
            onClick={() => handleBatchExport('csv')}
            loading={processing}
          >
            导出为 CSV 文件
          </Button>
          <Button
            block
            size="large"
            onClick={() => handleBatchExport('excel')}
            loading={processing}
          >
            导出为 Excel 文件
          </Button>
          <Button
            block
            size="large"
            onClick={() => handleBatchExport('pdf')}
            loading={processing}
          >
            导出为 PDF 文件
          </Button>
        </Space>
      </Modal>
    </Card>
  );
};

export default TransactionBatchOperations;