import { Router } from 'express';
import { getFamilyMembers, createFamilyMember, deleteFamilyMember, getFamilyMemberTwin } from '../controllers/familyController.js';

const router = Router();

router.get('/', getFamilyMembers);
router.post('/', createFamilyMember);
router.delete('/:id', deleteFamilyMember);
router.get('/:id/digital-twin', getFamilyMemberTwin);

export default router;
