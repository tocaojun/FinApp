import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Button,
  Space,
  Typography,
  Alert,
  Progress,
  Steps,
  Divider,
  Card,
  Row,
  Col,
  Tooltip,
  Tag,
  Badge,
  Spin,
  Result,
  Drawer,
  Affix
} from 'antd';
import {
  CloseOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  SaveOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  ExpandOutlined,
  CompressOutlined,
  HistoryOutlined,
  BookmarkOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Step } = Steps;

interface SmartModalProps {
  title?: React.ReactNode;
  open: boolean;
  onCancel: () => void;
  onOk?: () => void | Promise<void>;
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  centered?: boolean;
  closable?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  destroyOnClose?: boolean;
  loading?: boolean;
  confirmLoading?: boolean;
  okText?: string;
  cancelText?: string;
  okButtonProps?: any;
  cancelButtonProps?: any;
  type?: 'default' | 'info' | 'success' | 'warning' | 'error' | 'confirm';
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  resizable?: boolean;
  draggable?: boolean;
  maximizable?: boolean;
  minimizable?: boolean;
  showProgress?: boolean;
  progressPercent?: number;
  progressStatus?: 'normal' | 'active' | 'success' | 'exception';
  showSteps?: boolean;
  currentStep?: number;
  steps?: { title: string; description?: string; icon?: React.ReactNode }[];
  showFooter?: boolean;
  footerActions?: React.ReactNode;
  headerActions?: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarWidth?: number;
  autoSave?: boolean;
  autoSaveInterval?: number;
  showBookmark?: boolean;
  bookmarkable?: boolean;
  onBookmark?: () => void;
  className?: string;
  bodyStyle?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
  footerStyle?: React.CSSProperties;
  zIndex?: number;
  getContainer?: string | HTMLElement | (() => HTMLElement) | false;
}

