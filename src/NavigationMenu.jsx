import { useState } from "react";

const groups = [
  {
    id: "records",
    title: "Dossiers",
    items: [{ label: "Mes dossiers enregistrés", view: "records" }]
  },
  {
    id: "collection",
    title: "Recueil de données",
    items: [
      { label: "Renseignements généraux", go: "general" },
      { label: "Données sur les 14 besoins fondamentaux", go: "needs" }
    ]
  },
  {
    id: "analysis",
    title: "Analyse",
    items: [
      { label: "Besoins non satisfaits", go: "nonsat-sec" },
      { label: "Relation entre les éléments", go: "relation-sec" },
      { label: "Diagnostics infirmiers", go: "diagnostics-sec" }
    ]
  },
  {
    id: "planning",
    title: "Planification",
    items: [
      { label: "Objectifs de soins", go: "objectifs-sec" },
      { label: "Interventions infirmières", go: "interventions-sec" },
      { label: "Problèmes médicaux", go: "pm-sec" },
      { label: "Plan de soins", go: "plan-sec" }
    ]
  },
  {
    id: "help",
    title: "Aide",
    items: [{ label: "Documentation", go: "documentation" }]
  }
];

export function NavigationMenu() {
  const [openGroup, setOpenGroup] = useState(null);
  const [hoveredGroup, setHoveredGroup] = useState(null);

  function handlePointerEnter(id, event) {
    if (event.pointerType !== "mouse") return;
    setHoveredGroup(id);
    setOpenGroup(id);
  }

  function handlePointerLeave(id, event) {
    if (event.pointerType !== "mouse") return;
    setHoveredGroup(current => current === id ? null : current);
    setOpenGroup(current => current === id ? null : current);
  }

  function handleToggle(id, event) {
    if (event.detail > 0 && hoveredGroup === id) return;
    setHoveredGroup(null);
    setOpenGroup(current => current === id ? null : id);
  }

  return (
    <div className="menu-panel">
      {groups.map(group => {
        const expanded = openGroup === group.id;
        const submenuId = `menu-submenu-${group.id}`;
        return (
          <section
            className="menu-section"
            key={group.id}
            onPointerEnter={event => handlePointerEnter(group.id, event)}
            onPointerLeave={event => handlePointerLeave(group.id, event)}
          >
            <button
              type="button"
              className="menu-group-toggle"
              aria-expanded={expanded}
              aria-controls={submenuId}
              onClick={event => handleToggle(group.id, event)}
            >
              <span>{group.title}</span>
              <span className="menu-chevron" aria-hidden="true" />
            </button>
            <div
              className={`menu-submenu${expanded ? " is-open" : ""}`}
              id={submenuId}
              aria-hidden={!expanded}
              inert={!expanded}
            >
              {group.items.map(item => (
                <button
                  type="button"
                  className="menu-item"
                  key={item.label}
                  data-view={item.view}
                  data-go={item.go}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
