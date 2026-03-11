import { motion } from 'framer-motion';
import useLiteMode from '../../hooks/useLiteMode';

export default function CashFlow() {
  const liteMode = useLiteMode();
  const nodes = [
    { x: 50, y: 150, color: '#ec4899', label: 'Gastos' },
    { x: 200, y: 50, color: '#3b82f6', label: 'Bancos' },
    { x: 350, y: 150, color: '#22c55e', label: 'Ingresos' },
  ];

  return (
    <div className="w-full flex justify-center items-center py-4 relative" style={{ height: '220px' }}>
      <svg
        viewBox="0 0 400 220"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <linearGradient id="flow-right" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="flow-left" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Connections */}
        <path d="M 200 50 Q 275 100 350 150" fill="none" stroke="url(#flow-right)" strokeWidth="3" opacity="0.4" />
        <path d="M 200 50 Q 125 100 50 150" fill="none" stroke="url(#flow-left)" strokeWidth="3" opacity="0.4" />

        {!liteMode && [0, 1, 2].map((i) => (
          <circle key={`inc-particle-${i}`} r="4" fill="#22c55e" filter="url(#neon-glow)">
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              path="M 350 150 Q 275 100 200 50"
              begin={`${i * 1}s`}
            />
            <animate
              attributeName="opacity"
              values="0; 1; 0"
              dur="3s"
              repeatCount="indefinite"
              begin={`${i * 1}s`}
            />
          </circle>
        ))}

        {!liteMode && [0, 1, 2].map((i) => (
          <circle key={`exp-particle-${i}`} r="4" fill="#ec4899" filter="url(#neon-glow)">
            <animateMotion
              dur="2.5s"
              repeatCount="indefinite"
              path="M 200 50 Q 125 100 50 150"
              begin={`${i * 0.8}s`}
            />
            <animate
              attributeName="opacity"
              values="0; 1; 0"
              dur="2.5s"
              repeatCount="indefinite"
              begin={`${i * 0.8}s`}
            />
          </circle>
        ))}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <g key={`node-${i}`}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="20"
              fill="#18181f"
              stroke={node.color}
              strokeWidth="2"
              filter="url(#neon-glow)"
              animate={liteMode ? undefined : { scale: [1, 1.05, 1] }}
              transition={liteMode ? undefined : { duration: 2, repeat: Infinity, delay: i * 0.5 }}
            />
            {/* Pulse ring */}
            {!liteMode && (
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="20"
                fill="none"
                stroke={node.color}
                strokeWidth="1"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              />
            )}
            
            <text
              x={node.x}
              y={node.y + 40}
              textAnchor="middle"
              fill="#9896b0"
              fontSize="12"
              fontWeight="600"
              style={{ letterSpacing: '1px' }}
            >
              {node.label}
            </text>
          </g>
        ))}

        {/* Center Node Icon (Bank) */}
        <motion.path
          d="M 190 45 L 210 45 L 210 55 L 190 55 Z"
          fill="#3b82f6"
          animate={liteMode ? undefined : { opacity: [0.5, 1, 0.5] }}
          transition={liteMode ? undefined : { duration: 2, repeat: Infinity }}
        />
        <motion.path
          d="M 194 40 L 206 40 L 200 35 Z"
          fill="#3b82f6"
        />
      </svg>
    </div>
  );
}