interface ModalState {
  isMaximized: boolean;
  isMinimized: boolean;
  isFullscreen: boolean;
  isDragging: boolean;
  isResizing: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

const SmartModal: React.FC<SmartModalProps> = ({
  title,
  open,
  onCancel,
  onOk,
  children,
  width = 520,
  height,
  centered = true,
  closable = true,
  maskClosable = true,
  keyboard = true,
  destroyOnClose = false,
  loading = false,
  confirmLoading = false,
  okText = '确定',
  cancelText = '取消',
  okButtonProps,
  cancelButtonProps,
  type = 'default',
  size = 'medium',
  resizable = false,
  draggable = false,
  maximizable = false,
  minimizable = false,
  showProgress = false,
  progressPercent = 0,
  progressStatus = 'normal',
  showSteps = false,
  currentStep = 0,
  steps = [],
  showFooter = true,
  footerActions,
  headerActions,
  sidebar,
  sidebarWidth = 300,
  autoSave = false,
  autoSaveInterval = 30000,
  showBookmark = false,
  bookmarkable = false,
  onBookmark,
  className,
  bodyStyle,
  headerStyle,
  footerStyle,
  zIndex,
  getContainer
}) => {
  const [modalState, setModalState] = useState<ModalState>({
    isMaximized: false,
    isMinimized: false,
    isFullscreen: size === 'fullscreen',
    isDragging: false,
    isResizing: false,
    position: { x: 0, y: 0 },
    size: { 
      width: typeof width === 'number' ? width : 520, 
      height: typeof height === 'number' ? height : 400 
    },
    autoSaveStatus: 'idle'
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number }>({
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0
  });

  // 获取模态框尺寸
  const getModalSize = () => {
    if (modalState.isFullscreen || size === 'fullscreen') {
      return { width: '100vw', height: '100vh' };
    }
    
    if (modalState.isMaximized) {
      return { width: '90vw', height: '90vh' };
    }

    const sizeMap = {
      small: { width: 400, height: 300 },
      medium: { width: 600, height: 400 },
      large: { width: 800, height: 600 }
    };

    if (typeof size === 'string' && size in sizeMap) {
      return sizeMap[size as keyof typeof sizeMap];
    }

    return {
      width: modalState.size.width,
      height: height || modalState.size.height
    };
  };

  // 切换最大化
  const toggleMaximize = () => {
    setModalState(prev => ({
      ...prev,
      isMaximized: !prev.isMaximized,
      isFullscreen: false
    }));
  };

  // 切换全屏
  const toggleFullscreen = () => {
    setModalState(prev => ({
      ...prev,
      isFullscreen: !prev.isFullscreen,
      isMaximized: false
    }));
  };

  // 最小化
  const minimize = () => {
    setModalState(prev => ({
      ...prev,
      isMinimized: true
    }));
  };

  // 拖拽开始
  const handleDragStart = (e: React.MouseEvent) => {
    if (!draggable || modalState.isMaximized || modalState.isFullscreen) return;
    
    setModalState(prev => ({ ...prev, isDragging: true }));
    
    const rect = modalRef.current?.getBoundingClientRect();
    if (rect) {
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startLeft: rect.left,
        startTop: rect.top
      };
    }
  };

  // 拖拽移动
  const handleDragMove = (e: MouseEvent) => {
    if (!modalState.isDragging) return;
    
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    
    setModalState(prev => ({
      ...prev,
      position: {
        x: dragRef.current.startLeft + deltaX,
        y: dragRef.current.startTop + deltaY
      }
    }));
  };

  // 拖拽结束
  const handleDragEnd = () => {
    setModalState(prev => ({ ...prev, isDragging: false }));
  };

  // 自动保存
  useEffect(() => {
    if (!autoSave || !open) return;

    const interval = setInterval(() => {
      setModalState(prev => ({ ...prev, autoSaveStatus: 'saving' }));
      
      // 模拟自动保存
      setTimeout(() => {
        setModalState(prev => ({ ...prev, autoSaveStatus: 'saved' }));
        setTimeout(() => {
          setModalState(prev => ({ ...prev, autoSaveStatus: 'idle' }));
        }, 2000);
      }, 1000);
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [autoSave, autoSaveInterval, open]);

  // 监听拖拽事件
  useEffect(() => {
    if (modalState.isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [modalState.isDragging]);

  // 键盘快捷键
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && keyboard) {
        onCancel();
      } else if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        onOk?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, keyboard, onCancel, onOk]);

  // 渲染标题栏
  const renderTitle = () => {
    const typeIcons = {
      info: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      warning: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      error: <ExclamationCircleOutlined style={{ color: '#f5222d' }} />,
      confirm: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      default: null
    };

    return (
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: draggable ? 'move' : 'default',
          ...headerStyle
        }}
        onMouseDown={handleDragStart}
      >
        <Space>
          {typeIcons[type]}
          <span>{title}</span>
          {loading && <LoadingOutlined />}
          {autoSave && (
            <Tooltip title={
              modalState.autoSaveStatus === 'saving' ? '正在保存...' :
              modalState.autoSaveStatus === 'saved' ? '已保存' :
              modalState.autoSaveStatus === 'error' ? '保存失败' : '自动保存'
            }>
              <Badge 
                status={
                  modalState.autoSaveStatus === 'saving' ? 'processing' :
                  modalState.autoSaveStatus === 'saved' ? 'success' :
                  modalState.autoSaveStatus === 'error' ? 'error' : 'default'
                }
              />
            </Tooltip>
          )}
        </Space>
        
        <Space>
          {headerActions}
          {showBookmark && bookmarkable && (
            <Tooltip title="添加书签">
              <Button
                type="text"
                size="small"
                icon={<BookmarkOutlined />}
                onClick={onBookmark}
              />
            </Tooltip>
          )}
          {minimizable && (
            <Tooltip title="最小化">
              <Button
                type="text"
                size="small"
                icon={<CompressOutlined />}
                onClick={minimize}
              />
            </Tooltip>
          )}
          {maximizable && (
            <Tooltip title={modalState.isMaximized ? "还原" : "最大化"}>
              <Button
                type="text"
                size="small"
                icon={modalState.isMaximized ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={toggleMaximize}
              />
            </Tooltip>
          )}
          <Tooltip title={modalState.isFullscreen ? "退出全屏" : "全屏"}>
            <Button
              type="text"
              size="small"
              icon={modalState.isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
            />
          </Tooltip>
        </Space>
      </div>
    );
  };

  // 渲染内容
  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>加载中...</Text>
          </div>
        </div>
      );
    }

    return (
      <div style={{ height: '100%', overflow: 'auto' }}>
        {/* 进度条 */}
        {showProgress && (
          <div style={{ marginBottom: 16 }}>
            <Progress
              percent={progressPercent}
              status={progressStatus}
              showInfo={true}
            />
          </div>
        )}

        {/* 步骤条 */}
        {showSteps && steps.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Steps current={currentStep} size="small">
              {steps.map((step, index) => (
                <Step
                  key={index}
                  title={step.title}
                  description={step.description}
                  icon={step.icon}
                />
              ))}
            </Steps>
          </div>
        )}

        {/* 主要内容 */}
        <div style={{ display: 'flex', height: '100%' }}>
          {/* 侧边栏 */}
          {sidebar && (
            <>
              <div style={{ width: sidebarWidth, marginRight: 16 }}>
                {sidebar}
              </div>
              <Divider type="vertical" style={{ height: '100%' }} />
            </>
          )}
          
          {/* 主内容区 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {children}
          </div>
        </div>
      </div>
    );
  };

  // 渲染底部
  const renderFooter = () => {
    if (!showFooter) return null;

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...footerStyle }}>
        <div>
          {footerActions}
        </div>
        
        <Space>
          <Button onClick={onCancel} {...cancelButtonProps}>
            {cancelText}
          </Button>
          {onOk && (
            <Button
              type="primary"
              onClick={onOk}
              loading={confirmLoading}
              icon={<SaveOutlined />}
              {...okButtonProps}
            >
              {okText}
            </Button>
          )}
        </Space>
      </div>
    );
  };

  const modalSize = getModalSize();

  // 如果是最小化状态，显示为小窗口
  if (modalState.isMinimized) {
    return (
      <Affix offsetBottom={20} offsetLeft={20}>
        <Card
          size="small"
          title={title}
          extra={
            <Space>
              <Button
                type="text"
                size="small"
                onClick={() => setModalState(prev => ({ ...prev, isMinimized: false }))}
              >
                还原
              </Button>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={onCancel}
              />
            </Space>
          }
          style={{ width: 300, cursor: 'pointer' }}
          onClick={() => setModalState(prev => ({ ...prev, isMinimized: false }))}
        >
          <Text type="secondary">点击还原窗口</Text>
        </Card>
      </Affix>
    );
  }

  return (
    <Modal
      title={renderTitle()}
      open={open}
      onCancel={onCancel}
      footer={renderFooter()}
      width={modalSize.width}
      height={modalSize.height}
      centered={centered && !modalState.isFullscreen}
      closable={closable}
      maskClosable={maskClosable}
      keyboard={keyboard}
      destroyOnClose={destroyOnClose}
      className={className}
      bodyStyle={{
        height: height ? `calc(${modalSize.height}px - 110px)` : 'auto',
        padding: '16px',
        ...bodyStyle
      }}
      style={{
        top: modalState.isFullscreen ? 0 : undefined,
        left: modalState.position.x || undefined,
        transform: modalState.position.x ? 'none' : undefined,
        transition: modalState.isDragging ? 'none' : 'all 0.3s'
      }}
      zIndex={zIndex}
      getContainer={getContainer}
      wrapClassName={`smart-modal ${modalState.isFullscreen ? 'fullscreen' : ''} ${className || ''}`}
    >
      <div ref={modalRef}>
        {renderContent()}
      </div>
    </Modal>
  );
};

export default SmartModal;