import React, { useEffect, useRef, useState } from 'react';

interface TimerBarProps {
  duration: number; // in seconds
  onExpire?: () => void;
}

const TimerBar: React.FC<TimerBarProps> = ({ duration, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [progress, setProgress] = useState(100);
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    startTimeRef.current = performance.now();
    let isExpired = false;
    
    const animate = (time: number) => {
      const elapsed = (time - startTimeRef.current!) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      const newProgress = (remaining / duration) * 100;

      setTimeLeft(remaining);
      setProgress(newProgress);

      if (remaining > 0) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        if (!isExpired) {
          isExpired = true;
          if (onExpireRef.current) onExpireRef.current();
        }
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [duration]);

  const getColorClass = () => {
    if (progress > 50) return 'text-primary bg-primary';
    if (progress > 25) return 'text-warning bg-warning';
    return 'text-wrong bg-wrong';
  };

  const colorClass = getColorClass();
  const [textClass, bgClass] = colorClass.split(' ');

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex justify-between items-end">
        <span className={`font-mono text-2xl font-bold tabular-nums ${textClass}`}>
          {Math.ceil(timeLeft)}s
        </span>
      </div>
      <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-colors duration-300 ${bgClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default TimerBar;
