import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as clientsService from './clients.service';

export const listClients = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clients = await clientsService.getAllClients();
    res.json({ success: true, data: clients });
  } catch (err) {
    next(err);
  }
};

export const getClient = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const client = await clientsService.getClientById(req.params.id as string);
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

export const createClient = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const client = await clientsService.createClient(req.body);
    res.status(201).json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

export const updateClient = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const client = await clientsService.updateClient(req.params.id as string, req.body);
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

export const deleteClient = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await clientsService.deleteClient(req.params.id as string);
    res.json({ success: true, message: 'Client deleted' });
  } catch (err) {
    next(err);
  }
};
