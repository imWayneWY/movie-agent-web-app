// shadcn/ui components
export { Button, buttonVariants, type ButtonProps } from './button';
export { Badge, badgeVariants, type BadgeProps } from './badge';
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './card';
export { Checkbox } from './checkbox';
export { Separator } from './separator';
export { Skeleton } from './skeleton';
export { Slider } from './slider';

// Custom components
export { ThemeToggle } from './theme-toggle';
export {
  MovieCard,
  MovieCardSkeleton,
  type MovieCardProps,
  type MovieCardSkeletonProps,
} from './movie-card';
export {
  PlatformBadge,
  PlatformBadgeGroup,
  generatePlatformUrl,
  type PlatformBadgeProps,
  type PlatformBadgeGroupProps,
  type PlatformBadgeVariant,
  type PlatformBadgeSize,
} from './platform-badge';
export {
  MoodSelector,
  MoodSelectorSkeleton,
  type MoodSelectorProps,
  type MoodSelectorSkeletonProps,
} from './mood-selector';
export {
  AdvancedFilters,
  AdvancedFiltersSkeleton,
  type AdvancedFiltersProps,
  type AdvancedFiltersSkeletonProps,
} from './advanced-filters';
export {
  BotContainer,
  BotContainerSkeleton,
  type BotContainerProps,
  type BotContainerSkeletonProps,
} from './bot-container';
export {
  MovieList,
  MovieListSkeleton,
  MovieListEmpty,
  MovieListError,
  type MovieListProps,
  type MovieListSkeletonProps,
  type MovieListEmptyProps,
  type MovieListErrorProps,
} from './movie-list';
