import { NumericKeypad } from '@/components/ui/numeric-keypad';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';

interface NumericInputModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  onConfirm: (value: string) => void;
  title?: string;
  label?: string;
  unit?: string;
  allowDecimal?: boolean;
  maxDecimals?: number;
  maxValue?: number;
  minValue?: number;
}

export function NumericInputModal({
  open,
  onOpenChange,
  value,
  onChange,
  onConfirm,
  title = 'Digite o valor',
  label,
  unit,
  allowDecimal = true,
  maxDecimals = 2,
  maxValue,
  minValue = 0,
}: NumericInputModalProps) {
  const isMobile = useIsMobile();

  const handleConfirm = () => {
    onConfirm(value);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const content = (
    <NumericKeypad
      value={value}
      onChange={onChange}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      allowDecimal={allowDecimal}
      maxDecimals={maxDecimals}
      maxValue={maxValue}
      minValue={minValue}
      label={label}
      unit={unit}
      className="p-2"
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-safe">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-center">{title}</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
