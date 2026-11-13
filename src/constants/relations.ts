export type Relation = 'famille' | 'ami' | 'partenaire' | 'collegue' | 'autre';

export const RELATIONS: Relation[] = ['famille', 'ami', 'partenaire', 'collegue', 'autre'];

export const RELATION_LABELS: Record<Relation, string> = {
  famille: 'Famille',
  ami: 'Ami(e)',
  partenaire: 'Partenaire',
  collegue: 'Collègue',
  autre: 'Autre',
};

export function isRelation(value: unknown): value is Relation {
  return typeof value === 'string' && (RELATIONS as string[]).includes(value);
}
