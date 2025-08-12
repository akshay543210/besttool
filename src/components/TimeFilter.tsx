import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface TimeFilterProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const filterOptions = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this-week', label: 'This Week' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: '3-months', label: '3 Months' },
  { value: 'this-year', label: 'This Year' },
  { value: 'last-year', label: 'Last Year' },
  { value: 'all', label: 'All Time' },
];

export function TimeFilter({ activeFilter, onFilterChange }: TimeFilterProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <motion.div
            key={option.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant={activeFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(option.value)}
              className={`transition-all duration-200 ${
                activeFilter === option.value 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted'
              }`}
            >
              {option.label}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}