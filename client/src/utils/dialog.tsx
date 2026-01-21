import * as React from 'react';
import { createRoot } from 'react-dom/client';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import { type PaperProps } from '@mui/material/Paper';
import Draggable from 'react-draggable';

function PaperComponent(props: PaperProps) {
  const nodeRef = React.useRef<HTMLDivElement>(null);
  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLDivElement>}
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} ref={nodeRef} />
    </Draggable>
  );
}

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  confirmColor = 'error',
  onConfirm,
  onCancel,
}) => {
  const [open, setOpen] = React.useState(true);

  const handleConfirm = () => {
    setOpen(false);
    onConfirm();
  };

  const handleCancel = () => {
    setOpen(false);
    onCancel();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
    >
      <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="inherit">
          {cancelText}
        </Button>
        <Button onClick={handleConfirm} color={confirmColor} variant="contained" autoFocus>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

export const showDialog = {
  confirm: (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);

      const cleanup = () => {
        root.unmount();
        document.body.removeChild(container);
      };

      const handleConfirm = () => {
        cleanup();
        resolve(true);
      };

      const handleCancel = () => {
        cleanup();
        resolve(false);
      };

      root.render(
        <ConfirmDialog
          title={options.title || 'Xác nhận'}
          message={options.message}
          confirmText={options.confirmText}
          cancelText={options.cancelText}
          confirmColor={options.confirmColor}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      );
    });
  },

  // Shorthand for delete confirmation
  confirmDelete: (itemName?: string): Promise<boolean> => {
    return showDialog.confirm({
      title: 'Xác nhận xóa',
      message: itemName 
        ? `Bạn có chắc chắn muốn xóa ${itemName} không?` 
        : 'Bạn có chắc chắn muốn xóa không?',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      confirmColor: 'error',
    });
  },

  // Shorthand for withdraw confirmation (rút bài)
  confirmWithdraw: (itemName?: string): Promise<boolean> => {
    return showDialog.confirm({
      title: 'Xác nhận rút bài',
      message: itemName 
        ? `Bạn có chắc chắn muốn rút ${itemName} không?` 
        : 'Bạn có chắc chắn muốn rút bài không?',
      confirmText: 'Rút bài',
      cancelText: 'Hủy',
      confirmColor: 'warning',
    });
  },
};

export default showDialog;
