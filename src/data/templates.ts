import type { Node, Edge } from 'reactflow';

export interface DiagramTemplate {
  id: string;
  name: string;
  description: string;
  preview?: string;
  category: 'business' | 'software' | 'hr' | 'blank' | 'business-process' | 'technical' | 'product';
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

  // ── Invoice Approval ─────────────────────────────────────────
  {
    id: 'invoice-approval',
    name: 'Invoice Approval',
    description: 'Invoice received → verify → manager review → payment processing.',
    preview: 'Use this template for finance teams that need a standardised invoice review and payment authorisation workflow.',
    category: 'business-process',
    nodes: [
      { id: 'ia-1', type: 'startEnd', position: { x: 300, y: 0 }, data: { label: 'Invoice Received' } },
      { id: 'ia-2', type: 'process', position: { x: 275, y: 120 }, data: { label: 'Verify Details' } },
      { id: 'ia-3', type: 'decision', position: { x: 287, y: 250 }, data: { label: 'Details OK?' } },
      { id: 'ia-4', type: 'process', position: { x: 60, y: 390 }, data: { label: 'Request Revision', color: '#fda4af' } },
      { id: 'ia-5', type: 'process', position: { x: 480, y: 370 }, data: { label: 'Manager Review' } },
      { id: 'ia-6', type: 'process', position: { x: 480, y: 490 }, data: { label: 'Process Payment', color: '#86efac' } },
      { id: 'ia-7', type: 'startEnd', position: { x: 300, y: 620 }, data: { label: 'Invoice Closed' } },
    ],
    edges: [
      { id: 'ia-e1', source: 'ia-1', target: 'ia-2', type: 'labeled', data: {} },
      { id: 'ia-e2', source: 'ia-2', target: 'ia-3', type: 'labeled', data: {} },
      { id: 'ia-e3', source: 'ia-3', target: 'ia-4', type: 'labeled', data: { label: 'NO' } },
      { id: 'ia-e4', source: 'ia-3', target: 'ia-5', type: 'labeled', data: { label: 'YES' } },
      { id: 'ia-e5', source: 'ia-4', target: 'ia-7', type: 'labeled', data: {} },
      { id: 'ia-e6', source: 'ia-5', target: 'ia-6', type: 'labeled', data: {} },
      { id: 'ia-e7', source: 'ia-6', target: 'ia-7', type: 'labeled', data: {} },
    ],
  },

  // ── Bug Report Flow ───────────────────────────────────────────
  {
    id: 'bug-report-flow',
    name: 'Bug Report Flow',
    description: 'Bug reported → triage → assign developer → fix → verify → close.',
    preview: 'Ideal for engineering teams tracking defects from initial report through resolution and quality verification.',
    category: 'business-process',
    nodes: [
      { id: 'br-1', type: 'startEnd', position: { x: 300, y: 0 }, data: { label: 'Bug Reported' } },
      { id: 'br-2', type: 'process', position: { x: 270, y: 120 }, data: { label: 'Triage & Classify' } },
      { id: 'br-3', type: 'decision', position: { x: 282, y: 250 }, data: { label: 'Reproducible?' } },
      { id: 'br-4', type: 'process', position: { x: 50, y: 390 }, data: { label: 'Close — Cannot Reproduce', color: '#fda4af' } },
      { id: 'br-5', type: 'process', position: { x: 460, y: 370 }, data: { label: 'Assign to Developer' } },
      { id: 'br-6', type: 'process', position: { x: 460, y: 490 }, data: { label: 'Implement Fix' } },
      { id: 'br-7', type: 'decision', position: { x: 472, y: 620 }, data: { label: 'Tests Pass?' } },
      { id: 'br-8', type: 'process', position: { x: 240, y: 760 }, data: { label: 'Reopen Issue', color: '#fda4af' } },
      { id: 'br-9', type: 'startEnd', position: { x: 460, y: 760 }, data: { label: 'Issue Closed', color: '#86efac' } },
    ],
    edges: [
      { id: 'br-e1', source: 'br-1', target: 'br-2', type: 'labeled', data: {} },
      { id: 'br-e2', source: 'br-2', target: 'br-3', type: 'labeled', data: {} },
      { id: 'br-e3', source: 'br-3', target: 'br-4', type: 'labeled', data: { label: 'NO' } },
      { id: 'br-e4', source: 'br-3', target: 'br-5', type: 'labeled', data: { label: 'YES' } },
      { id: 'br-e5', source: 'br-5', target: 'br-6', type: 'labeled', data: {} },
      { id: 'br-e6', source: 'br-6', target: 'br-7', type: 'labeled', data: {} },
      { id: 'br-e7', source: 'br-7', target: 'br-8', type: 'labeled', data: { label: 'FAIL' } },
      { id: 'br-e8', source: 'br-7', target: 'br-9', type: 'labeled', data: { label: 'PASS' } },
      { id: 'br-e9', source: 'br-8', target: 'br-5', type: 'labeled', data: {} },
    ],
  },

