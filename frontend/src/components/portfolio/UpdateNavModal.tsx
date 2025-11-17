import React, { useState } from 'react';
import {
  Modal,
  Button,
  InputNumber,
  Typography,
  Alert,
  Space,
  Divider
} from 'antd';

const { Text } = Typography;

interface UpdateNavModalProps {
  open: boolean;
  onClose: () => void;
  holding: {
    id: string;
    assetName: string;
    currentNav: number;
    currentBalance: number;
    quantity: number;
    productMode: string;
  } | null;
  onUpdate: (holdingId: string, newValue: number) => Promise<void>;
}

export const UpdateNavModal: React.FC<UpdateNavModalProps> = ({
  open,
  onClose,
  holding,
  onUpdate
}) => {
  const [newValue, setNewValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const isBalanceMode = holding?.productMode === 'BALANCE';
  const currentValue = isBalanceMode ? holding?.currentBalance : holding?.currentNav;

  const handleSubmit = async () => {
    if (!holding || !newValue) return;

    setLoading(true);
    setError('');

    try {
      await onUpdate(holding.id, newValue);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewValue(null);
    setError('');
    onClose();
  };

  if (!holding) return null;

  return (
    <Modal
      title={isBalanceMode ? "更新余额" : "更新净值"}
      open={open}
      onCancel={handleClose}
      width={500}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={loading}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          disabled={!newValue || newValue === currentValue}
          onClick={handleSubmit}
        >
          确认更新
        </Button>
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>产品名称：</Text>
          <Text>{holding.assetName}</Text>
        </div>

        <Divider />

        <div>
          <Text strong>当前{isBalanceMode ? '余额' : '净值'}：</Text>
          <Text>{currentValue?.toFixed(isBalanceMode ? 2 : 4)}</Text>
          {!isBalanceMode && <Text type="secondary"> 元</Text>}
          {isBalanceMode && <Text type="secondary"> 元</Text>}
        </div>

        {!isBalanceMode && (
          <div>
            <Text strong>持有份额：</Text>
            <Text>{holding.quantity?.toFixed(2)}</Text>
            <Text type="secondary"> 份</Text>
          </div>
        )}

        <div>
          <Text strong>新{isBalanceMode ? '余额' : '净值'}：</Text>
          <InputNumber
            style={{ width: '100%', marginTop: 8 }}
            placeholder={`请输入新的${isBalanceMode ? '余额' : '净值'}`}
            value={newValue}
            onChange={setNewValue}
            precision={isBalanceMode ? 2 : 4}
            min={0}
            disabled={loading}
          />
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Space>
    </Modal>
  );
};