import type { FlavorSelectorProps } from '../types/components';
import type { FlavorLevel } from '../types/recipe';
import { selectFlavorLevel, toggleFlavorInclusion } from '../services/flavorSelection';
import flavors from '../../data/flavors.json' with { type: 'json' };
import groups from '../../data/flavor_groups.json' with { type: 'json' };

const levels: FlavorLevel[] = [1, 2, 3, 4, 5];

function FlavorOption({ id, query, onChange }: FlavorSelectorProps & { id: string }) {
  const name = flavors.find((flavor) => flavor.id === id)?.name ?? id;
  const active = query.flavors.includes(id);
  const level = active ? query.flavorLevels?.[id] : undefined;
  const choose = (value?: FlavorLevel) => onChange(selectFlavorLevel(query, id, value));
  const included = active && level === undefined;
  return (
    <div className={'flavor-option' + (active ? ' selected' : '')}>
      <button
        type="button"
        className="flavor-card-select"
        aria-label={name + ' 맛 포함 선택 (별 0개, 강도 제한 없음)'}
        aria-pressed={included}
        onClick={() => onChange(toggleFlavorInclusion(query, id))}
      />
      <div className="flavor-option-heading">
        <span className="flavor-toggle">
          <span className="flavor-toggle-mark" aria-hidden="true">
            {active ? '✓' : '+'}
          </span>
          {name}
        </span>
        {level && <span className="flavor-level-value">{level}/5</span>}
      </div>
      <div className="flavor-level-input" role="group" aria-label={name + ' 맛 강도 선택'}>
        {levels.map((value) => (
          <button
            key={value}
            type="button"
            className={'flavor-star-button' + (value <= (level ?? 0) ? ' filled' : '')}
            aria-label={name + ' 맛 강도 ' + value + '/5 선택'}
            aria-pressed={level === value}
            onClick={() => choose(value)}
          >
            <span aria-hidden="true">{value <= (level ?? 0) ? '★' : '☆'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** 맛과 원하는 강도를 함께 선택한다. */
export function FlavorSelector({ query, onChange }: FlavorSelectorProps) {
  return (
    <div className="flavor-groups" aria-describedby="flavor-help">
      {groups.map((group) => (
        <div
          className="flavor-group"
          key={group.id}
          role="group"
          aria-labelledby={'flavor-group-' + group.id}
        >
          <h3 id={'flavor-group-' + group.id}>{group.name}</h3>
          <div className="flavor-options">
            {group.flavors.map((id) => (
              <FlavorOption key={id} id={id} query={query} onChange={onChange} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
