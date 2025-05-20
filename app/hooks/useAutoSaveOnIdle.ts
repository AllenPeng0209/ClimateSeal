import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOnIdleOptions {
  onIdle: () => void; // 當用戶閒置時要調用的函數
  idleTimeout?: number; // 閒置超時時間（毫秒）
}

// 默認閒置超時時間（例如：5分鐘）
const DEFAULT_IDLE_TIMEOUT = 5 * 60 * 1000;

export function useAutoSaveOnIdle({
  onIdle,
  idleTimeout = DEFAULT_IDLE_TIMEOUT,
}: UseAutoSaveOnIdleOptions): void {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 使用 useCallback 包裹 onIdle，以確保其引用穩定性，除非父組件傳遞了新的函數實例
  const stableOnIdle = useCallback(onIdle, [onIdle]);

  // 重置或啟動計時器的函數
  const resetTimerOrStart = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      stableOnIdle(); // 調用穩定版的 onIdle 回調
    }, idleTimeout);
  }, [stableOnIdle, idleTimeout]);

  useEffect(() => {
    // 需要監聽的用戶活動事件列表
    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove', 'mousedown', 'keydown',
      'touchstart', 'scroll', 'keypress', 'wheel'
    ];

    const handleUserActivity = () => {
      resetTimerOrStart();
    };

    // Hook 掛載時或依賴項變更時，初始化（或重置）計時器
    resetTimerOrStart();

    // 為每個活動事件添加監聽器
    // 使用 capture: true 以便在事件到達目標元素之前捕獲它
    // 使用 passive: true 提示瀏覽器該監聽器不會調用 preventDefault()，有助於滾動等性能
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity, { capture: true, passive: true });
    });

    // 清理函數：當 Hook 卸載或依賴項變更導致 effect 重新運行前執行
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current); // 清除計時器
      }
      // 移除所有事件監聽器
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity, { capture: true });
      });
    };
  }, [resetTimerOrStart]); // effect 的依賴項，當 resetTimerOrStart 變化時會重新運行 effect
}
