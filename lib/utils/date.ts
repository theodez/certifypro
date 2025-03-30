/**
 * Formatte une date au format lisible français
 * @param date - Date à formater
 * @returns Date au format DD/MM/YYYY
 */
export function formatDate(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return "Date invalide";
  }
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

/**
 * Formatte une heure au format lisible
 * @param date - Date contenant l'heure à formater
 * @returns Heure au format HH:MM
 */
export function formatTime(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return "Heure invalide";
  }
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Calcule et formatte la durée relative entre la date donnée et maintenant
 * @param date - Date à comparer
 * @returns Chaîne décrivant la durée relative (ex: "il y a 3 jours")
 */
export function formatRelativeTime(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return "Date invalide";
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Si c'est dans le futur
  if (diffInSeconds < 0) {
    const futureSeconds = Math.abs(diffInSeconds);
    if (futureSeconds < 60) return `dans ${futureSeconds} secondes`;
    if (futureSeconds < 3600) return `dans ${Math.floor(futureSeconds / 60)} minutes`;
    if (futureSeconds < 86400) return `dans ${Math.floor(futureSeconds / 3600)} heures`;
    if (futureSeconds < 2592000) return `dans ${Math.floor(futureSeconds / 86400)} jours`;
    if (futureSeconds < 31536000) return `dans ${Math.floor(futureSeconds / 2592000)} mois`;
    return `dans ${Math.floor(futureSeconds / 31536000)} ans`;
  }
  
  // Si c'est dans le passé
  if (diffInSeconds < 60) return "à l'instant";
  if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)} minutes`;
  if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)} heures`;
  if (diffInSeconds < 2592000) return `il y a ${Math.floor(diffInSeconds / 86400)} jours`;
  if (diffInSeconds < 31536000) return `il y a ${Math.floor(diffInSeconds / 2592000)} mois`;
  return `il y a ${Math.floor(diffInSeconds / 31536000)} ans`;
}

/**
 * Formate une date avec le nom du jour et du mois en toutes lettres
 * @param date - Date à formater
 * @returns Date au format "Lundi 1 Janvier 2023"
 */
export function formatLongDate(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return "Date invalide";
  }
  
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

/**
 * Vérifie si deux dates sont le même jour
 * @param date1 - Première date
 * @param date2 - Deuxième date
 * @returns true si les deux dates sont le même jour, false sinon
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime())) {
    return false;
  }
  
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
} 