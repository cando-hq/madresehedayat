/** دکمه‌های پایین هر قدم: در گوشی چسبیده به پایین صفحه، در دسکتاپ زیر محتوا */
import type { ReactNode } from 'react';

export function StepFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-auto flex items-center gap-3 border-t border-line bg-bg/95 px-4 pt-3 backdrop-blur sm:static sm:mx-0 sm:mt-8 sm:border-0 sm:bg-transparent sm:px-0 sm:pt-0" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
      {children}
    </div>
  );
}
