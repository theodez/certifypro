import { PrismaClient } from '@prisma/client';

// PrismaClient est attaché au scope global en développement pour éviter d'épuiser 
// le nombre de connexions à la base de données lors du hot-reloading en développement
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma; 