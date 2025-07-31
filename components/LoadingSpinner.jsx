'use client';

import { motion } from 'framer-motion';
import { Loader2, BarChart3, TrendingUp } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'default',
  text = 'Loading...',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const variants = {
    default: (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizeClasses[size]} text-blue-500`}
      >
        <Loader2 className="w-full h-full" />
      </motion.div>
    ),
    trading: (
      <div className="flex items-center space-x-2">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-3 h-3 bg-green-500 rounded-full"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2
          }}
          className="w-3 h-3 bg-blue-500 rounded-full"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.4
          }}
          className="w-3 h-3 bg-purple-500 rounded-full"
        />
      </div>
    ),
    chart: (
      <div className="flex items-center space-x-1">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ 
            duration: 0.6, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-1 h-8 bg-blue-500 rounded"
        />
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ 
            duration: 0.6, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.1
          }}
          className="w-1 h-12 bg-green-500 rounded"
        />
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ 
            duration: 0.6, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2
          }}
          className="w-1 h-6 bg-purple-500 rounded"
        />
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ 
            duration: 0.6, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3
          }}
          className="w-1 h-10 bg-orange-500 rounded"
        />
      </div>
    ),
    pulse: (
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`${sizeClasses[size]} text-blue-500`}
      >
        <BarChart3 className="w-full h-full" />
      </motion.div>
    )
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {variants[variant]}
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-400 font-medium"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

// Full screen loading component
export const FullScreenLoader = ({ text = 'Loading Trading Platform...' }) => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
          <TrendingUp className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">ForexBot Pro</h1>
        <p className="text-gray-400">Professional Trading Platform</p>
      </motion.div>
      
      <LoadingSpinner 
        variant="trading" 
        size="lg" 
        text={text}
        className="mt-8"
      />
    </div>
  </div>
);

// Skeleton loading component
export const SkeletonLoader = ({ className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-slate-700 rounded h-4 mb-2"></div>
    <div className="bg-slate-700 rounded h-4 mb-2 w-3/4"></div>
    <div className="bg-slate-700 rounded h-4 w-1/2"></div>
  </div>
);

export default LoadingSpinner;