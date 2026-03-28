import type { ReactNode } from 'react';
import {
  ArrowLeftRight,
  BadgeCheck,
  Box,
  Boxes,
  Braces,
  CircleUserRound,
  Database,
  DatabaseZap,
  Diamond,
  FileText,
  FoldHorizontal,
  Hand,
  Image as ImageIcon,
  Layers3,
  LayoutGrid,
  MessageSquare,
  MonitorSmartphone,
  MoveLeft,
  MoveRight,
  Network,
  PanelTop,
  PenLine,
  Pentagon,
  RectangleHorizontal,
  Rows3,
  Server,
  Sparkles,
  StickyNote,
  TextCursorInput,
  Waypoints,
  Workflow,
  XCircle,
} from 'lucide-react';

const iconProps = {
  size: 18,
  strokeWidth: 1.9,
};

type IconMap = Record<string, ReactNode>;

export const uiIcons = {
  spark: (
    <Sparkles {...iconProps} />
  ),
  layers: (
    <Layers3 {...iconProps} />
  ),
  collapse: (
    <MoveLeft {...iconProps} />
  ),
  expand: (
    <MoveRight {...iconProps} />
  ),
  select: (
    <Workflow {...iconProps} />
  ),
  hand: (
    <Hand {...iconProps} />
  ),
} satisfies IconMap;

export const nodeIcons = {
  process: (
    <RectangleHorizontal {...iconProps} />
  ),
  decision: (
    <Diamond {...iconProps} />
  ),
  startEnd: (
    <Waypoints {...iconProps} />
  ),
  inputOutput: (
    <ArrowLeftRight {...iconProps} />
  ),
  document: (
    <FileText {...iconProps} />
  ),
  database: (
    <Database {...iconProps} />
  ),
  subprocess: (
    <FoldHorizontal {...iconProps} />
  ),
  user: (
    <CircleUserRound {...iconProps} />
  ),
  screen: (
    <MonitorSmartphone {...iconProps} />
  ),
  apiCall: (
    <Braces {...iconProps} />
  ),
  success: (
    <BadgeCheck {...iconProps} />
  ),
  error: (
    <XCircle {...iconProps} />
  ),
  server: (
    <Server {...iconProps} />
  ),
  databaseAdvanced: (
    <DatabaseZap {...iconProps} />
  ),
  queue: (
    <Rows3 {...iconProps} />
  ),
  microservice: (
    <Boxes {...iconProps} />
  ),
  externalApi: (
    <Network {...iconProps} />
  ),
  text: (
    <TextCursorInput {...iconProps} />
  ),
  stickyNote: (
    <StickyNote {...iconProps} />
  ),
  image: (
    <ImageIcon {...iconProps} />
  ),
  group: (
    <LayoutGrid {...iconProps} />
  ),
  container: (
    <Box {...iconProps} />
  ),
  swimlane: (
    <PanelTop {...iconProps} />
  ),
  annotation: (
    <MessageSquare {...iconProps} />
  ),
  manualInput: (
    <PenLine {...iconProps} />
  ),
  connector: (
    <Pentagon {...iconProps} />
  ),
} satisfies IconMap;
