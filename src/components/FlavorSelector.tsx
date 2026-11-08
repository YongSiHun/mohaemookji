import { useState } from 'react';
import type { FlavorSelectorProps } from '../types/components';
import type { FlavorLevel } from '../types/recipe';
import { selectFlavorLevel, toggleFlavorInclusion } from '../services/flavorSelection';
import { getFlavorName } from '../services/flavorCatalog';
import { flavorGroups as groups } from '../services/flavorCatalog';

const levels: FlavorLevel[] = [1, 2, 3, 4, 5];

function FlavorStars({
  name,
  level,
  displayLevel,
  onHover,
  onChoose,
}: {
  name: string;
  level?: FlavorLevel;
  displayLevel?: FlavorLevel;
  onHover: (value?: FlavorLevel) => void;
  onChoose: (value: FlavorLevel) => void;
}) {
  return (
    <div
      className="flavor-level-input"
      role="group"
      aria-label={name + ' 맛 강도 선택'}
      onMouseLeave={() => onHover(undefined)}
    >
      {levels.map((value) => {
        const filled = value <= (displayLevel ?? 0);
        return (
          <button
            key={value}
            type="button"
            className={'flavor-star-button' + (filled ? ' filled' : '')}
            aria-label={name + ' 맛 강도 ' + value + '/5 선택'}
            aria-pressed={level === value}
            onMouseEnter={() => onHover(value)}
            onClick={() => onChoose(value)}
          >
            <span aria-hidden="true">{filled ? '★' : '☆'}</span>
          </button>
        );
      })}
    </div>
  );
}

function FlavorToggleMark({ active }: { active: boolean }) {
  return (
    <span className="flavor-toggle-mark" aria-hidden="true">
      {active ? '✓' : '+'}
    </span>
  );
}

function FlavorOption({ id, query, onChange }: FlavorSelectorProps & { id: string }) {
  const [hoveredLevel, setHoveredLevel] = useState<FlavorLevel>();
  const name = getFlavorName(id);
  const active = query.flavors.includes(id);
  const level = active ? query.flavorLevels?.[id] : undefined;
  const displayLevel = hoveredLevel ?? level;
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
          <FlavorToggleMark active={active} />
          {name}
        </span>
        {displayLevel && <span className="flavor-level-value">{displayLevel}/5</span>}
      </div>
      <FlavorStars
        name={name}
        level={level}
        displayLevel={displayLevel}
        onHover={setHoveredLevel}
        onChoose={choose}
      />
    </div>
  );
}

/** 맛·강도 선택 */
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
