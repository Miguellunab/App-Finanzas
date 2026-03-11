import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import useLiteMode from '../../hooks/useLiteMode';

interface Wallet {
  id: number;
  name: string;
  emoji: string;
  color: string;
  currency: string;
  balance: number;
}

interface WalletCardAnimProps {
  wallet: Wallet;
  onEdit: (w: Wallet) => void;
  onDelete: (id: number) => void;
  formatCOP: (n: number, currency?: string) => string;
}

export default function WalletCardAnim({ wallet, onEdit, onDelete, formatCOP }: WalletCardAnimProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const liteMode = useLiteMode();

  // 3D rotation values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Add spring physics to make the rotation smooth
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (liteMode) return;
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Normalize mouse position between -0.5 and 0.5
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;
    
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  // Extract RGB components from hex to create transparent versions
  const hexToRGB = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return `${r}, ${g}, ${b}`;
  };

  const colorRGB = wallet.color.startsWith('#') ? hexToRGB(wallet.color) : '124, 106, 247';

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => !liteMode && setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full rounded-2xl p-5 overflow-hidden flex flex-col justify-between"
      // Basic fallback background
      style={{
        rotateX,
        rotateY,
        transformStyle: liteMode ? 'flat' : "preserve-3d",
        background: `linear-gradient(135deg, rgba(${colorRGB}, 0.1) 0%, rgba(17, 17, 24, 0.8) 100%)`,
        border: `1px solid rgba(${colorRGB}, 0.2)`,
        minHeight: '160px',
        boxShadow: isHovered ? `0 10px 30px -10px rgba(${colorRGB}, 0.3)` : '0 4px 10px -5px rgba(0,0,0,0.5)',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      {/* Background Animated SVG Pattern */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
        <motion.svg
          width="100%"
          height="100%"
          viewBox="0 0 200 200"
          preserveAspectRatio="none"
          initial={{ opacity: 0.5 }}
          animate={{
            scale: liteMode ? 1 : isHovered ? 1.1 : 1,
            opacity: liteMode ? 0.4 : isHovered ? 0.8 : 0.5,
          }}
          transition={{ duration: 0.5 }}
        >
          <path
            d="M 0,50 Q 50,0 100,50 T 200,50"
            fill="none"
            stroke={wallet.color}
            strokeWidth="2"
            opacity="0.5"
          />
          <path
            d="M 0,100 Q 50,50 100,100 T 200,100"
            fill="none"
            stroke={wallet.color}
            strokeWidth="1.5"
            opacity="0.3"
          />
          <path
            d="M 0,150 Q 50,100 100,150 T 200,150"
            fill="none"
            stroke={wallet.color}
            strokeWidth="1"
            opacity="0.2"
          />
          {/* Animated floating circles matching the wallet color */}
          {!liteMode && (
            <motion.circle
              cx="160" cy="40" r="20"
              fill={`rgba(${colorRGB}, 0.1)`}
              animate={{
                y: isHovered ? [-5, 5, -5] : 0,
              }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />
          )}
          {!liteMode && (
            <motion.circle
              cx="40" cy="140" r="30"
              fill={`rgba(${colorRGB}, 0.05)`}
              animate={{
                scale: isHovered ? [1, 1.1, 1] : 1,
              }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            />
          )}
        </motion.svg>
      </div>

      {/* Glossy overlay reflection */}
      {!liteMode && (
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.03) 25%, transparent 30%)',
            backgroundSize: '200% 100%',
          }}
          animate={{
            backgroundPosition: isHovered ? ['200% 0', '-100% 0'] : '200% 0',
          }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      )}

      {/* Content - Must have transformZ to pop out in 3D */}
      <div className="relative z-10 flex justify-between items-start" style={{ transform: liteMode ? 'none' : "translateZ(30px)" }}>
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl backdrop-blur-md"
            style={{ 
              background: `rgba(${colorRGB}, 0.15)`, 
              border: `1px solid rgba(${colorRGB}, 0.4)`,
              boxShadow: `0 0 15px rgba(${colorRGB}, 0.2) inset`
            }}
          >
            {wallet.emoji}
          </div>
          <div>
            <h3 className="font-bold text-lg tracking-wide text-[#f1f0ff] drop-shadow-md">
              {wallet.name}
            </h3>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: wallet.color }}>
              {wallet.currency}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <motion.button 
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(124,106,247,0.2)' }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onEdit(wallet); }}
            className="p-1.5 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(124,106,247,0.05)', color: '#7c6af7', border: '1px solid rgba(124,106,247,0.2)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(244,63,94,0.2)' }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onDelete(wallet.id); }}
            className="p-1.5 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(244,63,94,0.05)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
          </motion.button>
        </div>
      </div>

      <div className="relative z-10 mt-6" style={{ transform: liteMode ? 'none' : "translateZ(40px)" }}>
        <p className="text-xs font-medium opacity-60 text-[#9896b0] mb-1">Saldo Actual</p>
        <div className="flex items-baseline gap-2">
          <motion.h2 
            className="text-3xl font-bold"
            style={{ color: wallet.balance >= 0 ? '#f1f0ff' : '#f43f5e' }}
            animate={{ 
              textShadow: isHovered ? `0 0 12px rgba(${colorRGB}, 0.5)` : '0 0 0px rgba(0,0,0,0)'
            }}
          >
            {formatCOP(wallet.balance, wallet.currency)}
          </motion.h2>
        </div>
      </div>
      
      {/* Decorative dots pattern at the bottom */}
      {!liteMode && (
        <div className="absolute bottom-4 right-4 flex gap-1 z-10" style={{ transform: "translateZ(20px)" }}>
          {[...Array(4)].map((_, i) => (
            <motion.div 
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: wallet.color }}
              animate={{ opacity: isHovered ? [0.3, 1, 0.3] : 0.3 }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
