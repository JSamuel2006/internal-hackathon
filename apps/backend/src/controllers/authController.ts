import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository.js';
import { env } from '../configuration/environment.js';
import { verifyProfessionalIdentity } from '../services/verificationService.js';
import { UserRole } from '../database/models/userModel.js';

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

export async function handleVerifyId(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountType, professionalId } = req.body;
    if (!accountType || !professionalId) {
      return res.status(400).json({ success: false, error: 'Account type and professional ID are required.' });
    }

    const result = verifyProfessionalIdentity(accountType, professionalId);
    if (!result.verified) {
      return res.status(422).json({ success: false, verified: false, error: result.error });
    }

    // Check if ID is already registered to another user
    const existingUser = await userRepository.findByProfessionalId(professionalId);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        verified: false,
        error: `This ${accountType} ID is already associated with an existing account.`
      });
    }

    return res.status(200).json({
      success: true,
      verified: true,
      registryName: 'Authorized Prototype Registry',
      data: result.record
    });
  } catch (error) {
    next(error);
  }
}

export async function handleRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, accountType = 'CITIZEN', professionalId, jurisdiction, abhaId, password } = req.body;

    // Security Check: Public registration of ADMIN accounts is strictly forbidden
    if (accountType.toUpperCase() === 'ADMIN' || req.body.role === 'ROLE_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Public registration of Administrator accounts is strictly prohibited.'
      });
    }

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Full name and email are required.' });
    }

    // Duplicate Email Check
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'A user with this email address is already registered. Please Sign In instead.'
      });
    }

    let finalRole: UserRole = 'ROLE_CITIZEN';
    let assignedJurisdiction = jurisdiction ? jurisdiction.trim() : undefined;
    let verifiedProfId: string | undefined = undefined;

    // Perform Backend-Enforced Identity Verification for Professional Roles
    const typeUpper = accountType.toUpperCase().trim();
    if (typeUpper === 'DOCTOR' || typeUpper === 'ASHA' || typeUpper === 'WORKER' || typeUpper === 'OFFICER') {
      if (!professionalId || !professionalId.trim()) {
        return res.status(400).json({
          success: false,
          error: `Professional ID is required for ${accountType} account creation.`
        });
      }

      // Check if professional ID is already registered
      const existingProfUser = await userRepository.findByProfessionalId(professionalId.trim());
      if (existingProfUser) {
        return res.status(409).json({
          success: false,
          error: `This ${accountType} ID (${professionalId.trim()}) is already associated with an existing account.`
        });
      }

      const verifResult = verifyProfessionalIdentity(typeUpper, professionalId);
      if (!verifResult.verified || !verifResult.role) {
        return res.status(422).json({
          success: false,
          error: verifResult.error || `Professional identity could not be verified in the Authorized Prototype Registry.`
        });
      }

      finalRole = verifResult.role;
      verifiedProfId = professionalId.trim().toUpperCase();
      if (verifResult.record?.jurisdiction) {
        assignedJurisdiction = verifResult.record.jurisdiction;
      }
    } else {
      finalRole = 'ROLE_CITIZEN';
    }

    const user = await userRepository.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: finalRole,
      jurisdiction: assignedJurisdiction,
      professionalId: verifiedProfId,
      abhaId: abhaId ? abhaId.trim() : `ABHA-91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    const token = jwt.sign(
      { sub: user.id, name: user.name, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          jurisdiction: user.jurisdiction,
          professionalId: user.professionalId,
          abhaId: user.abhaId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
