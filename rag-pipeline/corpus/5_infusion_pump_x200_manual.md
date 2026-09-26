---
document_id: DOC-DEV-X200
title: InfuSure X200 Volumetric Infusion Pump Operator Manual
category: device_manual
version: "3.1"
status: active
effective_from: 2024-11-01
effective_to:
supersedes:
department: Biomedical Engineering
classification: internal
owner: Biomedical Engineering (synthetic manufacturer: InfuSure Medical, fictional)
---

# InfuSure X200 Volumetric Infusion Pump Operator Manual

> SYNTHETIC DOCUMENT — FOR DEMONSTRATION ONLY. InfuSure and the X200 are
> fictional products.

## 1. Device Overview

The InfuSure X200 is a single-channel volumetric infusion pump for continuous
and intermittent intravenous infusions at rates from 0.1 to 999 mL/h. It
includes a drug library with hard and soft dose limits maintained by Pharmacy
and Biomedical Engineering.

## 2. Programming an Infusion

### 2.1 Drug Library Selection

Always select the medication from the drug library. Infusions programmed in
"basic mode" bypass dose-error reduction limits and must be justified in the
nursing record.

### 2.2 Vancomycin Library Entry

The vancomycin library entry enforces a hard maximum rate limit of 10 mg/min.
Attempting to program a faster rate produces alarm ERR-221 (Hard limit
exceeded) and the infusion cannot be started.

## 3. Alarm and Error Codes

### 3.1 ERR-404 Downstream Occlusion

ERR-404 indicates a downstream occlusion: the pump has detected pressure above
the occlusion threshold between the pump and the patient. The infusion stops
automatically. To resolve ERR-404: check that the roller clamp and any
stopcocks are open, inspect the line for kinks, check the cannula site for
infiltration, then press RESUME. If ERR-404 recurs three times within 15
minutes, remove the pump from service and report it to Biomedical Engineering.

### 3.2 ERR-221 Hard Limit Exceeded

ERR-221 indicates that the programmed rate or dose exceeds a hard limit in the
drug library. Reprogram within the permitted range. Hard limits cannot be
overridden at the bedside.

### 3.3 ERR-310 Air-in-Line

ERR-310 indicates air detected in the line above the sensor threshold of 50
microlitres. Close the clamp, remove the air using the approved priming
procedure and restart the infusion.

### 3.4 ERR-505 Battery Critical

ERR-505 indicates less than 10 minutes of battery power remaining. Connect the
pump to mains power immediately.

## 4. Maintenance

### 4.1 Preventive Maintenance

Biomedical Engineering performs preventive maintenance every 12 months,
including occlusion pressure calibration and battery capacity testing.

### 4.2 Cleaning

Clean the pump housing between patients with a hospital-approved detergent
wipe. Do not immerse the pump or spray liquid into the door mechanism.

## 5. Incident Reporting

Any pump malfunction associated with patient harm must be quarantined with the
administration set attached and reported as an adverse event within 24 hours.