  // ── CI/CD Pipeline ────────────────────────────────────────────
  {
    id: 'cicd-pipeline',
    name: 'CI/CD Pipeline',
    description: 'Code push → lint → unit tests → build → staging → integration tests → production.',
    preview: 'Perfect for DevOps teams documenting their automated build, test, and deployment pipeline from commit to production.',
    category: 'technical',
    nodes: [
      { id: 'cp-1', type: 'startEnd', position: { x: 300, y: 0 }, data: { label: 'Code Push' } },
      { id: 'cp-2', type: 'process', position: { x: 270, y: 110 }, data: { label: 'Lint & Format' } },
      { id: 'cp-3', type: 'process', position: { x: 270, y: 220 }, data: { label: 'Unit Tests' } },
      { id: 'cp-4', type: 'decision', position: { x: 282, y: 350 }, data: { label: 'Tests Pass?' } },
      { id: 'cp-5', type: 'process', position: { x: 60, y: 490 }, data: { label: 'Notify Developer', color: '#fda4af' } },
      { id: 'cp-6', type: 'process', position: { x: 460, y: 470 }, data: { label: 'Build Artifact' } },
      { id: 'cp-7', type: 'process', position: { x: 460, y: 580 }, data: { label: 'Deploy to Staging' } },
      { id: 'cp-8', type: 'process', position: { x: 460, y: 690 }, data: { label: 'Integration Tests' } },
      { id: 'cp-9', type: 'decision', position: { x: 472, y: 820 }, data: { label: 'QA Approved?' } },
      { id: 'cp-10', type: 'process', position: { x: 460, y: 960 }, data: { label: 'Deploy to Production', color: '#86efac' } },
    ],
    edges: [
      { id: 'cp-e1', source: 'cp-1', target: 'cp-2', type: 'labeled', data: {} },
      { id: 'cp-e2', source: 'cp-2', target: 'cp-3', type: 'labeled', data: {} },
      { id: 'cp-e3', source: 'cp-3', target: 'cp-4', type: 'labeled', data: {} },
      { id: 'cp-e4', source: 'cp-4', target: 'cp-5', type: 'labeled', data: { label: 'FAIL' } },
      { id: 'cp-e5', source: 'cp-4', target: 'cp-6', type: 'labeled', data: { label: 'PASS' } },
      { id: 'cp-e6', source: 'cp-5', target: 'cp-1', type: 'labeled', data: {} },
      { id: 'cp-e7', source: 'cp-6', target: 'cp-7', type: 'labeled', data: {} },
      { id: 'cp-e8', source: 'cp-7', target: 'cp-8', type: 'labeled', data: {} },
      { id: 'cp-e9', source: 'cp-8', target: 'cp-9', type: 'labeled', data: {} },
      { id: 'cp-e10', source: 'cp-9', target: 'cp-5', type: 'labeled', data: { label: 'FAIL' } },
      { id: 'cp-e11', source: 'cp-9', target: 'cp-10', type: 'labeled', data: { label: 'PASS' } },
    ],
  },

