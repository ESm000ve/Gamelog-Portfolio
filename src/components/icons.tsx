import { forwardRef, type ComponentType, type SVGProps } from "react";
import {
  Keyboard as MacKeyboard,
  PanelLeft as MacPanelLeft,
  Grid2x2 as MacGrid2x2,
  List as MacList,
  BarChart2 as MacBarChart2,
  Plus as MacPlus,
  Gamepad2 as MacGamepad2,
  Sparkles as MacSparkles,
  Settings as MacSettings,
  Users as MacUsers,
  Calendar as MacCalendar,
  CheckCircle2 as MacCheckCircle2,
  AlertCircle as MacAlertCircle,
  Loader2 as MacLoader2,
  Clock as MacClock,
  RefreshCw as MacRefreshCw,
  Play as MacPlay,
  ChevronDown as MacChevronDown,
  ChevronRight as MacChevronRight,
  BookOpen as MacBookOpen,
  Zap as MacZap,
  Star as MacStar,
  Dices as MacDices,
  Trophy as MacTrophy,
  Search as MacSearch,
  ChevronLeft as MacChevronLeft,
  MoreHorizontal as MacMoreHorizontal,
  GripVertical as MacGripVertical,
  Trash2 as MacTrash2,
  Share2 as MacShare2,
  Check as MacCheck,
  Edit3 as MacEdit3,
  ArrowUpDown as MacArrowUpDown,
  X as MacX,
  ExternalLink as MacExternalLink,
  Filter as MacFilter,
  CheckSquare as MacCheckSquare,
  Activity as MacActivity,
  Hash as MacHash,
  Layers as MacLayers,
  Upload as MacUpload,
  Flame as MacFlame,
  PlusCircle as MacPlusCircle,
  ArrowRight as MacArrowRight,
  Award as MacAward,
  Library as MacLibrary,
  Sword as MacSword,
  Compass as MacCompass,
  Monitor as MacMonitor,
  Lock as MacLock,
  Palette as MacPalette,
  Sun as MacSun,
  Moon as MacMoon,
  Download as MacDownload,
  AlertTriangle as MacAlertTriangle,
  Database as MacDatabase,
  PlayCircle as MacPlayCircle,
  StarHalf as MacStarHalf,
  Command as MacCommand,
  Circle as MacCircle,
  Heart as MacHeart,
  Copy as MacCopy,
  FileText as MacFileText,
  Image as MacImage,
} from "lucide-react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  absoluteStrokeWidth?: boolean;
};

function icon(Icon: ComponentType<IconProps>) {
  return forwardRef<SVGSVGElement, IconProps>(function GameIcon(
    { size = 20, fill = "none", strokeWidth = 1.75, ...props },
    ref
  ) {
    return <Icon {...props} ref={ref} size={size} fill={fill} strokeWidth={strokeWidth} />;
  });
}

export const Grid2x2 = /*#__PURE__*/ icon(MacGrid2x2);
export const List = /*#__PURE__*/ icon(MacList);
export const BarChart2 = /*#__PURE__*/ icon(MacBarChart2);
export const Plus = /*#__PURE__*/ icon(MacPlus);
export const Gamepad2 = /*#__PURE__*/ icon(MacGamepad2);
export const Sparkles = /*#__PURE__*/ icon(MacSparkles);
export const Settings = /*#__PURE__*/ icon(MacSettings);
export const Users = /*#__PURE__*/ icon(MacUsers);
export const Calendar = /*#__PURE__*/ icon(MacCalendar);
export const CheckCircle2 = /*#__PURE__*/ icon(MacCheckCircle2);
export const AlertCircle = /*#__PURE__*/ icon(MacAlertCircle);
export const Loader2 = /*#__PURE__*/ icon(MacLoader2);
export const Clock = /*#__PURE__*/ icon(MacClock);
export const RefreshCw = /*#__PURE__*/ icon(MacRefreshCw);
export const Play = /*#__PURE__*/ icon(MacPlay);
export const ChevronDown = /*#__PURE__*/ icon(MacChevronDown);
export const ChevronRight = /*#__PURE__*/ icon(MacChevronRight);
export const BookOpen = /*#__PURE__*/ icon(MacBookOpen);
export const Zap = /*#__PURE__*/ icon(MacZap);
export const Star = /*#__PURE__*/ icon(MacStar);
export const Dices = /*#__PURE__*/ icon(MacDices);
export const Trophy = /*#__PURE__*/ icon(MacTrophy);
export const Search = /*#__PURE__*/ icon(MacSearch);
export const ChevronLeft = /*#__PURE__*/ icon(MacChevronLeft);
export const MoreHorizontal = /*#__PURE__*/ icon(MacMoreHorizontal);
export const GripVertical = /*#__PURE__*/ icon(MacGripVertical);
export const Trash2 = /*#__PURE__*/ icon(MacTrash2);
export const Share2 = /*#__PURE__*/ icon(MacShare2);
export const Check = /*#__PURE__*/ icon(MacCheck);
export const Edit3 = /*#__PURE__*/ icon(MacEdit3);
export const ArrowUpDown = /*#__PURE__*/ icon(MacArrowUpDown);
export const X = /*#__PURE__*/ icon(MacX);
export const ExternalLink = /*#__PURE__*/ icon(MacExternalLink);
export const Filter = /*#__PURE__*/ icon(MacFilter);
export const CheckSquare = /*#__PURE__*/ icon(MacCheckSquare);
export const Activity = /*#__PURE__*/ icon(MacActivity);
export const Hash = /*#__PURE__*/ icon(MacHash);
export const Layers = /*#__PURE__*/ icon(MacLayers);
export const Upload = /*#__PURE__*/ icon(MacUpload);
export const Flame = /*#__PURE__*/ icon(MacFlame);
export const PlusCircle = /*#__PURE__*/ icon(MacPlusCircle);
export const ArrowRight = /*#__PURE__*/ icon(MacArrowRight);
export const Award = /*#__PURE__*/ icon(MacAward);
export const Library = /*#__PURE__*/ icon(MacLibrary);
export const Sword = /*#__PURE__*/ icon(MacSword);
export const Compass = /*#__PURE__*/ icon(MacCompass);
export const Monitor = /*#__PURE__*/ icon(MacMonitor);
export const Lock = /*#__PURE__*/ icon(MacLock);
export const Palette = /*#__PURE__*/ icon(MacPalette);
export const Sun = /*#__PURE__*/ icon(MacSun);
export const Moon = /*#__PURE__*/ icon(MacMoon);
export const Download = /*#__PURE__*/ icon(MacDownload);
export const AlertTriangle = /*#__PURE__*/ icon(MacAlertTriangle);
export const Database = /*#__PURE__*/ icon(MacDatabase);
export const PlayCircle = /*#__PURE__*/ icon(MacPlayCircle);
export const StarHalf = /*#__PURE__*/ icon(MacStarHalf);
export const Command = /*#__PURE__*/ icon(MacCommand);
export const Circle = /*#__PURE__*/ icon(MacCircle);
export const Heart = /*#__PURE__*/ icon(MacHeart);
export const Copy = /*#__PURE__*/ icon(MacCopy);
export const FileText = /*#__PURE__*/ icon(MacFileText);
export const Image = /*#__PURE__*/ icon(MacImage);
export const Keyboard = icon(MacKeyboard);
export const PanelLeft = icon(MacPanelLeft);
