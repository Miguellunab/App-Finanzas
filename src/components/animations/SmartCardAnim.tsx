import { motion } from 'framer-motion';

export default function SmartCardAnim() {
  return (
    <div className="w-full flex justify-center items-center py-8 relative overflow-hidden" style={{ minHeight: '220px' }}>
      <svg
        viewBox="0 0 400 220"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ perspective: "1000px" }}
      >
        <defs>
          <filter id="card-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <linearGradient id="card-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a1530" />
            <stop offset="50%" stopColor="#2d2660" />
            <stop offset="100%" stopColor="#12112a" />
          </linearGradient>

          <linearGradient id="chart-grad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Ambient Ring */}
        <motion.ellipse
          cx="200" cy="110" rx="140" ry="40"
          fill="none" stroke="#7c6af7" strokeWidth="1" strokeDasharray="4 8"
          opacity="0.3"
          animate={{ rotate: 360, rx: [140, 150, 140], ry: [40, 50, 40] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 110px" }}
        />

        {/* 3D Smart Card Container */}
        <g style={{ transformOrigin: "200px 110px" }}>
          <motion.g
            animate={{ 
              y: [-10, 10, -10],
              rotateX: [10, -10, 10],
              rotateY: [-15, 15, -15]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Card Shadow */}
            <rect x="110" y="80" width="180" height="110" rx="12" fill="#000" opacity="0.4" filter="url(#card-glow)" transform="translate(0, 20)" />
            
            {/* Card Body */}
            <rect x="110" y="60" width="180" height="110" rx="12" fill="url(#card-grad)" stroke="#7c6af7" strokeWidth="1.5" />
            
            {/* Card Chip */}
            <rect x="130" y="85" width="25" height="20" rx="4" fill="#fb923c" opacity="0.8" />
            <path d="M130 95 L155 95 M142 85 L142 105" stroke="#12112a" strokeWidth="1" />

            {/* Tap to Pay Icon */}
            <path d="M175 90 A15 15 0 0 1 175 100 M180 87 A20 20 0 0 1 180 103 M185 84 A25 25 0 0 1 185 106" fill="none" stroke="#9896b0" strokeWidth="2" strokeLinecap="round" />

            {/* Card Details */}
            <text x="130" y="145" fill="#f1f0ff" fontSize="14" fontFamily="monospace" letterSpacing="2">**** **** **** 4092</text>
            <text x="130" y="160" fill="#9896b0" fontSize="8" fontFamily="sans-serif">FINANZAS AI</text>
          </motion.g>
        </g>

        {/* Floating Finance Data Nodes */}
        {[
          { x: 80, y: 50, label: "+$450", color: "#22c55e", delay: 0 },
          { x: 320, y: 70, label: "-$120", color: "#f43f5e", delay: 1 },
          { x: 280, y: 170, label: "+$890", color: "#22c55e", delay: 0.5 },
          { x: 100, y: 160, label: "ETF", color: "#3b82f6", delay: 1.5 }
        ].map((node, i) => (
          <motion.g
            key={`data-${i}`}
            animate={{ 
              y: [-8, 8, -8],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: node.delay }}
          >
            <rect x={node.x - 25} y={node.y - 12} width="50" height="24" rx="12" fill={`${node.color}20`} stroke={node.color} strokeWidth="1" />
            <text x={node.x} y={node.y + 4} fill={node.color} fontSize="10" fontWeight="bold" textAnchor="middle">{node.label}</text>
          </motion.g>
        ))}

        {/* Holographic Chart over Card */}
        <motion.path
          d="M 160 140 L 180 120 L 200 130 L 220 90 L 240 100"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          filter="url(#card-glow)"
          animate={{
            strokeDasharray: ["0 100", "100 0", "0 100"],
            opacity: [0, 1, 0]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle cx="240" cy="100" r="3" fill="#22c55e" 
          animate={{ opacity: [0, 1, 0], scale: [1, 1.5, 1] }} 
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} 
        />
      </svg>
    </div>
  );
}