  // ── API Request Lifecycle ─────────────────────────────────────
  {
    id: 'api-request-lifecycle',
    name: 'API Request Lifecycle',
    description: 'Client request → auth check → process → query DB → format response.',
    preview: 'Use this template to document how an HTTP request travels through authentication, business logic, and data layers back to the client.',
    category: 'technical',
    nodes: [
      { id: 'ar-1', type: 'startEnd', position: { x: 300, y: 0 }, data: { label: 'Client Request' } },
      { id: 'ar-2', type: 'process', position: { x: 270, y: 120 }, data: { label: 'Parse & Validate' } },
      { id: 'ar-3', type: 'decision', position: { x: 282, y: 250 }, data: { label: 'Authenticated?' } },
      { id: 'ar-4', type: 'process', position: { x: 60, y: 390 }, data: { label: 'Return 401 Error', color: '#fda4af' } },
      { id: 'ar-5', type: 'process', position: { x: 460, y: 370 }, data: { label: 'Process Request' } },
      { id: 'ar-6', type: 'process', position: { x: 460, y: 490 }, data: { label: 'Query Database' } },
      { id: 'ar-7', type: 'process', position: { x: 270, y: 620 }, data: { label: 'Format Response' } },
      { id: 'ar-8', type: 'startEnd', position: { x: 300, y: 740 }, data: { label: 'Return Response' } },
    ],
    edges: [
      { id: 'ar-e1', source: 'ar-1', target: 'ar-2', type: 'labeled', data: {} },
      { id: 'ar-e2', source: 'ar-2', target: 'ar-3', type: 'labeled', data: {} },
      { id: 'ar-e3', source: 'ar-3', target: 'ar-4', type: 'labeled', data: { label: 'NO' } },
      { id: 'ar-e4', source: 'ar-3', target: 'ar-5', type: 'labeled', data: { label: 'YES' } },
      { id: 'ar-e5', source: 'ar-5', target: 'ar-6', type: 'labeled', data: {} },
      { id: 'ar-e6', source: 'ar-6', target: 'ar-7', type: 'labeled', data: {} },
      { id: 'ar-e7', source: 'ar-7', target: 'ar-8', type: 'labeled', data: {} },
    ],
  },

  // ── Database Migration Flow ───────────────────────────────────
  {
    id: 'database-migration',
    name: 'Database Migration Flow',
    description: 'Backup → apply migration → verify → rollback on failure or go live.',
    preview: 'Guides database engineers through a safe migration procedure with an automatic rollback path if the migration fails.',
    category: 'technical',
    nodes: [
      { id: 'dm-1', type: 'startEnd', position: { x: 300, y: 0 }, data: { label: 'Start Migration' } },
      { id: 'dm-2', type: 'process', position: { x: 270, y: 120 }, data: { label: 'Backup Database' } },
      { id: 'dm-3', type: 'process', position: { x: 270, y: 240 }, data: { label: 'Apply Migration' } },
      { id: 'dm-4', type: 'decision', position: { x: 282, y: 370 }, data: { label: 'Success?' } },
      { id: 'dm-5', type: 'process', position: { x: 60, y: 510 }, data: { label: 'Rollback Changes', color: '#fda4af' } },
      { id: 'dm-6', type: 'process', position: { x: 460, y: 490 }, data: { label: 'Verify & Test', color: '#86efac' } },
      { id: 'dm-7', type: 'startEnd', position: { x: 300, y: 640 }, data: { label: 'Migration Done' } },
    ],
    edges: [
      { id: 'dm-e1', source: 'dm-1', target: 'dm-2', type: 'labeled', data: {} },
      { id: 'dm-e2', source: 'dm-2', target: 'dm-3', type: 'labeled', data: {} },
      { id: 'dm-e3', source: 'dm-3', target: 'dm-4', type: 'labeled', data: {} },
      { id: 'dm-e4', source: 'dm-4', target: 'dm-5', type: 'labeled', data: { label: 'NO' } },
      { id: 'dm-e5', source: 'dm-4', target: 'dm-6', type: 'labeled', data: { label: 'YES' } },
      { id: 'dm-e6', source: 'dm-5', target: 'dm-3', type: 'labeled', data: {} },
      { id: 'dm-e7', source: 'dm-6', target: 'dm-7', type: 'labeled', data: {} },
    ],
  },

