import type { FlavorSelectorProps } from '../types/components';
import flavors from '../../data/flavors.json' with { type: 'json' };
import groups from '../../data/flavor_groups.json' with { type: 'json' };

/** 맛 선택 */
export function FlavorSelector({ selected, onChange }: FlavorSelectorProps) {
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
          <div className="flavors">
            {group.flavors.map((id) => {
              const flavor = flavors.find((item) => item.id === id);
              const isUnknownFlavor = !flavor;
              if (isUnknownFlavor) return null;
              const active = selected.includes(id);
              return (
                <button
                  type="button"
                  key={id}
                  className={'flavor' + (active ? ' selected' : '')}
                  aria-pressed={active}
                  onClick={() =>
                    onChange(active ? selected.filter((value) => value !== id) : [...selected, id])
                  }
                >
                  {flavor.name}
                  {active && (
                    <span className="flavor-check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
