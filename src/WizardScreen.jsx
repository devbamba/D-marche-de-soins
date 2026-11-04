import { useEffect, useState } from "react";
import { FormScreens } from "./FormScreens.jsx";

export function WizardScreen({ steps, formProps, actions, onStepChange }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState(formProps.data);

  useEffect(() => {
    const handleStepChange = event => setCurrentStep(event.detail.index);
    const handleDataChange = event => setData(event.detail.data);
    window.addEventListener("demarche:wizard-step", handleStepChange);
    window.addEventListener("demarche:data-updated", handleDataChange);
    return () => {
      window.removeEventListener("demarche:wizard-step", handleStepChange);
      window.removeEventListener("demarche:data-updated", handleDataChange);
    };
  }, []);

  const filledNeeds = () => formProps.needs.filter(([id]) =>
    formProps.aspects.some(aspect =>
      formProps.columns.some(column => String(data[`${id}_${aspect[0]}_${column[0]}`] || "").trim())
    )
  );
  const selectedNeeds = Array.from({ length: Math.min(Math.max(Number.parseInt(data.nonsat_n, 10) || 1, 1), 30) }, (_, index) => index)
    .filter(index => data[`nonsat_${index}_besoin`]);
  const missingObjectives = selectedNeeds.filter(index => !String(data[`obj_${index}_txt`] || "").trim()).length;
  const interventionCount = selectedNeeds.filter(index => String(data[`int_${index}_txt`] || "").trim()).length;
  const patient = [data.prenom, data.nom].map(value => String(value || "").trim()).filter(Boolean).join(" ");
  const requiredMissing = formProps.schema.flatMap(section => section.f).filter(field => field.req && !data[field.id]).length;

  return (
    <div className="wizard">
      <nav className="wizard-stepper" aria-label="Étapes de la démarche">
        {steps.map((step, index) => (
          <button
            type="button"
            className={`wizard-step-button${index === currentStep ? " is-current" : ""}${index < currentStep ? " is-complete" : ""}`}
            aria-current={index === currentStep ? "step" : undefined}
            key={step.title}
            onClick={() => onStepChange(index)}
          >
            <span className="wizard-step-number">{index + 1}</span>
            <span className="wizard-step-label">{step.title}</span>
          </button>
        ))}
      </nav>
      <div className="wizard-stages">
        {steps.map((step, index) => (
          <section
            className={`wizard-stage${index === currentStep ? "" : " hidden"}`}
            data-wizard-step={index}
            aria-labelledby={`wizard-title-${index}`}
            hidden={index !== currentStep}
            key={step.title}
          >
            <div className="wizard-stage-heading">
              <p>Étape {index + 1} sur {steps.length}</p>
              <h2 id={`wizard-title-${index}`}>{step.title}</h2>
              <span>{step.description}</span>
            </div>
            {index === 3 && (
              <>
                <section className="wizard-review" aria-labelledby="wizard-review-title">
                  <h3 id="wizard-review-title">Récapitulatif du dossier</h3>
                  <dl data-wizard-review>
                    {[
                      ["Patient", patient || "À renseigner", !patient],
                      ["Champs obligatoires manquants", String(requiredMissing), requiredMissing > 0],
                      ["Besoins fondamentaux documentés", `${filledNeeds().length} / ${formProps.needs.length}`, false],
                      ["Besoins non satisfaits retenus", String(selectedNeeds.length), false],
                      ["Objectifs restant à formuler", String(missingObjectives), missingObjectives > 0],
                      ["Besoins avec interventions", `${interventionCount} / ${selectedNeeds.length}`, interventionCount < selectedNeeds.length],
                    ].map(([label, value, attention]) => (
                      <div className="wizard-review-item" key={label}>
                        <dt>{label}</dt><dd className={attention ? "needs-attention" : ""}>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
                <div className="wizard-finish-note">
                  <strong>Votre démarche est prête à être relue.</strong>
                  <span>Enregistrez le dossier dans ce navigateur ou ouvrez l’aperçu pour l’imprimer ou l’enregistrer en PDF.</span>
                </div>
                <div className="actions wizard-actions">{actions}</div>
              </>
            )}
            <FormScreens {...formProps} data={data} stage={index} />
            <div className="wizard-controls">
              <button
                type="button"
                className="btn alt wizard-previous"
                disabled={index === 0}
                onClick={() => onStepChange(currentStep - 1)}
              >
                ← Précédent
              </button>
              {index < steps.length - 1 && (
                <button
                  type="button"
                  className="btn wizard-next"
                  onClick={() => onStepChange(currentStep + 1)}
                >
                  Continuer →
                </button>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