  // ── User Registration Flow ────────────────────────────────────
  {
    id: 'user-registration',
    name: 'User Registration Flow',
    description: 'Sign-up form → email check → create account → verify email → activate.',
    preview: 'Use this template to map the end-to-end user sign-up experience including duplicate-email handling and email verification.',
    category: 'product',
    nodes: [
      { id: 'ur-1', type: 'startEnd', position: { x: 300, y: 0 }, data: { label: 'Start Registration' } },
      { id: 'ur-2', type: 'process', position: { x: 270, y: 120 }, data: { label: 'Enter Credentials' } },
      { id: 'ur-3', type: 'decision', position: { x: 282, y: 250 }, data: { label: 'Email Exists?' } },
      { id: 'ur-4', type: 'process', position: { x: 60, y: 390 }, data: { label: 'Show Error', color: '#fda4af' } },
      { id: 'ur-5', type: 'process', position: { x: 460, y: 370 }, data: { label: 'Create Account' } },
      { id: 'ur-6', type: 'process', position: { x: 460, y: 490 }, data: { label: 'Send Verification' } },
      { id: 'ur-7', type: 'decision', position: { x: 472, y: 620 }, data: { label: 'Verified?' } },
      { id: 'ur-8', type: 'startEnd', position: { x: 300, y: 760 }, data: { label: 'Account Active', color: '#86efac' } },
    ],
    edges: [
      { id: 'ur-e1', source: 'ur-1', target: 'ur-2', type: 'labeled', data: {} },
      { id: 'ur-e2', source: 'ur-2', target: 'ur-3', type: 'labeled', data: {} },
      { id: 'ur-e3', source: 'ur-3', target: 'ur-4', type: 'labeled', data: { label: 'YES' } },
      { id: 'ur-e4', source: 'ur-3', target: 'ur-5', type: 'labeled', data: { label: 'NO' } },
      { id: 'ur-e5', source: 'ur-4', target: 'ur-2', type: 'labeled', data: {} },
      { id: 'ur-e6', source: 'ur-5', target: 'ur-6', type: 'labeled', data: {} },
      { id: 'ur-e7', source: 'ur-6', target: 'ur-7', type: 'labeled', data: {} },
      { id: 'ur-e8', source: 'ur-7', target: 'ur-6', type: 'labeled', data: { label: 'NO' } },
      { id: 'ur-e9', source: 'ur-7', target: 'ur-8', type: 'labeled', data: { label: 'YES' } },
    ],
  },

  // ── Feature Request Process ───────────────────────────────────
  {
    id: 'feature-request',
    name: 'Feature Request Process',
    description: 'Request submitted → review → feasibility → priority scoring → roadmap.',
    preview: 'Helps product teams evaluate incoming feature requests consistently, from initial triage to roadmap scheduling or rejection.',
    category: 'product',
    nodes: [
      { id: 'fr-1', type: 'startEnd', position: { x: 300, y: 0 }, data: { label: 'Request Submitted' } },
      { id: 'fr-2', type: 'process', position: { x: 270, y: 120 }, data: { label: 'Initial Review' } },
      { id: 'fr-3', type: 'decision', position: { x: 282, y: 250 }, data: { label: 'Accepted?' } },
      { id: 'fr-4', type: 'process', position: { x: 60, y: 390 }, data: { label: 'Decline & Notify', color: '#fda4af' } },
      { id: 'fr-5', type: 'process', position: { x: 460, y: 370 }, data: { label: 'Feasibility Study' } },
      { id: 'fr-6', type: 'process', position: { x: 460, y: 490 }, data: { label: 'Priority Scoring' } },
      { id: 'fr-7', type: 'process', position: { x: 460, y: 610 }, data: { label: 'Add to Roadmap', color: '#86efac' } },
      { id: 'fr-8', type: 'startEnd', position: { x: 300, y: 730 }, data: { label: 'Process Complete' } },
    ],
    edges: [
      { id: 'fr-e1', source: 'fr-1', target: 'fr-2', type: 'labeled', data: {} },
      { id: 'fr-e2', source: 'fr-2', target: 'fr-3', type: 'labeled', data: {} },
      { id: 'fr-e3', source: 'fr-3', target: 'fr-4', type: 'labeled', data: { label: 'NO' } },
      { id: 'fr-e4', source: 'fr-3', target: 'fr-5', type: 'labeled', data: { label: 'YES' } },
      { id: 'fr-e5', source: 'fr-4', target: 'fr-8', type: 'labeled', data: {} },
      { id: 'fr-e6', source: 'fr-5', target: 'fr-6', type: 'labeled', data: {} },
      { id: 'fr-e7', source: 'fr-6', target: 'fr-7', type: 'labeled', data: {} },
      { id: 'fr-e8', source: 'fr-7', target: 'fr-8', type: 'labeled', data: {} },
    ],
  },

