import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Select,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  InputNumber,
  Checkbox,
  Tag,
  Alert,
  Progress,
  Divider,
  Row,
  Col,
  Statistic,
  message,
  Popconfirm,
  Upload,
  Steps
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ImportOutlined,
  TagOutlined,
  StarOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DownloadOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd';

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Step } = Steps;

interface Asset {
  id: string;
  symbol: string;
  name: string;
  assetTypeName: string;
  marketName: string;
  currency: string;
  riskLevel: string;
  liquidityTag: string;
  sector?: string;
  industry?: string;
  currentPrice?: number;
  marketCap?: number;
  volume?: number;
  peRatio?: number;
  dividendYield?: number;
  beta?: number;
  volatility?: number;
  rating?: number;
  tags?: string[];
  isActive: boolean;
  isFavorite?: boolean;
  isWatched?: boolean;
}

interface BatchOperation {
  type: 'update' | 'delete' | 'tag' | 'favorite' | 'watch' | 'activate' | 'deactivate';
  label: string;
  icon: React.ReactNode;
  color?: string;
  dangerous?: boolean;
}

interface AssetBatchOperationsProps {
  assets: Asset[];
  selectedRowKeys: string[];
  onSelectionChange: (keys: string[]) => void;
  onAssetsUpdate: (assets: Asset[]) => void;
  loading?: boolean;
}

interface BatchUpdateForm {
  riskLevel?: string;
  liquidityTag?: string;
  sector?: string;
  industry?: string;
  tags?: string[];
  rating?: number;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const AssetBatchOperations: React.FC<AssetBatchOperationsProps> = ({
  assets,
  selectedRowKeys,
  onSelectionChange,
  onAssetsUpdate,
  loading = false
}) => {
  const [batchUpdateVisible, setBatchUpdateVisible] = useState(false);
  const [batchTagVisible, setBatchTagVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [importStep, setImportStep] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [form] = Form.useForm();
  const [tagForm] = Form.useForm();

  // 批量操作定义
  const batchOperations: BatchOperation[] = [
    {
      type: 'update',
      label: '批量编辑',
      icon: <EditOutlined />,
      color: '#1890ff'
    },
    {
      type: 'tag',
      label: '批量标签',
      icon: <TagOutlined />,
      color: '#52c41a'
    },
    {
      type: 'favorite',
      label: '添加收藏',
      icon: <StarOutlined />,
      color: '#faad14'
    },
    {
      type: 'watch',
      label: '添加关注',
      icon: <EyeOutlined />,
      color: '#722ed1'
    },
    {
      type: 'activate',
      label: '批量激活',
      icon: <CheckCircleOutlined />,
      color: '#52c41a'
    },
    {
      type: 'deactivate',
      label: '批量停用',
      icon: <ExclamationCircleOutlined />,
      color: '#fa8c16'
    },
    {
      type: 'delete',
      label: '批量删除',
      icon: <DeleteOutlined />,
      color: '#ff4d4f',
      dangerous: true
    }
  ];

  const selectedAssets = assets.filter(asset => selectedRowKeys.includes(asset.id));

  // 执行批量操作
  const handleBatchOperation = async (operation: BatchOperation) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的资产');
      return;
    }

    switch (operation.type) {
      case 'update':
        setBatchUpdateVisible(true);
        break;
      case 'tag':
        setBatchTagVisible(true);
        break;
      case 'favorite':
        await handleBatchFavorite();
        break;
      case 'watch':
        await handleBatchWatch();
        break;
      case 'activate':
        await handleBatchActivate(true);
        break;
      case 'deactivate':
        await handleBatchActivate(false);
        break;
      case 'delete':
        // 删除操作通过 Popconfirm 处理
        break;
    }
  };

  // 批量收藏
  const handleBatchFavorite = async () => {
    setOperationLoading(true);
    try {
      const updatedAssets = assets.map(asset => 
        selectedRowKeys.includes(asset.id) 
          ? { ...asset, isFavorite: true }
          : asset
      );
      onAssetsUpdate(updatedAssets);
      message.success(`已将 ${selectedRowKeys.length} 个资产添加到收藏`);
      onSelectionChange([]);
    } catch (error) {
      message.error('批量收藏失败');
    } finally {
      setOperationLoading(false);
    }
  };

