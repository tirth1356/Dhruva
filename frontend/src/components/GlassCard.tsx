import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export const GlassCard = ({ 
  children, 
  className = '', 
  hover = true,
  glow = false,
  onClick 
}: GlassCardProps) => {
  return (
    <motion.div
      className={clsx(
        'relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6',
        hover && 'hover:border-white/20 hover:bg-white/10 transition-all duration-300',
        glow && 'hover:shadow-xl hover:shadow-[#5227FF]/20',
        onClick && 'cursor-pointer',
        className
      )}
      {...(hover && {
        whileHover: { y: -4 },
        transition: { duration: 0.2 }
      })}
      onClick={onClick}
    >
      {glow && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#5227FF]/20 to-[#3DC2EC]/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};