  // ── Incident Response ─────────────────────────────────────────
  {
    id: 'incident-response',
    name: 'Incident Response',
    description: 'Incident detected → alert team → assess severity → investigate → fix → post-mortem.',
    preview: 'Designed for on-call and SRE teams to follow a structured response path from initial alert through resolution and post-incident review.',
    category: 'product',
    nodes: [
      { id: 'ir-1', type: 'startEnd', position: { x: 300, y: 0 }, data: { label: 'Incident Detected' } },
      { id: 'ir-2', type: 'process', position: { x: 270, y: 120 }, data: { label: 'Alert On-call Team' } },
      { id: 'ir-3', type: 'process', position: { x: 270, y: 240 }, data: { label: 'Assess Severity' } },
      { id: 'ir-4', type: 'decision', position: { x: 282, y: 370 }, data: { label: 'Critical?' } },
      { id: 'ir-5', type: 'process', position: { x: 60, y: 510 }, data: { label: 'Escalate to Manager', color: '#fda4af' } },
      { id: 'ir-6', type: 'process', position: { x: 460, y: 490 }, data: { label: 'Investigate Cause' } },
      { id: 'ir-7', type: 'process', position: { x: 270, y: 650 }, data: { label: 'Apply Fix' } },
      { id: 'ir-8', type: 'decision', position: { x: 282, y: 780 }, data: { label: 'Resolved?' } },
      { id: 'ir-9', type: 'process', position: { x: 460, y: 920 }, data: { label: 'Conduct Post-mortem', color: '#86efac' } },
      { id: 'ir-10', type: 'startEnd', position: { x: 300, y: 1060 }, data: { label: 'Incident Closed' } },
    ],
    edges: [
      { id: 'ir-e1', source: 'ir-1', target: 'ir-2', type: 'labeled', data: {} },
      { id: 'ir-e2', source: 'ir-2', target: 'ir-3', type: 'labeled', data: {} },
      { id: 'ir-e3', source: 'ir-3', target: 'ir-4', type: 'labeled', data: {} },
      { id: 'ir-e4', source: 'ir-4', target: 'ir-5', type: 'labeled', data: { label: 'YES' } },
      { id: 'ir-e5', source: 'ir-4', target: 'ir-6', type: 'labeled', data: { label: 'NO' } },
      { id: 'ir-e6', source: 'ir-5', target: 'ir-6', type: 'labeled', data: {} },
      { id: 'ir-e7', source: 'ir-6', target: 'ir-7', type: 'labeled', data: {} },
      { id: 'ir-e8', source: 'ir-7', target: 'ir-8', type: 'labeled', data: {} },
      { id: 'ir-e9', source: 'ir-8', target: 'ir-6', type: 'labeled', data: { label: 'NO' } },
      { id: 'ir-e10', source: 'ir-8', target: 'ir-9', type: 'labeled', data: { label: 'YES' } },
      { id: 'ir-e11', source: 'ir-9', target: 'ir-10', type: 'labeled', data: {} },
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
  { id: 'business-process', label: 'Business Process' },
  { id: 'technical', label: 'Technical' },
  { id: 'product', label: 'Product' },
] as const;

export type TemplateCategory = (typeof templateCategories)[number]['id'];
