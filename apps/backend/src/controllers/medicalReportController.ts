import { Request, Response } from 'express';
import { medicalReportService } from '../services/medicalReportService.js';

export async function handleGetHistory(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 'usr-901';
    const history = await medicalReportService.getHistory(userId);
    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch report history.'
    });
  }
}

export async function handleGetReportById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const report = await medicalReportService.getReportById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.'
      });
    }
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch report.'
    });
  }
}

export async function handleDeleteReport(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const deleted = await medicalReportService.deleteReport(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or delete failed.'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Report deleted successfully.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete report.'
    });
  }
}

export async function handleGetTrends(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 'usr-901';
    const trends = await medicalReportService.getTrends(userId);
    return res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch trends.'
    });
  }
}

export async function handleCompareReports(req: Request, res: Response) {
  try {
    const { currentId, previousId } = req.body;
    const comparison = await medicalReportService.compareReports(currentId, previousId);
    return res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to compare reports.'
    });
  }
}

export async function handleGetOverallHealthScore(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 'usr-901';
    const overallScore = await medicalReportService.getOverallHealthScore(userId);
    return res.status(200).json({
      success: true,
      data: overallScore
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate overall health score.'
    });
  }
}
