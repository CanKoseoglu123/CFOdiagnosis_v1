// VS-27b: Company Profiles API Routes
// CRUD operations for company profiles with automatic classification

import { Router, Request, Response } from 'express';
import {
  classifyCompany,
  validateContext,
  getAllPersonas,
  getDefaultScoringMatrix
} from '../classification/engine';
import { ClassificationContext, ScoringMatrix } from '../classification/types';

const router = Router();

// ============================================
// Helper: Load custom scoring matrix from DB
// ============================================

async function loadScoringMatrix(req: Request): Promise<ScoringMatrix | undefined> {
  try {
    const { data, error } = await req.supabase
      .from('scoring_matrix')
      .select('matrix')
      .eq('active', true)
      .single();

    if (error || !data?.matrix) {
      return undefined; // Use default
    }

    return data.matrix as ScoringMatrix;
  } catch {
    return undefined;
  }
}

// ============================================
// POST /api/company-profiles
// Create a new company profile with classification
// ============================================

router.post('/', async (req: Request, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { name, context } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  if (!context) {
    return res.status(400).json({ error: 'Context is required' });
  }

  // Validate all 9 classification fields
  const validation = validateContext(context);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Missing required classification fields',
      missing: validation.missing,
      complete: validation.complete,
      total: validation.total
    });
  }

  try {
    // Load custom matrix (or use default)
    const matrix = await loadScoringMatrix(req);

    // Run classification
    const classification = classifyCompany(context as ClassificationContext, matrix);

    // Insert company profile
    const { data, error } = await req.supabase
      .from('company_profiles')
      .insert({
        user_id: req.userId,
        name,
        context,
        classification
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating company profile:', error);
      return res.status(500).json({ error: 'Failed to create company profile' });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Error in company profile creation:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /api/company-profiles
// List all company profiles for current user
// ============================================

router.get('/', async (req: Request, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { data, error } = await req.supabase
      .from('company_profiles')
      .select('id, name, context, classification, created_at, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching company profiles:', error);
      return res.status(500).json({ error: 'Failed to fetch company profiles' });
    }

    res.json(data || []);
  } catch (err) {
    console.error('Error listing company profiles:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /api/company-profiles/:id
// Get single company profile with classification
// ============================================

router.get('/:id', async (req: Request, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const profileId = req.params.id;

  try {
    const { data, error } = await req.supabase
      .from('company_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Company profile not found' });
      }
      console.error('Error fetching company profile:', error);
      return res.status(500).json({ error: 'Failed to fetch company profile' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error getting company profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// PUT /api/company-profiles/:id
// Update company profile and re-classify
// ============================================

router.put('/:id', async (req: Request, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const profileId = req.params.id;
  const { name, context } = req.body;

  if (!context) {
    return res.status(400).json({ error: 'Context is required' });
  }

  // Validate all 9 classification fields
  const validation = validateContext(context);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Missing required classification fields',
      missing: validation.missing,
      complete: validation.complete,
      total: validation.total
    });
  }

  try {
    // Load custom matrix (or use default)
    const matrix = await loadScoringMatrix(req);

    // Re-run classification
    const classification = classifyCompany(context as ClassificationContext, matrix);

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      context,
      classification
    };

    if (name) {
      updatePayload.name = name;
    }

    // Update profile
    const { data, error } = await req.supabase
      .from('company_profiles')
      .update(updatePayload)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Company profile not found' });
      }
      console.error('Error updating company profile:', error);
      return res.status(500).json({ error: 'Failed to update company profile' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error updating company profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// POST /api/company-profiles/:id/reclassify
// Force re-classification without changing context
// ============================================

router.post('/:id/reclassify', async (req: Request, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const profileId = req.params.id;

  try {
    // Fetch current profile
    const { data: profile, error: fetchError } = await req.supabase
      .from('company_profiles')
      .select('context')
      .eq('id', profileId)
      .single();

    if (fetchError || !profile) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    // Validate context
    const validation = validateContext(profile.context);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Profile context is incomplete, cannot reclassify',
        missing: validation.missing
      });
    }

    // Load custom matrix
    const matrix = await loadScoringMatrix(req);

    // Re-classify
    const classification = classifyCompany(profile.context as ClassificationContext, matrix);

    // Update
    const { data, error } = await req.supabase
      .from('company_profiles')
      .update({ classification })
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      console.error('Error reclassifying profile:', error);
      return res.status(500).json({ error: 'Failed to reclassify' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error reclassifying company profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// DELETE /api/company-profiles/:id
// Delete a company profile
// ============================================

router.delete('/:id', async (req: Request, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const profileId = req.params.id;

  try {
    const { error } = await req.supabase
      .from('company_profiles')
      .delete()
      .eq('id', profileId);

    if (error) {
      console.error('Error deleting company profile:', error);
      return res.status(500).json({ error: 'Failed to delete company profile' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting company profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /api/company-profiles/personas
// Get all persona definitions (public)
// ============================================

router.get('/meta/personas', (_req: Request, res: Response) => {
  res.json(getAllPersonas());
});

// ============================================
// GET /api/company-profiles/matrix
// Get current scoring matrix (for debugging)
// ============================================

router.get('/meta/matrix', async (req: Request, res: Response) => {
  const matrix = await loadScoringMatrix(req);
  res.json(matrix || getDefaultScoringMatrix());
});

export default router;
