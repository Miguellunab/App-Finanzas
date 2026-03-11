import { motion } from 'framer-motion';
import useLiteMode from '../../hooks/useLiteMode';

export default function CyberBackground() {
  const liteMode = useLiteMode();

  if (liteMode) {
    return (
      <div
        className="fixed inset-0 pointer-events-none z-[-1]"
        style={{
          background: 'radial-gradient(circle at top, rgba(124,106,247,0.12), transparent 38%), radial-gradient(circle at bottom right, rgba(59,130,246,0.1), transparent 34%), #08080c',
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden" style={{ background: '#08080c' }}>
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="premium-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="40" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <pattern id="dot-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#5a5870" opacity="0.05" />
          </pattern>
        </defs>

        {/* Base Dot Pattern */}
        <rect width="100%" height="100%" fill="url(#dot-pattern)" />

        {/* Subtle Ambient Orbs - Slowed down and reduced opacity */}
        <motion.circle
          cx="20%"
          cy="10%"
          r="300"
          fill="#7c6af7"
          opacity="0.06"
          filter="url(#premium-glow)"
          animate={{
            cx: ["20%", "25%", "15%", "20%"],
            cy: ["10%", "15%", "5%", "10%"],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="90%"
          cy="50%"
          r="400"
          fill="#ec4899"
          opacity="0.04"
          filter="url(#premium-glow)"
          animate={{
            cx: ["90%", "85%", "95%", "90%"],
            cy: ["50%", "60%", "40%", "50%"],
            scale: [0.9, 1.05, 0.95, 0.9],
          }}
          transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="40%"
          cy="90%"
          r="350"
          fill="#3b82f6"
          opacity="0.05"
          filter="url(#premium-glow)"
          animate={{
            cx: ["40%", "50%", "30%", "40%"],
            cy: ["90%", "80%", "100%", "90%"],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}
