import React from 'react';
import { motion } from 'framer-motion';

export default function AILoadingAnim() {
  return (
    <div className="flex flex-col items-center justify-center py-10 w-full">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Core glowing orb */}
        <motion.div
          className="absolute w-12 h-12 rounded-full blur-xl"
          style={{ background: 'linear-gradient(135deg, #7c6af7, #ec4899)' }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* SVG Scanner Rings */}
        <motion.svg
          width="120" height="120" viewBox="0 0 120 120"
          className="absolute"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(124,106,247,0.2)" strokeWidth="1" strokeDasharray="4 4" />
          <motion.circle
            cx="60" cy="60" r="50" fill="none" stroke="#7c6af7" strokeWidth="2" strokeDasharray="100 200"
            animate={{ strokeDashoffset: [300, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.svg>

        <motion.svg
          width="100" height="100" viewBox="0 0 100 100"
          className="absolute"
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(236,72,153,0.2)" strokeWidth="2" />
          <motion.circle
            cx="50" cy="50" r="40" fill="none" stroke="#ec4899" strokeWidth="2" strokeDasharray="60 200"
            animate={{ strokeDashoffset: [0, 260] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.svg>

        {/* Data processing paths */}
        <svg width="120" height="120" viewBox="0 0 120 120" className="absolute z-10">
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <motion.path
              key={i}
              d={`M 60,60 L ${60 + 45 * Math.cos(angle * Math.PI / 180)},${60 + 45 * Math.sin(angle * Math.PI / 180)}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </svg>

        {/* Center robot icon */}
        <motion.div 
          className="relative z-20 text-2xl bg-[#111118] w-12 h-12 rounded-full flex items-center justify-center border border-[#7c6af7]/30"
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          🤖
        </motion.div>
      </div>

      <motion.div 
        className="mt-6 flex flex-col items-center"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <p className="text-sm font-semibold text-[#f1f0ff] mb-1">Conectando con Llama 3.3 70B</p>
        <p className="text-xs text-[#7c6af7]">Analizando patrones de gasto...</p>
      </motion.div>
    </div>
  );
}
