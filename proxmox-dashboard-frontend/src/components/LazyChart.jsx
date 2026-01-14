import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const LazyChart = ({ data, dataKey, stroke, strokeWidth = 2 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Une fois visible, on arrête d'observer
          observer.disconnect();
        }
      },
      {
        threshold: 0.1, // Le graphique doit être visible à 10% minimum
        rootMargin: '50px', // Commence à charger 50px avant d'être visible
      }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  return (
    <div ref={chartRef} className="w-full h-full">
      {isVisible ? (
        <ResponsiveContainer width="100%" height={20}>
          <LineChart data={data}>
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={stroke} 
              strokeWidth={strokeWidth} 
              dot={false}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        // Skeleton loader pendant le chargement
        <div className="w-full h-5 bg-slate-800/50 animate-pulse rounded" />
      )}
    </div>
  );
};

export default LazyChart;
