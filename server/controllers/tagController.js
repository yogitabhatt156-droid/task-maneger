/**
 * GET /api/tags
 * Retrieve all unique tags for the user
 */
const getTags = async (req, res, next) => {
  try {
    if (req.isDemo) {
      return res.status(200).json({
        success: true,
        data: ['Architecture', 'API', 'Security', 'UI/UX', 'CSS', 'Billing', 'Cloud', 'Database', 'Postgres'],
      });
    }

    const { data, error } = await req.supabase
      .from('tags')
      .select('name')
      .order('name', { ascending: true });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const tagNames = (data || []).map((t) => t.name);

    return res.status(200).json({
      success: true,
      data: tagNames,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTags,
};
