import { addMonths, isAfter, isBefore, startOfDay } from 'date-fns';

export type FormationStatus = 'Valide' | 'À renouveler' | 'Expirée';

export function getFormationStatus(expirationDate: Date | null): FormationStatus {
  if (!expirationDate) return 'Valide';
  
  const today = startOfDay(new Date());
  const expDate = new Date(expirationDate);
  const oneMonthBefore = addMonths(expDate, -1);
  
  if (isAfter(today, expDate)) {
    return 'Expirée';
  } else if (isAfter(today, oneMonthBefore)) {
    return 'À renouveler';
  }
  return 'Valide';
}

export function getUtilisateurStatus(formations: { date_expiration: Date | null }[]): FormationStatus {
  const statuses = formations.map(f => getFormationStatus(f.date_expiration));
  
  if (statuses.some(s => s === 'Expirée')) {
    return 'Expirée';
  } else if (statuses.some(s => s === 'À renouveler')) {
    return 'À renouveler';
  }
  return 'Valide';
}

export function getEquipeStatus(utilisateurs: { formations: { date_expiration: Date | null }[] }[]): FormationStatus {
  const statuses = utilisateurs.map(u => getUtilisateurStatus(u.formations));
  
  if (statuses.some(s => s === 'Expirée')) {
    return 'Expirée';
  } else if (statuses.some(s => s === 'À renouveler')) {
    return 'À renouveler';
  }
  return 'Valide';
} 