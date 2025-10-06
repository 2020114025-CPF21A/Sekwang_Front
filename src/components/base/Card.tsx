
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = '', onClick }: CardProps) {
  const baseClasses = 'bg-white rounded-xl shadow-sm border border-gray-100';
  
  return (
    <div 
      className={`${baseClasses} ${className} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
