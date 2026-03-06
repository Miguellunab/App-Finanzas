import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';

interface StatKPIAnimProps {
  label: string;
  value: string;
  color: string;
  bg: string;
  delay?: number;
}

export default function StatKPIAnim({ label, value, color, bg, delay = 0 }: StatKPIAnimProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Extract rgb for glowing effects
  const hexToRGB = (hex: string) => {
    // Handling #RRGGBB and names loosely
    const r = parseInt(hex.slice(1, 3), 16) || 124;
    const g = parseInt(hex.slice(3, 5), 16) || 106;
    const b = parseInt(hex.slice(5, 7), 16) || 247;
    return `${r}, ${g}, ${b}`;
  };
  const colorRGB = hexToRGB(color);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 20 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      className="relative p-4 rounded-2xl overflow-hidden group"
      style={{ 
        background: bg, 
        border: `1px solid ${color}25`,
        boxShadow: isHovered ? `0 8px 24px -8px rgba(${colorRGB}, 0.5)` : 'none',
        transition: 'box-shadow 0.3s ease'
      }}
    >
      {/* Animated background glow on hover */}
      <motion.div
        className="absolute -inset-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, rgba(${colorRGB}, 0.15) 0%, transparent 60%)`,
        }}
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Decorative corner accent */}
      <div 
        className="absolute top-0 right-0 w-8 h-8 opacity-50"
        style={{
          background: `linear-gradient(135deg, transparent 50%, ${color} 100%)`,
          clipPath: 'polygon(100% 0, 0 0, 100% 100%)'
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-medium" style={{ color: '#9896b0' }}>{label}</p>
          {/* Pulse dot for active feel */}
          <motion.div 
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: color }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay }}
          />
        </div>
        <motion.p 
          className="text-lg sm:text-xl font-bold tracking-tight"
          style={{ color }}
          animate={{
            textShadow: isHovered ? `0 0 10px rgba(${colorRGB}, 0.6)` : '0 0 0px rgba(0,0,0,0)'
          }}
        >
          {value}
        </motion.p>
      </div>

      {/* Mini spark lines in background */}
      <svg className="absolute bottom-0 left-0 w-full h-8 opacity-20 pointer-events-none" preserveAspectRatio="none">
        <motion.path
          d="M 0,32 Q 20,10 40,25 T 80,15 T 120,20 T 160,5"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: delay + 0.2, ease: "easeOut" }}
        />
      </svg>
    </motion.div>
  );
}
