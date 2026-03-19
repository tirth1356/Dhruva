import { motion } from 'framer-motion';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  animate?: boolean;
}

export const GradientText = ({ 
  children, 
  className = '', 
  colors = ['#3DC2EC', '#5227FF', '#8B5CF6'],
  animate = true 
}: GradientTextProps) => {
  const gradientStyle = {
    backgroundImage: animate 
      ? `linear-gradient(90deg, ${colors.join(', ')}, ${colors[0]})`
      : `linear-gradient(90deg, ${colors.join(', ')})`,
    backgroundSize: animate ? '300% 100%' : '100% 100%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };

  const Component = animate ? motion.span : 'span';

  return (
    <Component
      className={className}
      style={gradientStyle}
      {...(animate && {
        animate: {
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        },
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        },
      })}
    >
      {children}
    </Component>
  );
};
