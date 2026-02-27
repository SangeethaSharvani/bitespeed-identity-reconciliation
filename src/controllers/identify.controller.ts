import { Request, Response } from "express";
import { IdentifyService } from "../services/identify.service";

export const identify = async (req: Request, res: Response) => {
  try {
    const result = await IdentifyService.identify(req.body);

    res.status(200).json({
      contact: result,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
    });
  }
};