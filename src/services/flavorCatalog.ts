import { catalogRepository } from '../repositories/catalogRepository.ts';
export const flavors = catalogRepository.flavors;
export const flavorGroups = catalogRepository.flavorGroups;
const flavorNames = new Map(flavors.map(({ id, name }) => [id, name]));
export const getFlavorName = (id: string): string => flavorNames.get(id) ?? id;

export const FLAVOR_IDS = new Set(flavors.map(({ id }) => id));
