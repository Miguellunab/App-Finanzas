import { motion } from 'framer-motion';

export default function GlowingCore() {
  return (
    <div className="w-full flex justify-center items-center py-6 relative overflow-hidden" style={{ minHeight: '180px' }}>
      <svg
        viewBox="0 0 400 200"
        className="absolute inset-0 w-full h-full object-cover opacity-70"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <linearGradient id="grid-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7c6af7" stopOpacity="0" />
            <stop offset="50%" stopColor="#7c6af7" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#7c6af7" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="orb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bfaaff" />
            <stop offset="100%" stopColor="#7c6af7" />
          </linearGradient>
          
          <radialGradient id="bg-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7c6af7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#7c6af7" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient background glow */}
        <motion.circle
          cx="200"
          cy="100"
          r="80"
          fill="url(#bg-glow)"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Animated Grid Lines */}
        <g stroke="url(#grid-grad)" strokeWidth="1.5">
          {[...Array(10)].map((_, i) => (
            <motion.path
              key={`h-${i}`}
              d={`M0 ${20 * i} Q 200 ${20 * i + (i%2===0?20:-20)} 400 ${20 * i}`}
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1, 1], 
                opacity: [0, 0.5, 0],
                d: [`M0 ${20 * i} Q 200 ${20 * i + (i%2===0?20:-20)} 400 ${20 * i}`, 
                    `M0 ${20 * i} Q 200 ${20 * i + (i%2===0?-20:20)} 400 ${20 * i}`] 
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                repeatType: "reverse"
              }}
            />
          ))}
          {[...Array(20)].map((_, i) => (
            <motion.line
              key={`v-${i}`}
              x1={20 * i} y1="0" x2={20 * i} y2="200"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{
                duration: 3 + (i%3),
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}
        </g>

        {/* Floating AI Nodes */}
        {[
          { cx: 120, cy: 60, r: 3, dur: 3, delay: 0 },
          { cx: 280, cy: 140, r: 4, dur: 4, delay: 1 },
          { cx: 150, cy: 150, r: 2.5, dur: 5, delay: 0.5 },
          { cx: 250, cy: 50, r: 3.5, dur: 3.5, delay: 2 },
          { cx: 80, cy: 120, r: 2, dur: 4.5, delay: 1.5 },
          { cx: 320, cy: 80, r: 4.5, dur: 5.5, delay: 0.2 },
        ].map((node, i) => (
          <motion.circle
            key={`node-${i}`}
            cx={node.cx}
            cy={node.cy}
            r={node.r}
            fill="#fff"
            filter="url(#glow)"
            animate={{
              y: [-15, 15, -15],
              x: [-10, 10, -10],
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: node.dur,
              delay: node.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Connecting Lines between Nodes to the Core */}
        {[
          { x1: 120, y1: 60 },
          { x1: 280, y1: 140 },
          { x1: 150, y1: 150 },
          { x1: 250, y1: 50 },
        ].map((line, i) => (
          <motion.line
            key={`link-${i}`}
            x1={line.x1} y1={line.y1}
            x2="200" y2="100"
            stroke="url(#orb-grad)"
            strokeWidth="1"
            filter="url(#glow)"
            animate={{
              opacity: [0, 0.6, 0],
              strokeDasharray: ["0, 100", "100, 0", "0, 100"]
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Central Core Element */}
        <motion.circle
          cx="200" cy="100" r="14"
          fill="url(#orb-grad)"
          filter="url(#glow)"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.circle
          cx="200" cy="100" r="18"
          fill="none"
          stroke="#bfaaff"
          strokeWidth="1.5"
          filter="url(#glow)"
          strokeDasharray="10 20"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: { duration: 10, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
        />
        <motion.circle
          cx="200" cy="100" r="24"
          fill="none"
          stroke="#7c6af7"
          strokeWidth="1"
          strokeDasharray="4 8"
          animate={{
            rotate: [360, 0]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />

      </svg>
      
      {/* Decorative Text overlay */}
      <motion.div 
        className="z-10 text-center pointer-events-none"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <h2 className="text-xl font-bold tracking-widest text-transparent bg-clip-text" 
            style={{ backgroundImage: 'linear-gradient(90deg, #bfaaff, #ffffff, #7c6af7)' }}>
          FINANZAS AI
        </h2>
        <p className="text-xs tracking-widest opacity-60" style={{ color: '#bfaaff' }}>
          CORE NEURAL NETWORK
        </p>
      </motion.div>
    </div>
  );
}