  // 批量关注
  const handleBatchWatch = async () => {
    setOperationLoading(true);
    try {
      const updatedAssets = assets.map(asset => 
        selectedRowKeys.includes(asset.id) 
          ? { ...asset, isWatched: true }
          : asset
      );
      onAssetsUpdate(updatedAssets);
      message.success(`已将 ${selectedRowKeys.length} 个资产添加到关注列表`);
      onSelectionChange([]);
    } catch (error) {
      message.error('批量关注失败');
    } finally {
      setOperationLoading(false);
    }
  };

  // 批量激活/停用
  const handleBatchActivate = async (isActive: boolean) => {
    setOperationLoading(true);
    try {
      const updatedAssets = assets.map(asset => 
        selectedRowKeys.includes(asset.id) 
          ? { ...asset, isActive }
          : asset
      );
      onAssetsUpdate(updatedAssets);
      message.success(`已${isActive ? '激活' : '停用'} ${selectedRowKeys.length} 个资产`);
      onSelectionChange([]);
    } catch (error) {
      message.error(`批量${isActive ? '激活' : '停用'}失败`);
    } finally {
      setOperationLoading(false);
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    setOperationLoading(true);
    try {
      const updatedAssets = assets.filter(asset => !selectedRowKeys.includes(asset.id));
      onAssetsUpdate(updatedAssets);
      message.success(`已删除 ${selectedRowKeys.length} 个资产`);
      onSelectionChange([]);
    } catch (error) {
      message.error('批量删除失败');
    } finally {
      setOperationLoading(false);
    }
  };

  // 批量更新
  const handleBatchUpdate = async (values: BatchUpdateForm) => {
    setOperationLoading(true);
    try {
      const updatedAssets = assets.map(asset => {
        if (selectedRowKeys.includes(asset.id)) {
          const updates: Partial<Asset> = {};
          if (values.riskLevel) updates.riskLevel = values.riskLevel;
          if (values.liquidityTag) updates.liquidityTag = values.liquidityTag;
          if (values.sector) updates.sector = values.sector;
          if (values.industry) updates.industry = values.industry;
          if (values.rating !== undefined) updates.rating = values.rating;
          if (values.tags) {
            updates.tags = [...(asset.tags || []), ...values.tags];
          }
          return { ...asset, ...updates };
        }
        return asset;
      });
      
      onAssetsUpdate(updatedAssets);
      message.success(`已更新 ${selectedRowKeys.length} 个资产`);
      setBatchUpdateVisible(false);
      onSelectionChange([]);
      form.resetFields();
    } catch (error) {
      message.error('批量更新失败');
    } finally {
      setOperationLoading(false);
    }
  };

  // 批量标签
  const handleBatchTag = async (values: { tags: string[]; action: 'add' | 'remove' | 'replace' }) => {
    setOperationLoading(true);
    try {
      const updatedAssets = assets.map(asset => {
        if (selectedRowKeys.includes(asset.id)) {
          let newTags = asset.tags || [];
          
          switch (values.action) {
            case 'add':
              newTags = [...new Set([...newTags, ...values.tags])];
              break;
            case 'remove':
              newTags = newTags.filter(tag => !values.tags.includes(tag));
              break;
            case 'replace':
              newTags = values.tags;
              break;
          }
          
          return { ...asset, tags: newTags };
        }
        return asset;
      });
      
      onAssetsUpdate(updatedAssets);
      message.success(`已为 ${selectedRowKeys.length} 个资产${values.action === 'add' ? '添加' : values.action === 'remove' ? '移除' : '替换'}标签`);
      setBatchTagVisible(false);
      onSelectionChange([]);
      tagForm.resetFields();
    } catch (error) {
      message.error('批量标签操作失败');
    } finally {
      setOperationLoading(false);
    }
  };

  // 导出资产
  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    const exportData = selectedRowKeys.length > 0 ? selectedAssets : assets;
    
    // 模拟导出功能
    const dataStr = format === 'json' 
      ? JSON.stringify(exportData, null, 2)
      : exportData.map(asset => Object.values(asset)).join('\n');
    
    const blob = new Blob([dataStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assets_export.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    
    message.success(`已导出 ${exportData.length} 个资产`);
    setExportVisible(false);
  };

  // 导入配置
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.csv,.xlsx,.json',
    beforeUpload: (file) => {
      // 模拟文件解析
      setImportStep(1);
      setTimeout(() => {
        setImportStep(2);
        setImportResult({
          success: 85,
          failed: 5,
          errors: ['第3行：缺少必填字段 symbol', '第7行：无效的风险等级', '第12行：重复的资产代码']
        });
      }, 2000);
      return false; // 阻止自动上传
    }
  };

  // 表格列配置
  const columns: ColumnsType<Asset> = [
    {
      title: '资产代码',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 100,
      render: (text: string, record: Asset) => (
        <Space>
          <Text strong>{text}</Text>
          {record.isFavorite && <StarOutlined style={{ color: '#faad14' }} />}
          {record.isWatched && <EyeOutlined style={{ color: '#722ed1' }} />}
        </Space>
      )
    },
    {
      title: '资产名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'assetTypeName',
      key: 'assetTypeName',
      width: 100,
      render: (text: string) => <Tag>{text}</Tag>
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level: string) => (
        <Tag color={level === 'LOW' ? 'green' : level === 'HIGH' ? 'red' : 'orange'}>
          {level === 'LOW' ? '低风险' : level === 'HIGH' ? '高风险' : '中风险'}
        </Tag>
      )
    },
    {
      title: '当前价格',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 120,
      render: (price: number) => price ? `$${price.toFixed(2)}` : '-'
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <Space wrap>
          {tags?.slice(0, 3).map(tag => (
            <Tag key={tag} size="small">{tag}</Tag>
          ))}
          {tags && tags.length > 3 && <Tag size="small">+{tags.length - 3}</Tag>}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '激活' : '停用'}
        </Tag>
      )
    }
  ];

  return (
    <div>
      {/* 批量操作工具栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space wrap>
              <Text>已选择 {selectedRowKeys.length} 个资产</Text>
              {selectedRowKeys.length > 0 && (
                <>
                  <Divider type="vertical" />
                  {batchOperations.map(operation => (
                    operation.dangerous ? (
                      <Popconfirm
                        key={operation.type}
                        title={`确定要${operation.label}选中的 ${selectedRowKeys.length} 个资产吗？`}
                        onConfirm={() => handleBatchDelete()}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          danger
                          icon={operation.icon}
                          loading={operationLoading}
                        >
                          {operation.label}
                        </Button>
                      </Popconfirm>
                    ) : (
                      <Button
                        key={operation.type}
                        type="text"
                        icon={operation.icon}
                        onClick={() => handleBatchOperation(operation)}
                        loading={operationLoading}
                        style={{ color: operation.color }}
                      >
                        {operation.label}
                      </Button>
                    )
                  ))}
                </>
              )}
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ImportOutlined />}
                onClick={() => setImportVisible(true)}
              >
                导入
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={() => setExportVisible(true)}
              >
                导出
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 资产列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={assets}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: onSelectionChange,
            selections: [
              Table.SELECTION_ALL,
              Table.SELECTION_INVERT,
              Table.SELECTION_NONE,
              {
                key: 'active',
                text: '选择激活的',
                onSelect: (changeableRowKeys) => {
                  const activeKeys = assets
                    .filter(asset => asset.isActive)
                    .map(asset => asset.id);
                  onSelectionChange(activeKeys);
                }
              },
              {
                key: 'favorites',
                text: '选择收藏的',
                onSelect: (changeableRowKeys) => {
                  const favoriteKeys = assets
                    .filter(asset => asset.isFavorite)
                    .map(asset => asset.id);
                  onSelectionChange(favoriteKeys);
                }
              }
            ]
          }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </Card>

      {/* 批量更新模态框 */}
      <Modal
        title="批量更新资产"
        open={batchUpdateVisible}
        onCancel={() => setBatchUpdateVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={operationLoading}
        width={600}
      >
        <Alert
          message={`将更新 ${selectedRowKeys.length} 个选中的资产`}
          type="info"
          style={{ marginBottom: 16 }}
        />
        <Form
          form={form}
          layout="vertical"
          onFinish={handleBatchUpdate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="riskLevel" label="风险等级">
                <Select placeholder="选择风险等级" allowClear>
                  <Option value="LOW">低风险</Option>
                  <Option value="MEDIUM">中风险</Option>
                  <Option value="HIGH">高风险</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="liquidityTag" label="流动性标签">
                <Select placeholder="选择流动性" allowClear>
                  <Option value="HIGH">高流动性</Option>
                  <Option value="MEDIUM">中流动性</Option>
                  <Option value="LOW">低流动性</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="sector" label="行业">
                <Input placeholder="输入行业" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="industry" label="子行业">
                <Input placeholder="输入子行业" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="rating" label="评级">
            <InputNumber min={1} max={5} placeholder="1-5星评级" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="tags" label="添加标签">
            <Select mode="tags" placeholder="输入标签，按回车添加" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量标签模态框 */}
      <Modal
        title="批量标签操作"
        open={batchTagVisible}
        onCancel={() => setBatchTagVisible(false)}
        onOk={() => tagForm.submit()}
        confirmLoading={operationLoading}
      >
        <Alert
          message={`将为 ${selectedRowKeys.length} 个选中的资产操作标签`}
          type="info"
          style={{ marginBottom: 16 }}
        />
        <Form
          form={tagForm}
          layout="vertical"
          onFinish={handleBatchTag}
        >
          <Form.Item name="action" label="操作类型" initialValue="add">
            <Select>
              <Option value="add">添加标签</Option>
              <Option value="remove">移除标签</Option>
              <Option value="replace">替换标签</Option>
            </Select>
          </Form.Item>
          <Form.Item name="tags" label="标签" rules={[{ required: true, message: '请输入标签' }]}>
            <Select mode="tags" placeholder="输入标签，按回车添加" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 导入模态框 */}
      <Modal
        title="导入资产"
        open={importVisible}
        onCancel={() => {
          setImportVisible(false);
          setImportStep(0);
          setImportResult(null);
        }}
        footer={null}
        width={600}
      >
        <Steps current={importStep} style={{ marginBottom: 24 }}>
          <Step title="选择文件" />
          <Step title="解析数据" />
          <Step title="导入结果" />
        </Steps>

        {importStep === 0 && (
          <div>
            <Alert
              message="支持的文件格式"
              description="CSV、Excel (.xlsx) 或 JSON 格式的文件"
              type="info"
              style={{ marginBottom: 16 }}
            />
            <Upload.Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持单个文件上传，文件大小不超过 10MB
              </p>
            </Upload.Dragger>
          </div>
        )}

        {importStep === 1 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Title level={4} style={{ marginTop: 16 }}>正在解析文件...</Title>
            <Text type="secondary">请稍候，正在验证数据格式和内容</Text>
          </div>
        )}

        {importStep === 2 && importResult && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Statistic
                  title="成功导入"
                  value={importResult.success}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="导入失败"
                  value={importResult.failed}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Col>
            </Row>

            {importResult.errors.length > 0 && (
              <div>
                <Title level={5}>错误详情：</Title>
                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                  {importResult.errors.map((error, index) => (
                    <Alert
                      key={index}
                      message={error}
                      type="error"
                      size="small"
                      style={{ marginBottom: 8 }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Space>
                <Button onClick={() => {
                  setImportVisible(false);
                  setImportStep(0);
                  setImportResult(null);
                }}>
                  关闭
                </Button>
                <Button type="primary" onClick={() => {
                  message.success('导入完成');
                  setImportVisible(false);
                  setImportStep(0);
                  setImportResult(null);
                }}>
                  确认导入
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>

      {/* 导出模态框 */}
      <Modal
        title="导出资产"
        open={exportVisible}
        onCancel={() => setExportVisible(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center' }}>
          <Title level={4}>选择导出格式</Title>
          <Text type="secondary">
            {selectedRowKeys.length > 0 
              ? `将导出 ${selectedRowKeys.length} 个选中的资产`
              : `将导出全部 ${assets.length} 个资产`
            }
          </Text>
          
          <div style={{ marginTop: 24 }}>
            <Space direction="vertical" size="large">
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                size="large"
                onClick={() => handleExport('csv')}
                block
              >
                导出为 CSV 格式
              </Button>
              <Button
                icon={<DownloadOutlined />}
                size="large"
                onClick={() => handleExport('excel')}
                block
              >
                导出为 Excel 格式
              </Button>
              <Button
                icon={<DownloadOutlined />}
                size="large"
                onClick={() => handleExport('json')}
                block
              >
                导出为 JSON 格式
              </Button>
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssetBatchOperations;