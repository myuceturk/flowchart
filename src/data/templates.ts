import type { Node, Edge } from 'reactflow';

export interface DiagramTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'software' | 'hr' | 'blank';
  thumbnail?: string;
  nodes: Node[];
  edges: Edge[];
}

export const templates: DiagramTemplate[] = [
  // ── Blank canvas ──────────────────────────────────────────────
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch with an empty canvas.',
    category: 'blank',
    nodes: [],
    edges: [],
  },

  // ── Simple Approval Flow ──────────────────────────────────────
  {
    id: 'approval-flow',
    name: 'Simple Approval Flow',
    description: 'A basic request → review → approve/reject workflow with 6 nodes.',
    category: 'business',
    nodes: [
      { id: 'af-1', type: 'startEnd', position: { x: 300, y: 0 }, data: { label: 'Start' } },
      { id: 'af-2', type: 'process', position: { x: 275, y: 120 }, data: { label: 'Submit Request' } },
      { id: 'af-3', type: 'decision', position: { x: 287, y: 260 }, data: { label: 'Approved?' } },
      { id: 'af-4', type: 'process', position: { x: 80, y: 400 }, data: { label: 'Rejected — Revise', color: '#fda4af' } },
      { id: 'af-5', type: 'process', position: { x: 480, y: 400 }, data: { label: 'Approved — Proceed', color: '#86efac' } },
      { id: 'af-6', type: 'startEnd', position: { x: 300, y: 540 }, data: { label: 'End' } },
    ],
    edges: [
      { id: 'af-e1', source: 'af-1', target: 'af-2', type: 'labeled', data: {} },
      { id: 'af-e2', source: 'af-2', target: 'af-3', type: 'labeled', data: {} },
      { id: 'af-e3', source: 'af-3', target: 'af-4', type: 'labeled', data: { label: 'NO' } },
      { id: 'af-e4', source: 'af-3', target: 'af-5', type: 'labeled', data: { label: 'YES' } },
      { id: 'af-e5', source: 'af-4', target: 'af-6', type: 'labeled', data: {} },
      { id: 'af-e6', source: 'af-5', target: 'af-6', type: 'labeled', data: {} },
    ],
  },

  // ── Software Release Process ──────────────────────────────────
  {
    id: 'software-release',
    name: 'Software Release Process',
    description: 'Code → build → test → staging → production deployment pipeline.',
    category: 'software',
    nodes: [
      { id: 'sr-1', type: 'startEnd', position: { x: 320, y: 0 }, data: { label: 'Start' } },
      { id: 'sr-2', type: 'process', position: { x: 295, y: 110 }, data: { label: 'Write Code' } },
      { id: 'sr-3', type: 'process', position: { x: 295, y: 220 }, data: { label: 'Build Artifact' } },
      { id: 'sr-4', type: 'decision', position: { x: 307, y: 340 }, data: { label: 'Tests Pass?' } },
      { id: 'sr-5', type: 'process', position: { x: 80, y: 480 }, data: { label: 'Fix Bugs', color: '#fda4af' } },
      { id: 'sr-6', type: 'process', position: { x: 480, y: 480 }, data: { label: 'Deploy to Staging' } },
      { id: 'sr-7', type: 'decision', position: { x: 492, y: 600 }, data: { label: 'QA OK?' } },
      { id: 'sr-8', type: 'process', position: { x: 480, y: 740 }, data: { label: 'Deploy to Production', color: '#86efac' } },
      { id: 'sr-9', type: 'startEnd', position: { x: 505, y: 870 }, data: { label: 'Done' } },
    ],
    edges: [
      { id: 'sr-e1', source: 'sr-1', target: 'sr-2', type: 'labeled', data: {} },
      { id: 'sr-e2', source: 'sr-2', target: 'sr-3', type: 'labeled', data: {} },
      { id: 'sr-e3', source: 'sr-3', target: 'sr-4', type: 'labeled', data: {} },
      { id: 'sr-e4', source: 'sr-4', target: 'sr-5', type: 'labeled', data: { label: 'NO' } },
      { id: 'sr-e5', source: 'sr-4', target: 'sr-6', type: 'labeled', data: { label: 'YES' } },
      { id: 'sr-e6', source: 'sr-5', target: 'sr-2', type: 'labeled', data: {} },
      { id: 'sr-e7', source: 'sr-6', target: 'sr-7', type: 'labeled', data: {} },
      { id: 'sr-e8', source: 'sr-7', target: 'sr-5', type: 'labeled', data: { label: 'NO' } },
      { id: 'sr-e9', source: 'sr-7', target: 'sr-8', type: 'labeled', data: { label: 'YES' } },
      { id: 'sr-e10', source: 'sr-8', target: 'sr-9', type: 'labeled', data: {} },
    ],
  },

  // ── Customer Support Flow ─────────────────────────────────────
  {
    id: 'customer-support',
    name: 'Customer Support Flow',
    description: 'Ticket received → categorize → escalate or resolve → close.',
    category: 'business',
    nodes: [
      { id: 'cs-1', type: 'startEnd', position: { x: 300, y: 0 }, data: { label: 'Ticket Received' } },
      { id: 'cs-2', type: 'process', position: { x: 270, y: 120 }, data: { label: 'Categorize Issue' } },
      { id: 'cs-3', type: 'decision', position: { x: 282, y: 260 }, data: { label: 'Critical?' } },
      { id: 'cs-4', type: 'process', position: { x: 80, y: 400 }, data: { label: 'Escalate to L2', color: '#fda4af' } },
      { id: 'cs-5', type: 'process', position: { x: 480, y: 400 }, data: { label: 'Resolve Directly', color: '#86efac' } },
      { id: 'cs-6', type: 'process', position: { x: 275, y: 540 }, data: { label: 'Notify Customer' } },
      { id: 'cs-7', type: 'startEnd', position: { x: 300, y: 660 }, data: { label: 'Close Ticket' } },
    ],
    edges: [
      { id: 'cs-e1', source: 'cs-1', target: 'cs-2', type: 'labeled', data: {} },
      { id: 'cs-e2', source: 'cs-2', target: 'cs-3', type: 'labeled', data: {} },
      { id: 'cs-e3', source: 'cs-3', target: 'cs-4', type: 'labeled', data: { label: 'YES' } },
      { id: 'cs-e4', source: 'cs-3', target: 'cs-5', type: 'labeled', data: { label: 'NO' } },
      { id: 'cs-e5', source: 'cs-4', target: 'cs-6', type: 'labeled', data: {} },
      { id: 'cs-e6', source: 'cs-5', target: 'cs-6', type: 'labeled', data: {} },
      { id: 'cs-e7', source: 'cs-6', target: 'cs-7', type: 'labeled', data: {} },
    ],
  },

  // ── Employee Onboarding ───────────────────────────────────────
  {
    id: 'employee-onboarding',
    name: 'Employee Onboarding',
    description: 'Offer → documents → IT setup → training → start work.',
    category: 'hr',
    nodes: [
      { id: 'eo-1', type: 'startEnd', position: { x: 300, y: 0 }, data: { label: 'Offer Accepted' } },
      { id: 'eo-2', type: 'process', position: { x: 270, y: 120 }, data: { label: 'Collect Documents' } },
      { id: 'eo-3', type: 'process', position: { x: 270, y: 240 }, data: { label: 'IT Setup & Access' } },
      { id: 'eo-4', type: 'process', position: { x: 270, y: 360 }, data: { label: 'Orientation Training' } },
      { id: 'eo-5', type: 'decision', position: { x: 282, y: 490 }, data: { label: 'Passed?' } },
      { id: 'eo-6', type: 'process', position: { x: 80, y: 630 }, data: { label: 'Additional Training', color: '#fde68a' } },
      { id: 'eo-7', type: 'process', position: { x: 480, y: 630 }, data: { label: 'Assign to Team', color: '#86efac' } },
      { id: 'eo-8', type: 'startEnd', position: { x: 500, y: 760 }, data: { label: 'Start Work' } },
    ],
    edges: [
      { id: 'eo-e1', source: 'eo-1', target: 'eo-2', type: 'labeled', data: {} },
      { id: 'eo-e2', source: 'eo-2', target: 'eo-3', type: 'labeled', data: {} },
      { id: 'eo-e3', source: 'eo-3', target: 'eo-4', type: 'labeled', data: {} },
      { id: 'eo-e4', source: 'eo-4', target: 'eo-5', type: 'labeled', data: {} },
      { id: 'eo-e5', source: 'eo-5', target: 'eo-6', type: 'labeled', data: { label: 'NO' } },
      { id: 'eo-e6', source: 'eo-5', target: 'eo-7', type: 'labeled', data: { label: 'YES' } },
      { id: 'eo-e7', source: 'eo-6', target: 'eo-4', type: 'labeled', data: {} },
      { id: 'eo-e8', source: 'eo-7', target: 'eo-8', type: 'labeled', data: {} },
    ],
  },
];

export const templateCategories = [
  { id: 'all', label: 'All' },
  { id: 'business', label: 'Business' },
  { id: 'software', label: 'Software' },
  { id: 'hr', label: 'HR' },
] as const;

export type TemplateCategory = (typeof templateCategories)[number]['id'];
