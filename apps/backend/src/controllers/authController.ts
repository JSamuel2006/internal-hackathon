import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository.js';
import { env } from '../configuration/environment.js';

export async function handleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, role = 'ROLE_OFFICER', name } = req.body;

    let user = await userRepository.findByEmail(email || 'officer.pune@mohfw.gov.in');
    if (!user) {
      user = await userRepository.createUser({
        name: name || 'Public Health Officer',
        email: email || `officer-${Date.now()}@mohfw.gov.in`,
        role,
        jurisdiction: role === 'ROLE_OFFICER' ? 'Pune District' : undefined,
        abhaId: 'ABHA-91-8842-1029-4410',
      });
    }

    const token = jwt.sign(
      { sub: user.id, name: user.name, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          jurisdiction: user.jurisdiction,
          abhaId: user.abhaId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userRepository.findById('usr-901');
    return res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
}


export async function handleRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, role = 'ROLE_CITIZEN', jurisdiction, abhaId } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required for registration.' });
    }
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'A user with this email address is already registered.' });
    }
    const user = await userRepository.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role || 'ROLE_CITIZEN',
      jurisdiction: jurisdiction ? jurisdiction.trim() : undefined,
      abhaId: abhaId ? abhaId.trim() : 'ABHA-91-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000),
    });
    const token = jwt.sign(
      { sub: user.id, name: user.name, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, jurisdiction: user.jurisdiction, abhaId: user.abhaId } }
    });
  } catch (error) {
    next(error);
  }
}
