/**
 * 交易批量导入弹窗组件
 */

import React, { useState } from 'react';
import { Modal, Steps, Select, Upload, Button, Table, message, Alert, Space } from 'antd';
import { UploadOutlined, DownloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { TransactionImportService, ImportTransaction, ValidationError } from '../../services/transactionImportService';

interface Portfolio {
  id: string;
  name: string;
}

interface TradingAccount {
  id: string;
  name: string;
  portfolioId: string;
}

interface Asset {
  id: string;
  symbol: string;
  name: string;
}

interface TransactionImportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  portfolios: Portfolio[];
  tradingAccounts: TradingAccount[];
  assets: Asset[];
  onLoadAccounts: (portfolioId: string) => void;
  onSearchAssets: (keyword: string) => void;
}

export const TransactionImportModal: React.FC<TransactionImportModalProps> = ({
  visible,
  onClose,
  onSuccess,
  portfolios,
  tradingAccounts,
  assets,
  onLoadAccounts,
  onSearchAssets
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // 步骤1：选择上下文
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  
  // 步骤2：上传文件
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  
  // 步骤3：预览数据
  const [previewData, setPreviewData] = useState<ImportTransaction[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importing, setImporting] = useState(false);

  // 重置状态
  const resetState = () => {
    setCurrentStep(0);
    setSelectedPortfolio(null);
    setSelectedAccount(null);
    setSelectedAsset(null);
    setUploadedFile(null);
    setFileList([]);
    setPreviewData([]);
    setValidationErrors([]);
  };

  // 关闭弹窗
  const handleClose = () => {
    resetState();
    onClose();
  };

  // 投资组合变化
  const handlePortfolioChange = (portfolioId: string) => {
    setSelectedPortfolio(portfolioId);
    setSelectedAccount(null);
    onLoadAccounts(portfolioId);
  };

  // 下载模板
  const handleDownloadTemplate = async (format: 'excel' | 'json') => {
    try {
      if (format === 'excel') {
        await TransactionImportService.downloadExcelTemplate();
        message.success('Excel模板下载成功');
      } else {
        await TransactionImportService.downloadJsonTemplate();
        message.success('JSON模板下载成功');
      }
    } catch (error: any) {
      console.error('模板下载失败:', error);
      const errorMsg = error.response?.data?.error || error.message || '模板下载失败';
      message.error(`模板下载失败: ${errorMsg}`);
    }
  };

  // 文件上传前的处理
  const beforeUpload = (file: File) => {
    const isExcelOrJson = 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.type === 'application/json';
    
    if (!isExcelOrJson) {
      message.error('只支持Excel(.xlsx)或JSON(.json)文件');
      return false;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('文件大小不能超过10MB');
      return false;
    }

    setUploadedFile(file);
    setFileList([{
      uid: file.name,
      name: file.name,
      status: 'done',
      url: ''
    }]);

    // 自动预览
    handlePreview(file);

    return false; // 阻止自动上传
  };

  // 预览文件
  const handlePreview = async (file: File) => {
    if (!selectedPortfolio || !selectedAccount || !selectedAsset) {
      message.error('请先选择投资组合、交易账户和资产');
      return;
    }

    try {
      message.loading('正在解析文件...', 0);
      
      const result = await TransactionImportService.previewImport(
        file,
        selectedPortfolio,
        selectedAccount,
        selectedAsset
      );

      message.destroy();

      if (result.success && result.data) {
        setPreviewData(result.data);
        setValidationErrors([]);
        setCurrentStep(2);
        message.success(`成功解析${result.count}条记录`);
      } else if (result.errors) {
        setValidationErrors(result.errors);
        message.error(`发现${result.errors.length}个错误`);
      }
    } catch (error) {
      message.destroy();
      message.error('文件解析失败');
    }
  };

  // 确认导入
  const handleConfirmImport = async () => {
    if (!uploadedFile || !selectedPortfolio || !selectedAccount || !selectedAsset) {
      message.error('缺少必要参数');
      return;
    }

    setImporting(true);

    try {
      const result = await TransactionImportService.importTransactions(
        uploadedFile,
        selectedPortfolio,
        selectedAccount,
        selectedAsset
      );

      if (result.success) {
        message.success(result.summary || '导入成功');
        onSuccess();
        handleClose();
      } else {
        message.error(result.summary || '导入失败');
        if (result.errors) {
          setValidationErrors(result.errors);
          setCurrentStep(1); // 返回上传步骤
        }
      }
    } catch (error) {
      message.error('导入失败');
    } finally {
      setImporting(false);
    }
  };

  // 获取选中的投资组合、账户、资产信息
  const selectedPortfolioInfo = portfolios.find(p => p.id === selectedPortfolio);
  const selectedAccountInfo = tradingAccounts.find(a => a.id === selectedAccount);
  const selectedAssetInfo = assets.find(a => a.id === selectedAsset);

  // 是否可以进入下一步
  const canProceedToUpload = selectedPortfolio && selectedAccount && selectedAsset;

  return (
    <Modal
      title="批量导入交易"
      open={visible}
      onCancel={handleClose}
      width={900}
      footer={null}
      destroyOnClose
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Steps.Step title="选择上下文" />
        <Steps.Step title="上传文件" />
        <Steps.Step title="预览确认" />
      </Steps>

      {/* 步骤1：选择上下文 */}
      {currentStep === 0 && (
        <div>
          <Alert
            message="使用说明"
            description="请先选择投资组合、交易账户和资产，然后下载模板填写交易明细。批量文件中不需要包含投资组合、账户和资产信息。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>
                投资组合 <span style={{ color: 'red' }}>*</span>
              </label>
              <Select
                placeholder="选择投资组合"
                style={{ width: '100%' }}
                value={selectedPortfolio}
                onChange={handlePortfolioChange}
                options={portfolios.map(p => ({
                  label: p.name,
                  value: p.id
                }))}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>
                交易账户 <span style={{ color: 'red' }}>*</span>
              </label>
              <Select
                placeholder="选择交易账户"
                style={{ width: '100%' }}
                value={selectedAccount}
                onChange={setSelectedAccount}
                disabled={!selectedPortfolio}
                options={tradingAccounts
                  .filter(a => a.portfolioId === selectedPortfolio)
                  .map(a => ({
                    label: a.name,
                    value: a.id
                  }))}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>
                资产（产品） <span style={{ color: 'red' }}>*</span>
              </label>
              <Select
                showSearch
                placeholder="搜索资产（代码或名称）"
                style={{ width: '100%' }}
                value={selectedAsset}
                onChange={setSelectedAsset}
                onSearch={onSearchAssets}
                filterOption={false}
                disabled={!selectedAccount}
                options={assets.map(a => ({
                  label: `${a.symbol} - ${a.name}`,
                  value: a.id
                }))}
              />
            </div>

            {canProceedToUpload && (
              <Alert
                message="当前选择"
                description={
                  <div>
                    <p>投资组合：{selectedPortfolioInfo?.name}</p>
                    <p>交易账户：{selectedAccountInfo?.name}</p>
                    <p>资产：{selectedAssetInfo?.symbol} - {selectedAssetInfo?.name}</p>
                  </div>
                }
                type="success"
                showIcon
              />
            )}

            <div style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                onClick={() => setCurrentStep(1)}
                disabled={!canProceedToUpload}
              >
                下一步
              </Button>
            </div>
          </Space>
        </div>
      )}

      {/* 步骤2：上传文件 */}
      {currentStep === 1 && (
        <div>
          <Alert
            message="当前选择"
            description={
              <div>
                <p>投资组合：{selectedPortfolioInfo?.name}</p>
                <p>交易账户：{selectedAccountInfo?.name}</p>
                <p>资产：{selectedAssetInfo?.symbol} - {selectedAssetInfo?.name}</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleDownloadTemplate('excel')}
              >
                下载Excel模板
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleDownloadTemplate('json')}
              >
                下载JSON模板
              </Button>
            </Space>
          </div>

          <Upload
            accept=".xlsx,.xls,.json"
            beforeUpload={beforeUpload}
            fileList={fileList}
            onRemove={() => {
              setUploadedFile(null);
              setFileList([]);
              setValidationErrors([]);
            }}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>

          {validationErrors.length > 0 && (
            <Alert
              message={`发现${validationErrors.length}个错误`}
              description={
                <Table
                  dataSource={validationErrors}
                  columns={[
                    { title: '行号', dataIndex: 'row', key: 'row', width: 80 },
                    { title: '字段', dataIndex: 'field', key: 'field', width: 100 },
                    { title: '错误值', dataIndex: 'value', key: 'value', width: 120 },
                    { title: '错误信息', dataIndex: 'message', key: 'message' }
                  ]}
                  pagination={false}
                  size="small"
                  style={{ marginTop: 8 }}
                />
              }
              type="error"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCurrentStep(0)}>上一步</Button>
            </Space>
          </div>
        </div>
      )}

      {/* 步骤3：预览确认 */}
      {currentStep === 2 && (
        <div>
          <Alert
            message={`共${previewData.length}条记录`}
            description="请仔细核对数据，确认无误后点击【确认导入】按钮。"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Table
            dataSource={previewData}
            columns={[
              { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
              { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
              { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 100 },
              { title: '价格', dataIndex: 'price', key: 'price', width: 100 },
              { title: '币种', dataIndex: 'currency', key: 'currency', width: 80 },
              { title: '手续费', dataIndex: 'fee', key: 'fee', width: 100 },
              { title: '备注', dataIndex: 'notes', key: 'notes', ellipsis: true }
            ]}
            pagination={{ pageSize: 10 }}
            scroll={{ y: 400 }}
            size="small"
          />

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCurrentStep(1)}>上一步</Button>
              <Button 
                type="primary" 
                onClick={handleConfirmImport}
                loading={importing}
                icon={<CheckCircleOutlined />}
              >
                确认导入
              </Button>
            </Space>
          </div>
        </div>
      )}
    </Modal>
  );
};
