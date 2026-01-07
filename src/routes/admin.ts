// VS-27b: Admin API Routes
// Protected routes for scoring matrix and target matrix management

import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import { getDefaultScoringMatrix } from '../classification/engine';
import { ScoringMatrix } from '../classification/types';
import { getDefaultTargetMatrix, validateTargetMatrix } from '../utils/targetCalculation';

const router = Router();

// Apply admin auth to all routes in this router
router.use(requireAdmin);

// ============================================
// GET /api/admin/check
// Simple admin status check
// ============================================

router.get('/check', (_req: Request, res: Response) => {
  res.json({ admin: true });
});

// ============================================
// GET /api/admin/scoring-matrix
// Get the active scoring matrix
// ============================================

router.get('/scoring-matrix', async (req: Request, res: Response) => {
  try {
    const { data, error } = await req.supabase
      .from('scoring_matrix')
      .select('*')
      .eq('active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching scoring matrix:', error);
      return res.status(500).json({ error: 'Failed to fetch scoring matrix' });
    }

    // Return custom matrix if exists, otherwise default
    res.json({
      matrix: data?.matrix || null,
      version: data?.version || null,
      isDefault: !data,
      defaultMatrix: getDefaultScoringMatrix()
    });
  } catch (err) {
    console.error('Error in scoring matrix fetch:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// POST /api/admin/scoring-matrix
// Save a new scoring matrix (deactivates previous)
// ============================================

router.post('/scoring-matrix', async (req: Request, res: Response) => {
  const { matrix } = req.body;

  if (!matrix) {
    return res.status(400).json({ error: 'Matrix data is required' });
  }

  // Basic validation
  if (!matrix.inputs || !Array.isArray(matrix.inputs)) {
    return res.status(400).json({ error: 'Matrix must have inputs array' });
  }

  try {
    // Get user email for audit
    const { data: { user } } = await req.supabase.auth.getUser();
    const createdBy = user?.email || 'admin';

    // Generate version string
    const version = `v${Date.now()}`;

    // Deactivate all existing matrices
    await req.supabase
      .from('scoring_matrix')
      .update({ active: false })
      .eq('active', true);

    // Insert new active matrix
    const { data, error } = await req.supabase
      .from('scoring_matrix')
      .insert({
        matrix: matrix as ScoringMatrix,
        version,
        active: true,
        created_by: createdBy
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving scoring matrix:', error);
      return res.status(500).json({ error: 'Failed to save scoring matrix' });
    }

    res.json({
      success: true,
      id: data.id,
      version: data.version,
      created_at: data.created_at
    });
  } catch (err) {
    console.error('Error saving scoring matrix:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /api/admin/scoring-matrix/history
// Get version history of scoring matrices
// ============================================

router.get('/scoring-matrix/history', async (req: Request, res: Response) => {
  try {
    const { data, error } = await req.supabase
      .from('scoring_matrix')
      .select('id, version, active, created_by, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching matrix history:', error);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }

    res.json({ history: data || [] });
  } catch (err) {
    console.error('Error in matrix history fetch:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /api/admin/scoring-matrix/:id
// Get a specific matrix version
// ============================================

router.get('/scoring-matrix/:id', async (req: Request, res: Response) => {
  const matrixId = req.params.id;

  try {
    const { data, error } = await req.supabase
      .from('scoring_matrix')
      .select('*')
      .eq('id', matrixId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Matrix not found' });
      }
      console.error('Error fetching matrix:', error);
      return res.status(500).json({ error: 'Failed to fetch matrix' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error fetching matrix:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// POST /api/admin/scoring-matrix/:id/activate
// Activate a specific matrix version
// ============================================

router.post('/scoring-matrix/:id/activate', async (req: Request, res: Response) => {
  const matrixId = req.params.id;

  try {
    // Verify matrix exists
    const { data: targetMatrix, error: fetchError } = await req.supabase
      .from('scoring_matrix')
      .select('id')
      .eq('id', matrixId)
      .single();

    if (fetchError || !targetMatrix) {
      return res.status(404).json({ error: 'Matrix not found' });
    }

    // Deactivate all
    await req.supabase
      .from('scoring_matrix')
      .update({ active: false })
      .eq('active', true);

    // Activate target
    const { error } = await req.supabase
      .from('scoring_matrix')
      .update({ active: true })
      .eq('id', matrixId);

    if (error) {
      console.error('Error activating matrix:', error);
      return res.status(500).json({ error: 'Failed to activate matrix' });
    }

    res.json({ success: true, activated: matrixId });
  } catch (err) {
    console.error('Error activating matrix:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// DELETE /api/admin/scoring-matrix/:id
// Delete a matrix version (cannot delete active)
// ============================================

router.delete('/scoring-matrix/:id', async (req: Request, res: Response) => {
  const matrixId = req.params.id;

  try {
    // Check if active
    const { data: matrix } = await req.supabase
      .from('scoring_matrix')
      .select('active')
      .eq('id', matrixId)
      .single();

    if (matrix?.active) {
      return res.status(400).json({ error: 'Cannot delete active matrix' });
    }

    const { error } = await req.supabase
      .from('scoring_matrix')
      .delete()
      .eq('id', matrixId);

    if (error) {
      console.error('Error deleting matrix:', error);
      return res.status(500).json({ error: 'Failed to delete matrix' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting matrix:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// POST /api/admin/reclassify-all
// Re-classify all company profiles (after matrix change)
// ============================================

router.post('/reclassify-all', async (req: Request, res: Response) => {
  try {
    // This is a heavy operation - use with caution
    // In production, this should be a background job

    // Get all company profiles
    const { data: profiles, error: fetchError } = await req.supabase
      .from('company_profiles')
      .select('id, context');

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch profiles' });
    }

    if (!profiles || profiles.length === 0) {
      return res.json({ success: true, reclassified: 0 });
    }

    // Import classification function
    const { classifyCompany, validateContext } = await import('../classification/engine');

    // Load custom matrix
    const { data: matrixData } = await req.supabase
      .from('scoring_matrix')
      .select('matrix')
      .eq('active', true)
      .single();

    const matrix = matrixData?.matrix as ScoringMatrix | undefined;

    let successCount = 0;
    let errorCount = 0;

    for (const profile of profiles) {
      const validation = validateContext(profile.context);
      if (!validation.valid) {
        errorCount++;
        continue;
      }

      const classification = classifyCompany(profile.context, matrix);

      const { error } = await req.supabase
        .from('company_profiles')
        .update({ classification })
        .eq('id', profile.id);

      if (error) {
        errorCount++;
      } else {
        successCount++;
      }
    }

    res.json({
      success: true,
      total: profiles.length,
      reclassified: successCount,
      errors: errorCount
    });
  } catch (err) {
    console.error('Error in reclassify-all:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// VS-27e: Target Matrix Admin Routes
// ============================================

// ============================================
// GET /api/admin/target-matrix
// Get the active target matrix or default
// ============================================

router.get('/target-matrix', async (req: Request, res: Response) => {
  try {
    const { data, error } = await req.supabase
      .from('target_matrix')
      .select('*')
      .eq('active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching target matrix:', error);
      return res.status(500).json({ error: 'Failed to fetch target matrix' });
    }

    // Return custom matrix if exists, otherwise default
    res.json({
      matrix: data?.matrix || null,
      version: data?.version || null,
      isDefault: !data,
      defaultMatrix: getDefaultTargetMatrix()
    });
  } catch (err) {
    console.error('Error in target matrix fetch:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// POST /api/admin/target-matrix
// Save a new target matrix (deactivates previous)
// ============================================

router.post('/target-matrix', async (req: Request, res: Response) => {
  const { matrix } = req.body;

  if (!matrix) {
    return res.status(400).json({ error: 'Matrix data is required' });
  }

  // Validate the matrix structure
  const validation = validateTargetMatrix(matrix);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Invalid target matrix',
      details: validation.errors
    });
  }

  try {
    // Get user email for audit
    const { data: { user } } = await req.supabase.auth.getUser();
    const createdBy = user?.email || 'admin';

    // Generate version string
    const version = `v${Date.now()}`;

    // Deactivate all existing matrices
    await req.supabase
      .from('target_matrix')
      .update({ active: false })
      .eq('active', true);

    // Insert new active matrix
    const { data, error } = await req.supabase
      .from('target_matrix')
      .insert({
        matrix,
        version,
        active: true,
        created_by: createdBy
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving target matrix:', error);
      return res.status(500).json({ error: 'Failed to save target matrix' });
    }

    res.json({
      success: true,
      id: data.id,
      version: data.version,
      created_at: data.created_at
    });
  } catch (err) {
    console.error('Error saving target matrix:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /api/admin/target-matrix/history
// Get version history of target matrices
// ============================================

router.get('/target-matrix/history', async (req: Request, res: Response) => {
  try {
    const { data, error } = await req.supabase
      .from('target_matrix')
      .select('id, version, active, created_by, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching target matrix history:', error);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }

    res.json({ history: data || [] });
  } catch (err) {
    console.error('Error in target matrix history fetch:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /api/admin/target-matrix/:id
// Get a specific target matrix version
// ============================================

router.get('/target-matrix/:id', async (req: Request, res: Response) => {
  const matrixId = req.params.id;

  try {
    const { data, error } = await req.supabase
      .from('target_matrix')
      .select('*')
      .eq('id', matrixId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Target matrix not found' });
      }
      console.error('Error fetching target matrix:', error);
      return res.status(500).json({ error: 'Failed to fetch target matrix' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error fetching target matrix:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// POST /api/admin/target-matrix/:id/activate
// Activate a specific target matrix version
// ============================================

router.post('/target-matrix/:id/activate', async (req: Request, res: Response) => {
  const matrixId = req.params.id;

  try {
    // Verify matrix exists
    const { data: targetMatrix, error: fetchError } = await req.supabase
      .from('target_matrix')
      .select('id')
      .eq('id', matrixId)
      .single();

    if (fetchError || !targetMatrix) {
      return res.status(404).json({ error: 'Target matrix not found' });
    }

    // Deactivate all
    await req.supabase
      .from('target_matrix')
      .update({ active: false })
      .eq('active', true);

    // Activate target
    const { error } = await req.supabase
      .from('target_matrix')
      .update({ active: true })
      .eq('id', matrixId);

    if (error) {
      console.error('Error activating target matrix:', error);
      return res.status(500).json({ error: 'Failed to activate target matrix' });
    }

    res.json({ success: true, activated: matrixId });
  } catch (err) {
    console.error('Error activating target matrix:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// DELETE /api/admin/target-matrix/:id
// Delete a target matrix version (cannot delete active)
// ============================================

router.delete('/target-matrix/:id', async (req: Request, res: Response) => {
  const matrixId = req.params.id;

  try {
    // Check if active
    const { data: matrix } = await req.supabase
      .from('target_matrix')
      .select('active')
      .eq('id', matrixId)
      .single();

    if (matrix?.active) {
      return res.status(400).json({ error: 'Cannot delete active target matrix' });
    }

    const { error } = await req.supabase
      .from('target_matrix')
      .delete()
      .eq('id', matrixId);

    if (error) {
      console.error('Error deleting target matrix:', error);
      return res.status(500).json({ error: 'Failed to delete target matrix' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting target matrix:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
