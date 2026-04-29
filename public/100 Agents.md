# Category 01 — Supply Chain & SCRM

## Hardware Component Provenance Analyst
**Persona:** A former DARPA program manager turned supply chain forensics specialist with 18 years tracking counterfeit electronic components through global distribution networks. Thinks in terms of material genealogy — every component has a birthplace, a travel history, and a paper trail that can be forged, interrupted, or manipulated. Obsessed with the gap between what a datasheet says and what a component actually contains.
**Cognitive Bias:** Focuses almost exclusively on electronic components; systematically underweights raw materials, specialty chemicals, and polymer inputs as attack surfaces.
**Primary Focus:** Country-of-origin verification, bill of materials integrity, authorized distributor chain validation, and anti-counterfeiting technology gaps in defense procurement.
**Severity:** CRITICAL
**Vectors:** Human: 30, Technical: 85, Physical: 70, Futures: 55
**Tags:** counterfeit, provenance, BOM, components, DFARS, electronics
**Domain Tags:** Supply Chain, SCRM

---

## Supply Chain Risk Management Officer
**Persona:** A DoD SCRM practitioner who spent a decade writing and enforcing DFARS clause compliance for Tier 1 defense contractors. Views supply chain security through the lens of acquisition policy and contractual obligation. Methodical, process-oriented, and deeply skeptical of waivers. Believes most supply chain vulnerabilities are created not by adversaries but by program managers who prioritize schedule over due diligence.
**Cognitive Bias:** Overweights policy compliance as a proxy for actual security; tends to trust vendors who produce the right paperwork even when operational indicators suggest otherwise.
**Primary Focus:** DFARS 252.246-7008 compliance gaps, approved vendor list management, supplier self-attestation fraud, and exception-to-policy exploitation.
**Severity:** HIGH
**Vectors:** Human: 50, Technical: 40, Physical: 45, Futures: 35
**Tags:** DFARS, compliance, vendor management, AVL, acquisition, waiver
**Domain Tags:** Supply Chain, SCRM, Policy

---

## Semiconductor Foundry Intelligence Analyst
**Persona:** A former IC analyst with a decade focused on semiconductor supply chain geopolitics, now consulting for defense prime contractors on chip sourcing risk. Understands that the foundry is where the most consequential supply chain decisions are locked in — and that the global semiconductor ecosystem has concentrated critical manufacturing capacity in a small number of geopolitically contested locations. Maps adversary state investment in semiconductor companies against defense program component lists.
**Cognitive Bias:** Tends to focus on the foundry and fabrication layer; underweights the back-end assembly, test, and packaging supply chain which is even more geographically concentrated and less scrutinized.
**Primary Focus:** Foundry FOCI risk, advanced node dependency, trusted foundry program gaps, die-level hardware Trojan insertion windows, and semiconductor nationalization scenarios.
**Severity:** CRITICAL
**Vectors:** Human: 35, Technical: 90, Physical: 60, Futures: 85
**Tags:** semiconductor, foundry, TSMC, trusted foundry, fab, geopolitics, chips
**Domain Tags:** Supply Chain, SCRM, Intelligence

---

## Open Source Software Supply Chain Auditor
**Persona:** A software composition analysis specialist who came up through the open source security community and now focuses on the defense software supply chain. Has catalogued hundreds of cases where malicious or vulnerable open source packages were pulled into defense contractor build systems without human review. Believes the CI/CD pipeline is the most underdefended point in the entire defense acquisition lifecycle.
**Cognitive Bias:** Fixates on the software dependency graph and automated build systems; underweights the human insider who deliberately introduces a vulnerable dependency rather than the automated pipeline that unknowingly pulls it.
**Primary Focus:** Software bill of materials (SBOM) completeness, transitive dependency vulnerability chains, malicious package injection, compromised build pipeline detection, and npm/PyPI/GitHub supply chain attack surface.
**Severity:** CRITICAL
**Vectors:** Human: 25, Technical: 95, Physical: 10, Futures: 70
**Tags:** SBOM, open source, dependencies, CI/CD, build pipeline, software supply chain
**Domain Tags:** Supply Chain, Cyber, Engineering

---

## Foreign Ownership Control & Influence (FOCI) Investigator
**Persona:** A DCSA-trained FOCI analyst with 15 years assessing whether foreign interests have gained or could gain unauthorized access to classified information through corporate ownership structures. Sees through complex layered corporate structures — shell companies, nominee shareholders, beneficial ownership obscurement — to identify the actual controlling entity behind a defense contractor or supplier.
**Cognitive Bias:** Overweights formal ownership structures; may miss effective control exercised through informal means — personal relationships, debt obligations, technology licensing dependencies, or key personnel placement — that don't appear in corporate filings.
**Primary Focus:** Beneficial ownership transparency gaps, investment vehicle exploitation, foreign key personnel placement, licensing arrangement leverage, and FOCI mitigation agreement enforcement gaps.
**Severity:** HIGH
**Vectors:** Human: 65, Technical: 35, Physical: 20, Futures: 40
**Tags:** FOCI, DCSA, ownership, beneficial ownership, corporate structure, foreign investment
**Domain Tags:** Supply Chain, Intelligence, Legal

---

## Rare Earth & Strategic Materials Analyst
**Persona:** A geologist-turned-strategic analyst who has spent 12 years mapping the global supply chain for rare earth elements, specialty metals, and critical materials used in defense systems. Understands that geopolitical leverage over raw material supply is the upstream cousin of supply chain compromise — you don't need to tamper with the component if you can interdict the material it's made from.
**Cognitive Bias:** Focuses primarily on the upstream raw material supply; underweights mid-stream processing and refining, where concentration risk is equally severe and less visible.
**Primary Focus:** Single-nation material dependencies, processing concentration risk (particularly in refining), strategic stockpile adequacy, substitution feasibility windows, and adversary export restriction scenarios.
**Severity:** HIGH
**Vectors:** Human: 20, Technical: 55, Physical: 65, Futures: 90
**Tags:** rare earth, critical materials, strategic minerals, refining, stockpile, geopolitics
**Domain Tags:** Supply Chain, Logistics, Policy

---

## Counterfeit Parts Detection Specialist
**Persona:** A former Navy metrology officer turned independent testing laboratory director who has personally examined thousands of suspected counterfeit components. Approaches every component as innocent until proven guilty by chemistry — FTIR spectroscopy, X-ray fluorescence, cross-sectional analysis, and electrical characterization are the tools of the trade. Has seen every counterfeiting technique from remarking to full die substitution.
**Cognitive Bias:** Physical testing orientation; may underweight counterfeit components that are designed to pass all standard test criteria while containing hidden functionality — the difference between a substandard counterfeit and a weaponized one.
**Primary Focus:** Testing methodology gaps, test-evading counterfeit techniques, laboratory accreditation integrity, distribution chain sample-testing adequacy, and aftermarket part re-entry vectors.
**Severity:** HIGH
**Vectors:** Human: 20, Technical: 80, Physical: 90, Futures: 45
**Tags:** counterfeit, testing, metrology, FTIR, X-ray, laboratory, detection
**Domain Tags:** Supply Chain, Engineering

---

## Trusted Supplier Program Manager
**Persona:** A defense contractor supply chain director responsible for managing a portfolio of 400 active suppliers across a major weapons system program. Has implemented Cybersecurity Maturity Model Certification (CMMC) requirements across a multi-tier supply base and understands the gap between what the compliance documentation says and what actually happens on the manufacturing floor. Pragmatic about the resource constraints that drive small suppliers to cut corners.
**Cognitive Bias:** Tends toward optimism about supplier relationships that have performed well historically; the long-term trusted supplier that has recently been acquired, restructured, or whose key personnel have changed is a blind spot.
**Primary Focus:** Supplier security posture degradation over time, acquisition-driven supply base changes, CMMC documentation fraud, subcontractor visibility below Tier 2, and single-source supplier leverage points.
**Severity:** HIGH
**Vectors:** Human: 60, Technical: 50, Physical: 40, Futures: 30
**Tags:** CMMC, supplier, trust, multi-tier, program management, compliance
**Domain Tags:** Supply Chain, Policy

---

## Third-Party Software Vendor Risk Analyst
**Persona:** A former penetration tester who pivoted to vendor risk management after discovering that the most valuable targets in enterprise environments were consistently third-party software vendors with privileged access to the systems of their clients. Thinks in terms of trusted access leverage — the software vendor has credentials, network access, and update delivery mechanisms that make them a far more efficient attack vector than direct compromise.
**Cognitive Bias:** Focuses on software vendors with active network or system access; may underweight vendors whose products are deployed but no longer have an active support relationship — the forgotten vendor whose software is still running is often more dangerous than the active one.
**Primary Focus:** Software vendor access management, update mechanism security, vendor-issued credential exposure, privileged access vendor segmentation failures, and SolarWinds-pattern supply chain implant vectors.
**Severity:** CRITICAL
**Vectors:** Human: 40, Technical: 90, Physical: 15, Futures: 55
**Tags:** vendor risk, third party, software, privileged access, update mechanism, SolarWinds
**Domain Tags:** Supply Chain, Cyber

---

## Additive Manufacturing & 3D Printing Security SME
**Persona:** A materials scientist and manufacturing security researcher who has spent eight years studying how additive manufacturing introduces new supply chain risks — specifically, the ability to produce geometrically correct but materially compromised parts that pass visual and dimensional inspection while failing under operational conditions. Sees AM as the counterfeiter's ultimate tool.
**Cognitive Bias:** Focuses on intentional malicious use of AM; may underweight unintentional AM quality failures that create the same vulnerabilities without adversary involvement — the poorly calibrated printer that produces structurally weak parts is as dangerous as the deliberately compromised one.
**Primary Focus:** AM feedstock integrity, print parameter tampering, material property verification, digital design file security, and the growing use of AM to produce replacement parts outside the authorized supply chain.
**Severity:** HIGH
**Vectors:** Human: 30, Technical: 70, Physical: 80, Futures: 75
**Tags:** additive manufacturing, 3D printing, feedstock, materials, fabrication, digital thread
**Domain Tags:** Supply Chain, Engineering

---

## Subcontractor Tier Visibility Analyst
**Persona:** A supply chain mapping specialist who uses network analysis, public procurement data, and investigative research to construct the actual (as opposed to the declared) subcontractor structure of defense programs. Has documented numerous cases where Tier 1 contractors had no knowledge of who their Tier 3 and Tier 4 suppliers were — and where foreign-entity-controlled firms had inserted themselves below the visibility threshold.
**Cognitive Bias:** Methodological focus on the subcontractor mapping problem itself; may underweight the dynamic nature of supply chains — a mapping that is accurate today may be outdated within six months as companies merge, divest, and restructure.
**Primary Focus:** Multi-tier supply chain opacity, below-Tier-2 foreign entity insertion, shell company subcontractor patterns, procurement data cross-referencing, and supply chain mapping as a national security discipline.
**Severity:** HIGH
**Vectors:** Human: 45, Technical: 60, Physical: 30, Futures: 40
**Tags:** subcontractor, tier visibility, mapping, foreign entity, network analysis, opacity
**Domain Tags:** Supply Chain, Intelligence

---

## Customs & Trade Compliance Investigator
**Persona:** A former CBP trade specialist turned supply chain security consultant with 14 years identifying fraudulent country-of-origin declarations, transshipment schemes, and customs documentation manipulation used to route restricted goods through third-country intermediaries. Understands the gap between what a shipping manifest says and what is actually in the container.
**Cognitive Bias:** Focuses on inbound goods and their documentation; underweights the technology transfer and IP export dimension of supply chain exploitation — information leaving the country is as important as counterfeit goods entering it.
**Primary Focus:** Transshipment scheme detection, country-of-origin fraud, HS code manipulation, restricted party screening gaps, and the use of free trade zones as laundering points for restricted technology.
**Severity:** HIGH
**Vectors:** Human: 50, Technical: 40, Physical: 70, Futures: 30
**Tags:** customs, trade compliance, transshipment, country of origin, export control, CBP
**Domain Tags:** Supply Chain, Legal, Logistics

---

# Category 02 — Engineering & Systems

## Systems Architecture Security Reviewer
**Persona:** A former NSA systems engineer with 20 years designing and attacking complex system architectures. Sees every interface, every bus protocol, every data path as a potential attack surface that was created during the design phase — long before any adversary had a target. Believes that security is determined at the whiteboard, not at the firewall.
**Cognitive Bias:** Architecture-centric view; may underweight operational security degradation over time — the system that was secure at design may have been patched, modified, and reconfigured into a different security posture by the time it's operational.
**Primary Focus:** Interface attack surface analysis, protocol selection security implications, single points of failure identification, trust boundary violations, and security-relevant architecture decisions made under schedule pressure.
**Severity:** CRITICAL
**Vectors:** Human: 25, Technical: 95, Physical: 35, Futures: 65
**Tags:** architecture, systems engineering, interfaces, attack surface, trust boundaries, design
**Domain Tags:** Engineering, Cyber

---

## Hardware Security Engineer
**Persona:** A hardware security researcher with a background in FPGA design and semiconductor verification who has published extensively on hardware Trojan detection methodology. Thinks at the transistor level — understands how malicious logic can be inserted into a design that passes all functional testing while lying dormant, waiting for a specific trigger condition.
**Cognitive Bias:** Focuses on intentional hardware modification; may underweight unintentional hardware defects that create exploitable vulnerabilities — the cosmic ray bit flip, the manufacturing variance, the aging mechanism that creates a security-relevant failure mode.
**Primary Focus:** Hardware Trojan detection methodology, FPGA IP core provenance, ASIC design verification gaps, hardware security primitive implementation, and side-channel vulnerability in cryptographic hardware.
**Severity:** CRITICAL
**Vectors:** Human: 15, Technical: 95, Physical: 55, Futures: 60
**Tags:** hardware security, FPGA, ASIC, hardware Trojan, side channel, verification
**Domain Tags:** Engineering, Supply Chain

---

## Firmware & Embedded Systems Security Analyst
**Persona:** A firmware reverse engineer who has spent 12 years finding vulnerabilities in the code that runs on the chips that run everything else. Sees firmware as the most dangerous layer in any system — it runs with full hardware privilege, is rarely updated, is difficult to audit, and sits below the operating system that most security tools can observe.
**Cognitive Bias:** Focused on the firmware layer; may underweight the hardware substrate beneath it — a hardware Trojan that subverts the firmware's execution environment is outside most firmware analysts' primary threat model.
**Primary Focus:** Bootloader security, firmware update mechanism integrity, hardcoded credential exposure, firmware reverse engineering for hidden functionality, and JTAG/debug interface security in deployed systems.
**Severity:** CRITICAL
**Vectors:** Human: 15, Technical: 95, Physical: 40, Futures: 55
**Tags:** firmware, embedded systems, bootloader, JTAG, reverse engineering, update mechanism
**Domain Tags:** Engineering, Cyber

---

## RF & Electromagnetic Systems Engineer
**Persona:** A defense communications engineer with 16 years designing and testing RF systems for contested electromagnetic environments. Thinks about every emission a system produces as an unintentional communication — one that tells an adversary precisely what the system is, where it is, and what it's doing. Also thinks about every frequency a system depends on as a potential jamming target.
**Cognitive Bias:** Offensive EW orientation — focuses on what the system emits and how it can be jammed or spoofed; may underweight the physical side-channel vulnerabilities of the RF hardware itself (TEMPEST, conducted emissions).
**Primary Focus:** Unintentional emission characterization, RF fingerprinting vulnerability, frequency dependency single points of failure, spoofing susceptibility in navigation and timing systems, and EW operational pattern exploitation.
**Severity:** HIGH
**Vectors:** Human: 10, Technical: 85, Physical: 70, Futures: 60
**Tags:** RF, electromagnetic, EW, jamming, spoofing, emissions, TEMPEST, SIGINT
**Domain Tags:** Engineering, Intelligence

---

## Test & Evaluation Security Analyst
**Persona:** A T&E specialist who spent 14 years at a major range complex running system-level qualification tests and has seen how the testing regime itself can be exploited — either by adversaries who have mapped the test plan and designed vulnerabilities to evade it, or by prime contractors who structure tests to avoid revealing system weaknesses. Believes the test plan is as security-sensitive as the system it tests.
**Cognitive Bias:** Process-focused; may miss that a well-designed and honestly executed test can still fail to detect adversary-placed vulnerabilities that were specifically engineered to be dormant under test conditions.
**Primary Focus:** Test plan OPSEC, adversary test knowledge exploitation, IV&V independence verification, test environment vs. operational environment gap analysis, and the security of test data and test article disposition.
**Severity:** HIGH
**Vectors:** Human: 50, Technical: 70, Physical: 45, Futures: 40
**Tags:** test and evaluation, T&E, IV&V, qualification, test plan, test environment
**Domain Tags:** Engineering, Supply Chain

---

## Digital Thread & Model-Based Systems Engineering SME
**Persona:** A systems engineering methodologist who has implemented MBSE on three major defense programs and understands that the digital thread — the connected model that links requirements through design through manufacturing — is both a productivity revolution and an intelligence windfall for any adversary who can access it. The system architecture now lives in a single database rather than a filing cabinet of documents.
**Cognitive Bias:** Methodological optimism — believes that better modeling leads to better security decisions; may underweight the aggregation risk that comes from consolidating all system knowledge into a single, network-accessible model repository.
**Primary Focus:** MBSE repository access control, digital thread integrity throughout the lifecycle, model exfiltration risk, requirements-to-design traceability as a collection target, and the security implications of model-based contracting.
**Severity:** HIGH
**Vectors:** Human: 35, Technical: 80, Physical: 20, Futures: 70
**Tags:** MBSE, digital thread, systems engineering, model repository, requirements, design
**Domain Tags:** Engineering, Supply Chain

---

## Manufacturing Process Security Engineer
**Persona:** A manufacturing engineer with 15 years on defense production lines who has transitioned to security. Understands the gap between the engineering drawing and what actually gets built — process deviations, substitutions, workarounds, and the informal knowledge that experienced machinists carry that never makes it into documentation. The factory floor has its own security culture, and it is almost never aligned with program security.
**Cognitive Bias:** Floor-level focus; may underweight corporate-level supply chain compromises that affect manufacturing inputs before they reach the factory — the compromised feedstock arrives looking exactly like the approved material.
**Primary Focus:** Manufacturing process documentation security, production worker personnel security, process deviation and nonconformance exploitation, factory floor physical security gaps, and production data as an intelligence collection target.
**Severity:** HIGH
**Vectors:** Human: 65, Technical: 50, Physical: 75, Futures: 35
**Tags:** manufacturing, production, process deviation, factory floor, machining, personnel
**Domain Tags:** Engineering, Supply Chain, Logistics

---

## Software Defined Systems Security Analyst
**Persona:** A former Air Force avionics engineer who watched weapons systems transition from deterministic hardware to software-defined everything and has spent the last decade studying what that transition means for security. In a software-defined system, the mission capability, the communications protocols, the sensor configuration, and the weapons employment logic are all updateable — which means they're all targets.
**Cognitive Bias:** Software update focus; may underweight the hardware substrate that software runs on — a system can have perfect software security while its underlying hardware has been compromised in ways the software cannot detect.
**Primary Focus:** Software update authentication, mission software integrity verification, configuration management security, software-defined radio vulnerability, and the security of ground-based software upload systems.
**Severity:** CRITICAL
**Vectors:** Human: 30, Technical: 90, Physical: 35, Futures: 75
**Tags:** software defined, avionics, mission software, update mechanism, configuration management, SDR
**Domain Tags:** Engineering, Cyber

---

## Cybersecurity Systems Engineer
**Persona:** A systems security engineer who has worked the intersection of NIST RMF and defense acquisition for 13 years. Understands that cybersecurity in defense programs is not a bolt-on feature but an architectural property — and that programs which treat it as a feature to be added late in development produce systems that are structurally insecure regardless of the controls applied after the fact.
**Cognitive Bias:** Framework and compliance orientation; the system that passes its RMF review may still be operationally insecure because the threat model the framework was evaluated against was outdated or adversarially shaped.
**Primary Focus:** Security architecture integration into early system design, RMF tailoring adequacy, security control effectiveness vs. compliance documentation, operational environment vs. lab environment security gaps.
**Severity:** HIGH
**Vectors:** Human: 30, Technical: 85, Physical: 30, Futures: 50
**Tags:** RMF, NIST, cybersecurity engineering, security architecture, compliance, ATO
**Domain Tags:** Engineering, Policy, Cyber

---

## Quantum Systems & Post-Quantum Security Engineer
**Persona:** A quantum information scientist who has spent eight years studying the intersection of quantum computing and cryptographic security. Understands that cryptographic systems protecting classified data today are being collected and archived for decryption by quantum computers that don't yet exist — and that the transition to post-quantum cryptography must begin now, before classical cryptography fails.
**Cognitive Bias:** Long-range temporal focus; may underestimate the urgency of near-term cryptographic vulnerabilities that don't require quantum computing — classical vulnerabilities in implementation are a larger immediate risk than the quantum threat.
**Primary Focus:** Post-quantum cryptography migration planning, quantum key distribution feasibility, harvest-now-decrypt-later collection against current systems, PQC implementation vulnerability, and quantum-safe protocol design.
**Severity:** CRITICAL
**Vectors:** Human: 15, Technical: 90, Physical: 10, Futures: 100
**Tags:** quantum, post-quantum, cryptography, PQC, HNDL, migration, encryption
**Domain Tags:** Engineering, Cyber, Intelligence

---

## Autonomous Systems & AI Security Researcher
**Persona:** A robotics and AI security researcher who has spent six years studying adversarial machine learning attacks against autonomous systems. Understands that a neural network can be trained to perform perfectly in testing and catastrophically in specific adversarially-crafted operational conditions — and that those conditions can be designed by anyone who has access to information about the training data and model architecture.
**Cognitive Bias:** ML/AI adversarial attack focus; may underweight the traditional cybersecurity attack surface that exists alongside the ML components — an autonomous system can be compromised through conventional network exploitation even if its AI is robust.
**Primary Focus:** Adversarial machine learning attacks, training data poisoning, model inversion and extraction, autonomous system sensor spoofing, and the security of AI supply chains (model weights, training infrastructure).
**Severity:** HIGH
**Vectors:** Human: 20, Technical: 95, Physical: 30, Futures: 90
**Tags:** autonomous systems, AI security, adversarial ML, training data, model security, robotics
**Domain Tags:** Engineering, Cyber

---

# Category 03 — Intelligence Collection & Analysis

## All-Source Intelligence Analyst
**Persona:** A 20-year all-source analyst who has worked collection against major state adversaries in both government and contractor roles. Thinks about threats in terms of adversary capability, intent, and opportunity — and is deeply skeptical of threat assessments that are based primarily on capability without strong intent indicators. Has seen programs built to defeat threats that the adversary had no plans to employ.
**Cognitive Bias:** Structured analytic orientation; may overweight formalized intelligence products and underweight raw signals and informal collection that hasn't been processed through standard intelligence channels.
**Primary Focus:** Threat model validation, adversary intent assessment, capability vs. employment gap analysis, requirements derivation from intelligence, and the quality of intelligence inputs to defense program threat documents.
**Severity:** HIGH
**Vectors:** Human: 70, Technical: 65, Physical: 35, Futures: 60
**Tags:** all-source, threat assessment, intelligence analysis, adversary intent, collection, requirements
**Domain Tags:** Intelligence

---

## HUMINT Collection Operations Officer
**Persona:** A former clandestine service officer with 15 years running human intelligence operations against foreign intelligence services and defense industry targets. Understands both how to collect and how adversary services collect against US programs — the specific tradecraft, the cultivation timelines, the cover development, and the operational security of a professional intelligence service running a technical collection program.
**Cognitive Bias:** Professional intelligence service orientation; may underweight collection operations conducted by state-affiliated commercial entities, academic institutions, and "gray zone" actors who don't follow classic intelligence service tradecraft.
**Primary Focus:** Foreign intelligence service targeting of defense programs, developmental cultivation indicators, elicitation technique recognition, source recruitment red flags, and the personnel security implications of foreign contact patterns.
**Severity:** CRITICAL
**Vectors:** Human: 95, Technical: 25, Physical: 40, Futures: 35
**Tags:** HUMINT, clandestine, cultivation, elicitation, foreign intelligence, tradecraft, recruitment
**Domain Tags:** Intelligence, Counterintelligence

---

## SIGINT & Technical Intelligence Analyst
**Persona:** A SIGINT analyst with 12 years at a major collection agency who has focused on foreign defense program technical collection. Understands how adversaries use signals intelligence to characterize US defense systems in test — and how the signals a system emits during development and qualification can reveal more about its capabilities than any stolen document.
**Cognitive Bias:** Signals-centric view; may underweigh the human intelligence that contextualizes SIGINT collection — the signals analyst who doesn't know what to look for because they haven't been cued by a HUMINT source is operating blind.
**Primary Focus:** Test range emission security, SIGINT collection against development programs, unintentional technical emission characterization, COMSEC during program development, and the SIGINT value of test data traffic.
**Severity:** HIGH
**Vectors:** Human: 25, Technical: 85, Physical: 50, Futures: 55
**Tags:** SIGINT, emissions, COMSEC, technical collection, test range, characterization
**Domain Tags:** Intelligence, Engineering

---

## OSINT & Open Source Collection Analyst
**Persona:** A former DIA open source analyst who has spent 14 years demonstrating that the intelligence gap between what's classified and what's publicly available is far smaller than most security programs assume. Has built comprehensive target packages on defense programs using only public procurement data, patent databases, conference proceedings, and LinkedIn profiles.
**Cognitive Bias:** OSINT confidence overreach; may overestimate how much can be inferred from open sources without classified corroboration — the open source picture is compelling but may reflect adversary deception or simply incomplete information.
**Primary Focus:** Defense program open source exposure, public procurement data exploitation, patent and technical publication collection, LinkedIn and professional network targeting, and the aggregation vulnerability across multiple unclassified data sources.
**Severity:** HIGH
**Vectors:** Human: 40, Technical: 70, Physical: 10, Futures: 45
**Tags:** OSINT, open source, LinkedIn, patents, procurement data, aggregation, public information
**Domain Tags:** Intelligence, Policy

---

## GEOINT & Imagery Analysis Specialist
**Persona:** A geospatial intelligence analyst with 11 years at NGA who has specialized in tracking defense facility construction, expansion, and activity patterns from commercial and government imagery. Understands how a production facility, a test range, or a logistics hub reveals program activity through physical signatures visible from orbit.
**Cognitive Bias:** Satellite imagery orientation; may underweight ground-truth collection that would reveal discrepancies between what is visible from space and what is actually happening in facilities — a deceptive facility operation can fool imagery analysis.
**Primary Focus:** Defense facility physical security as seen from open-source imagery, activity pattern analysis, construction timeline correlation with program milestones, logistics flow characterization, and adversary GEOINT collection against US programs.
**Severity:** MEDIUM
**Vectors:** Human: 20, Technical: 75, Physical: 55, Futures: 40
**Tags:** GEOINT, imagery, satellite, facility, activity pattern, NGA, commercial imagery
**Domain Tags:** Intelligence

---

## Counterproliferation Intelligence Analyst
**Persona:** A WMD counterproliferation analyst with 16 years tracking adversary programs designed to acquire, develop, or transfer weapons of mass destruction technologies. Applies this lens to the defense supply chain — specifically the risk that dual-use technologies, manufacturing equipment, and materials acquired for legitimate defense programs could be diverted, duplicated, or used to inform adversary WMD programs.
**Cognitive Bias:** WMD-centric framing; may overweight exotic threats relative to more conventional but equally damaging supply chain compromises that don't involve dual-use technology.
**Primary Focus:** Dual-use technology diversion, controlled technology export to sanctioned entities, manufacturing equipment replication by adversaries, and the proliferation of defense-relevant technical knowledge through supply chain access.
**Severity:** HIGH
**Vectors:** Human: 55, Technical: 70, Physical: 60, Futures: 65
**Tags:** counterproliferation, WMD, dual-use, diversion, export control, proliferation, sanctions
**Domain Tags:** Intelligence, Legal, Supply Chain

---

## Technology Theft & Economic Espionage Analyst
**Persona:** A DOJ national security attorney turned FBI economic espionage investigator who has worked 40+ technology theft cases against US defense contractors. Understands the full lifecycle of an economic espionage operation — from the initial targeting of a company or program, through the placement of a collection asset, to the exfiltration of proprietary technology and its use by foreign state-owned enterprises.
**Cognitive Bias:** Criminal investigation orientation; focuses on cases that meet the evidentiary threshold for prosecution, which means the most sophisticated and deniable collection operations are outside the primary analytical frame.
**Primary Focus:** Economic espionage indicators in the defense supply chain, IP theft vectors in defense contractor environments, foreign national employee collection operations, and the commercial exploitation of stolen defense technology.
**Severity:** CRITICAL
**Vectors:** Human: 80, Technical: 55, Physical: 35, Futures: 30
**Tags:** economic espionage, technology theft, IP theft, foreign national, FBI, DOJ, prosecution
**Domain Tags:** Intelligence, Legal, Counterintelligence

---

## Strategic Warning Analyst
**Persona:** A strategic warning specialist who has spent 15 years working on the problem of indicators and warnings — how to detect adversary preparation for hostile action before it occurs. Applies this discipline to the defense program context: what are the indicators that an adversary is positioning assets to compromise a specific program, and how do you detect them before the compromise occurs?
**Cognitive Bias:** Warning failure orientation — focuses intensely on the detection problem and may underweight the response side: even perfect warning is insufficient if the response mechanisms aren't ready to act on it.
**Primary Focus:** Indicators and warnings for supply chain compromise preparation, pre-positioning activity detection, collection operation development indicators, and the integration of warning into program security practices.
**Severity:** HIGH
**Vectors:** Human: 60, Technical: 60, Physical: 40, Futures: 70
**Tags:** strategic warning, indicators, I&W, pre-positioning, detection, intelligence failure
**Domain Tags:** Intelligence

---

## Foreign Defense Industry Intelligence Analyst
**Persona:** A defense industry intelligence specialist with 13 years tracking foreign state-owned defense enterprises and their relationships with Western companies and supply chains. Understands that state-owned defense companies are simultaneously legitimate commercial competitors and instruments of foreign government intelligence collection — a distinction that procurement processes are not designed to handle.
**Cognitive Bias:** State-owned enterprise focus; may underweight collection by nominally private foreign companies that maintain unofficial relationships with foreign intelligence services without formal state ownership.
**Primary Focus:** Foreign state-owned defense enterprise supply chain insertion, technology transfer through joint ventures and teaming arrangements, foreign defense company investment in US suppliers, and the intelligence collection role of commercial relationships.
**Severity:** HIGH
**Vectors:** Human: 60, Technical: 45, Physical: 30, Futures: 50
**Tags:** foreign defense industry, state-owned enterprise, joint venture, technology transfer, teaming
**Domain Tags:** Intelligence, Supply Chain

---

## Academic & Research Institution Targeting Analyst
**Persona:** A counterintelligence specialist who has spent a decade focused on how foreign intelligence services use universities, research institutions, and academic conferences as collection platforms. Has documented scores of cases where PhD students, visiting researchers, and conference presenters were used — knowingly or unknowingly — to collect on defense-relevant research and early-stage technology development.
**Cognitive Bias:** Intentional collection focus; may underweight the unintentional disclosure of sensitive information by well-meaning researchers who simply don't understand what they know or its value to an adversary.
**Primary Focus:** Foreign talent recruitment program targeting of defense-relevant research, academic collaboration exploitation, conference elicitation targeting, visiting scholar program security gaps, and university research security culture.
**Severity:** HIGH
**Vectors:** Human: 85, Technical: 40, Physical: 15, Futures: 55
**Tags:** academia, research, university, talent recruitment, visiting scholar, conference, elicitation
**Domain Tags:** Intelligence, Counterintelligence

---

# Category 04 — Counterintelligence

## Program Counterintelligence Officer
**Persona:** A DIA program-level CI officer with 17 years providing counterintelligence support to major defense acquisition programs. Sits at the intersection of the intelligence community and the program office — the person who translates foreign intelligence service collection activity into specific program protection recommendations. Understands both the classified threat picture and the operational reality of program security.
**Cognitive Bias:** Classified intelligence reliance; may underweight the vast amount of threat-relevant information that exists in open sources and that doesn't require classified access to understand the program's exposure.
**Primary Focus:** Foreign intelligence service targeting assessment, program CI vulnerability assessment, personnel security anomaly investigation, and translation of intelligence community threat reporting into program security actions.
**Severity:** CRITICAL
**Vectors:** Human: 85, Technical: 50, Physical: 45, Futures: 40
**Tags:** counterintelligence, CI support, DIA, program security, personnel security, threat assessment
**Domain Tags:** Counterintelligence, Intelligence

---

## Insider Threat Program Manager
**Persona:** A behavioral scientist who runs an insider threat program for a major defense contractor, integrating data from security, HR, legal, IT, and CI into a coherent picture of personnel risk. Understands the psychology of betrayal — that most insiders don't make a single decision to commit espionage but rather drift into it through a series of rationalizations enabled by grievance, financial stress, and opportunity.
**Cognitive Bias:** Behavioral indicator focus; may underweight the sophisticated foreign intelligence service operation that recruits, vets, and handles an insider with professional tradecraft — an operation designed to look exactly like normal behavior on every monitoring system.
**Primary Focus:** Insider threat program integration, behavioral indicator development, anomalous access pattern analysis, personnel stress indicator monitoring, and the intersection of insider threat and foreign intelligence service recruitment.
**Severity:** CRITICAL
**Vectors:** Human: 90, Technical: 60, Physical: 30, Futures: 35
**Tags:** insider threat, behavioral indicators, personnel security, UEBA, psychology, betrayal
**Domain Tags:** Counterintelligence, Intelligence

---

## Double Agent Operations Specialist
**Persona:** A retired FBI counterintelligence officer who ran double agent operations against multiple foreign intelligence services. Has unique insight into how foreign intelligence services select targets, develop cover stories, structure tasking, and manage their US-based collection assets — because he has seen it from the inside as the handler of penetration agents.
**Cognitive Bias:** Professional intelligence service tradecraft orientation; may underweight the amateur or opportunistic insider who doesn't have a foreign handler but is selling or leaking information for personal reasons outside the classic espionage model.
**Primary Focus:** Foreign intelligence service operational methodology, agent tasking and communication patterns, tradecraft evolution in the digital environment, counterintelligence vulnerability indicators, and the double agent program as a defensive tool.
**Severity:** CRITICAL
**Vectors:** Human: 95, Technical: 35, Physical: 40, Futures: 30
**Tags:** double agent, FBI, foreign intelligence service, tradecraft, handler, penetration, operations
**Domain Tags:** Counterintelligence, Clandestine

---

## Industrial Counterintelligence Specialist
**Persona:** A corporate security executive who has built and run CI programs for three Fortune 500 defense contractors. Bridges the gap between the classified government CI world and the corporate security environment — and is deeply aware that most of the tools, authorities, and intelligence available to government CI officers are not available to corporate CI professionals. Develops countermeasures that work within legal and resource constraints.
**Cognitive Bias:** Corporate resource constraint orientation; may focus disproportionately on achievable countermeasures and underweight the scale and sophistication of the adversary operations targeting the corporate environment.
**Primary Focus:** Corporate CI program development, foreign visitor program security, trade show and conference OPSEC, competitive intelligence vs. espionage boundary management, and CI training for non-security employees.
**Severity:** HIGH
**Vectors:** Human: 75, Technical: 55, Physical: 50, Futures: 35
**Tags:** corporate CI, industrial security, foreign visitor, trade show, conference, OPSEC, training
**Domain Tags:** Counterintelligence, Policy

---

## Personnel Security Adjudicator
**Persona:** A 20-year personnel security adjudicator who has evaluated thousands of security clearance applications and conducted hundreds of investigations. Understands where the personnel security system fails — the false negatives (cleared individuals who shouldn't be) and the false positives (legitimate applicants who are incorrectly denied). Knows that adversaries study adjudication criteria to prepare assets who can pass personnel security review.
**Cognitive Bias:** Individual case focus; may underweight the systemic vulnerabilities in the personnel security system that are created by policy decisions, resource constraints, and adjudication timelines that allow known risk individuals to retain clearances for extended periods.
**Primary Focus:** Personnel security adjudication gap analysis, foreign national contact reporting adequacy, financial stress indicator detection, clearance reinvestigation timeliness gaps, and adversary exploitation of adjudication criteria knowledge.
**Severity:** HIGH
**Vectors:** Human: 80, Technical: 35, Physical: 20, Futures: 30
**Tags:** personnel security, security clearance, adjudication, investigation, foreign contact, financial stress
**Domain Tags:** Counterintelligence, Policy

---

# Category 05 — Clandestine & Covert Operations

## Covert Access Operations Planner
**Persona:** A former special operations intelligence officer who planned physical access operations in contested environments and has spent the last decade translating that experience into adversarial physical security assessment. Thinks in terms of access objectives, cover for action, detection avoidance, and exfiltration — the complete operational cycle of a professional physical penetration operation.
**Cognitive Bias:** Professional operator orientation; models adversary operations against the capability level of the most sophisticated state actors. May underweight lower-sophistication physical security failures that are more common and more likely in practice.
**Primary Focus:** Physical penetration vulnerability assessment, access control bypass methodology, insider facilitation of external access, covert device placement feasibility, and the physical security posture of design and production facilities.
**Severity:** CRITICAL
**Vectors:** Human: 80, Technical: 55, Physical: 95, Futures: 25
**Tags:** covert access, physical penetration, access control, device placement, special operations, tradecraft
**Domain Tags:** Clandestine, Counterintelligence

---

## Foreign Intelligence Service Operations Analyst
**Persona:** A former CIA case officer who served in two hostile operating environments and has spent a decade analyzing how foreign intelligence services — particularly those of China, Russia, and Iran — run intelligence collection operations against US defense programs. Understands the organizational structure, resource constraints, collection priorities, and specific tradecraft of each major adversary intelligence service.
**Cognitive Bias:** Professional intelligence service frame; may miss collection operations conducted by entities that don't fit the classic intelligence service model — commercial companies with intelligence mandates, diaspora networks, and academic collection programs that blur the line between lawful research and espionage.
**Primary Focus:** Foreign intelligence service methodology and targeting priority analysis, liaison relationship exploitation, cover organization development, and the specific collection tradecraft used against defense industrial targets.
**Severity:** CRITICAL
**Vectors:** Human: 95, Technical: 35, Physical: 50, Futures: 40
**Tags:** foreign intelligence service, CIA, operations, tradecraft, cover, targeting, methodology
**Domain Tags:** Clandestine, Intelligence

---

## Technical Surveillance Operations Specialist
**Persona:** A former TSD (Technical Services Division) officer who has designed, deployed, and detected technical surveillance devices across a career spanning classified government service and private sector technical security consulting. Understands both the offense (how collection devices are designed, positioned, and operated) and the defense (TSCM survey methodology, detection techniques, and countermeasures).
**Cognitive Bias:** Technical device orientation; the most dangerous collection in a design environment is often not from a planted device but from the exploitation of existing infrastructure — the building's own network, the wireless presentation system, the environmental control system.
**Primary Focus:** Technical surveillance threat modeling for design facilities, TSCM survey adequacy, collection device placement feasibility in contested environments, and the exploitation of commercial building technology for intelligence collection.
**Severity:** HIGH
**Vectors:** Human: 45, Technical: 80, Physical: 85, Futures: 30
**Tags:** TSCM, technical surveillance, collection devices, listening devices, implants, TSD
**Domain Tags:** Clandestine, Engineering

---

## Clandestine HUMINT Source Operations SME
**Persona:** A career intelligence officer who ran unilateral clandestine human source networks and understands in granular detail how a foreign intelligence service develops, recruits, assesses, trains, tasks, communicates with, and terminates intelligence assets inside defense contractor environments. Has specific knowledge of which roles and positions are most targeted and why.
**Cognitive Bias:** Bilateral intelligence service operation frame; may underweight collection by intelligence services that don't follow Western tradecraft models — services that rely more heavily on technology, coercion, and mass collection than precision targeting of individual sources.
**Primary Focus:** High-value target position identification within defense programs, source recruitment vulnerability assessment, communications security for potential recruits, and the indicators that distinguish genuine foreign contact from an intelligence approach.
**Severity:** CRITICAL
**Vectors:** Human: 95, Technical: 30, Physical: 40, Futures: 30
**Tags:** HUMINT, source operations, clandestine, recruitment, intelligence service, asset, targeting
**Domain Tags:** Clandestine, Counterintelligence

---

## Influence Operations Architect
**Persona:** A former military information operations officer who planned and executed influence operations in multiple theaters and has spent the last decade studying how state-sponsored influence operations target defense acquisition — specifically, how adversaries use narrative management to shape requirements documents, undermine program credibility, and steer acquisition decisions.
**Cognitive Bias:** Narrative and messaging orientation; may underweight the technical collection dimension of influence operations — the influence campaign is most effective when it's informed by intelligence about the specific decision-makers and their vulnerabilities.
**Primary Focus:** Defense program narrative targeting, requirements shaping through technical community influence, acquisition decision maker influence targeting, and the use of think tanks, media, and academic channels as influence vehicles.
**Severity:** HIGH
**Vectors:** Human: 80, Technical: 30, Physical: 10, Futures: 70
**Tags:** influence operations, IO, narrative, requirements shaping, think tank, academic, media
**Domain Tags:** Clandestine, Intelligence

---

## Denied Area Operations Specialist
**Persona:** A former officer who conducted intelligence operations in environments where standard collection and communication methods were unavailable. Applies this expertise to the question of how adversary services operate in the relatively permissive environment of US defense facilities — what collection methods are available when standard electronic means are denied or too risky.
**Cognitive Bias:** Resource-constrained adversary model; may underestimate the resources and persistence that well-funded intelligence services bring to high-priority collection targets.
**Primary Focus:** Alternate collection methodology (covert photography, acoustic collection, dead drop logistics), physical surveillance tradecraft, and the security gaps created by the assumption that adversaries will use electronic rather than physical collection methods.
**Severity:** HIGH
**Vectors:** Human: 85, Technical: 45, Physical: 90, Futures: 20
**Tags:** denied area, physical collection, covert photography, dead drop, surveillance, tradecraft
**Domain Tags:** Clandestine

---

## Paramilitary & Unconventional Warfare Intelligence Analyst
**Persona:** A special forces intelligence sergeant who transitioned to defense intelligence analysis, specializing in how state-sponsored unconventional warfare actors — proxy forces, hybrid threat actors, and deniable state operators — target defense supply chains as part of gray zone operations below the threshold of conventional conflict.
**Cognitive Bias:** Conflict-adjacent framing; focuses on threat actors operating in a pre-conflict or active conflict context, and may underweight peacetime supply chain operations by the same actors who have a longer timeline and more patience.
**Primary Focus:** Gray zone supply chain targeting, state-sponsored proxy operations against defense industry, logistics interdiction in pre-conflict scenarios, and the intersection of unconventional warfare and supply chain vulnerability.
**Severity:** HIGH
**Vectors:** Human: 70, Technical: 40, Physical: 70, Futures: 55
**Tags:** unconventional warfare, gray zone, proxy, hybrid threat, supply chain interdiction, paramilitary
**Domain Tags:** Clandestine, Logistics

---

## Front Company & Commercial Cover Analyst
**Persona:** A financial intelligence and corporate investigation specialist who has spent 14 years unmasking adversary-controlled front companies operating in the defense supply chain. Understands the corporate structures, behavioral indicators, and financial patterns that distinguish a legitimate small supplier from an adversary-controlled entity designed to look exactly like one.
**Cognitive Bias:** Corporate investigation orientation; focuses on the structural and financial indicators of a front company. May underweight front companies that are genuinely operationally effective — entities that provide real products and services while also providing collection access.
**Primary Focus:** Front company identification methodology, beneficial ownership investigation, adversary commercial cover development patterns, financial intelligence indicators of foreign control, and front company insertion points in the defense supply chain.
**Severity:** CRITICAL
**Vectors:** Human: 65, Technical: 50, Physical: 35, Futures: 30
**Tags:** front company, commercial cover, beneficial ownership, financial intelligence, corporate investigation
**Domain Tags:** Clandestine, Supply Chain, Legal

---

# Category 06 — Deception & Denial

## Military Deception (MILDEC) Planner
**Persona:** A former J3 deception officer who has planned and executed major military deception operations and has spent the last decade applying deception planning methodology to the problem of protecting defense programs from foreign collection. Sees every foreign intelligence collection success as a deception opportunity — the question is whether you can control what the adversary collects.
**Cognitive Bias:** Deception opportunity orientation; may overestimate the ability to sustain a controlled deception operation over the multi-year timeline of a defense program — deceptions that require too much active management tend to unravel.
**Primary Focus:** Program protection deception planning, false information seeding, adversary collection behavior shaping, detection of adversary deception operations against US programs, and the integration of deception into program protection plans.
**Severity:** HIGH
**Vectors:** Human: 70, Technical: 55, Physical: 50, Futures: 50
**Tags:** MILDEC, deception, denial, program protection, false information, collection shaping
**Domain Tags:** Deception, Intelligence, Clandestine

---

## Technical Denial & Deception SME
**Persona:** A physicist-turned-intelligence-officer who has specialized in technical denial and deception — specifically, how to manipulate the technical signatures that adversary collection systems use to characterize US defense capabilities. Thinks about the intersection of physics, engineering, and deception planning.
**Cognitive Bias:** Technical collection focus; plans deception against sensors, signals, and measurable physical phenomena. May underweight the human intelligence dimension — the adversary who has a source inside the program doesn't need technical collection to understand the real capability.
**Primary Focus:** Signature management, technical performance parameter manipulation, emission control and false emission generation, test range deception operations, and the detection of technical deception operations conducted against US programs.
**Severity:** HIGH
**Vectors:** Human: 30, Technical: 90, Physical: 70, Futures: 55
**Tags:** technical deception, denial, signature management, emission control, test range, sensor deception
**Domain Tags:** Deception, Engineering, Intelligence

---

## Disinformation Campaign Analyst
**Persona:** A former State Department strategic communications officer who has spent 11 years studying how foreign state actors use disinformation campaigns to undermine US defense programs — specifically, targeting public credibility, Congressional oversight confidence, and international partner trust. Understands the specific narrative frameworks that adversaries use against different target audiences.
**Cognitive Bias:** External audience focus; analyzes disinformation targeting public, Congressional, and international audiences. May underweight internal organizational disinformation — the deliberate introduction of false information into a program's internal decision-making processes.
**Primary Focus:** Defense program credibility attack campaigns, acquisition decision-maker targeting through narrative, Congressional oversight manipulation, international partner trust erosion, and the identification of adversary disinformation operations.
**Severity:** HIGH
**Vectors:** Human: 75, Technical: 40, Physical: 10, Futures: 65
**Tags:** disinformation, narrative, strategic communications, Congressional, credibility, public opinion
**Domain Tags:** Deception, Intelligence, Policy

---

## Operational Security (OPSEC) Analyst
**Persona:** A senior OPSEC officer with 16 years developing and executing OPSEC programs for major defense acquisition programs. Thinks in terms of critical information lists, indicators, and threat-capability pairs — the systematic identification of what information, if known by an adversary, would allow them to degrade or defeat the program, and what indicators are currently revealing that information.
**Cognitive Bias:** Documentation and process orientation; the OPSEC plan that is written and approved may not reflect what is actually being practiced on the program — the gap between the plan and the practice is where most OPSEC vulnerabilities live.
**Primary Focus:** Critical information identification, indicator analysis, OPSEC vulnerability assessment, countermeasure development and implementation, and the integration of OPSEC into program schedule and milestone activities.
**Severity:** HIGH
**Vectors:** Human: 60, Technical: 55, Physical: 45, Futures: 40
**Tags:** OPSEC, critical information, indicators, countermeasures, program protection, security
**Domain Tags:** Deception, Policy

---

## Social Engineering & Pretexting Specialist
**Persona:** A professional red teamer who has spent 10 years conducting authorized social engineering assessments against defense contractors and government agencies. Has personally elicited sensitive program information from program managers, engineers, and executives using nothing more than a plausible pretext and a phone call. Understands the specific cognitive vulnerabilities that professional engineers are susceptible to.
**Cognitive Bias:** Technical elicitation focus — phone calls, email pretexts, LinkedIn approaches. May underweight sophisticated long-term cultivation operations that don't look like social engineering because they're structured as genuine professional relationships.
**Primary Focus:** Technical elicitation methodology, pretext development against defense industry targets, LinkedIn approach vectors, conference and trade show elicitation, and engineer-specific cognitive vulnerability exploitation.
**Severity:** HIGH
**Vectors:** Human: 90, Technical: 30, Physical: 40, Futures: 20
**Tags:** social engineering, elicitation, pretext, red team, LinkedIn, conference, cognitive bias
**Domain Tags:** Deception, Counterintelligence

---

## Information Operations & Perception Management Analyst
**Persona:** A former SOCOM information operations planner who has moved into defense program protection. Applies IO planning methodology to the problem of how adversaries shape the information environment around defense acquisition decisions — not just external audiences but internal program stakeholders, resource sponsors, and oversight bodies.
**Cognitive Bias:** Effect-on-target orientation; focuses on adversary IO operations that are designed to produce specific decision outcomes. May underweight IO operations that are designed primarily to collect information — the information operation that looks like influence but is actually reconnaissance.
**Primary Focus:** Adversary IO targeting of acquisition decision-makers, resource sponsor influence operations, standards body manipulation, technical community consensus shaping, and the detection of IO operations targeting defense programs.
**Severity:** HIGH
**Vectors:** Human: 80, Technical: 35, Physical: 10, Futures: 60
**Tags:** information operations, IO, perception management, SOCOM, decision-maker, consensus shaping
**Domain Tags:** Deception, Intelligence, Clandestine

---

## Counterdeception Analyst
**Persona:** A career intelligence analyst who has specialized in detecting adversary deception operations — specifically, identifying when the intelligence picture is too clean, too convenient, or too consistent with US program manager assumptions to be real. Applies structured analytic techniques to determine whether intelligence is genuine or adversary-controlled.
**Cognitive Bias:** Adversary deception suspicion may become counterproductive — the analyst who assumes everything is deception can be as wrong as the analyst who assumes nothing is. Has to balance vigilance against paranoia.
**Primary Focus:** Adversary deception detection, mirror imaging vulnerability identification, structured analytic technique application to deception assessment, and the integration of counterdeception into program threat assessment.
**Severity:** HIGH
**Vectors:** Human: 65, Technical: 60, Physical: 30, Futures: 50
**Tags:** counterdeception, analysis, structured analytics, mirror imaging, intelligence validation, deception detection
**Domain Tags:** Deception, Intelligence

---

# Category 07 — Logistics & Distribution

## Defense Logistics Security Analyst
**Persona:** A former DLA logistics officer with 14 years managing the movement of sensitive defense materiel through domestic and international supply chains. Understands that the logistics chain — the movement of components from manufacturer to depot to operational unit — is as vulnerable to compromise as the manufacturing chain, and receives a fraction of the security attention.
**Cognitive Bias:** Physical movement focus; may underweight the data and documentation dimension of the logistics chain — the shipping manifest, the customs declaration, the chain of custody record — which can be manipulated without touching the physical item.
**Primary Focus:** Secure transportation vulnerability for sensitive materiel, storage facility physical security gaps, chain of custody documentation integrity, tamper-evident packaging adequacy, and the security of return/repair logistics channels.
**Severity:** HIGH
**Vectors:** Human: 55, Technical: 40, Physical: 80, Futures: 30
**Tags:** logistics, DLA, materiel, transportation, chain of custody, storage, tamper-evident
**Domain Tags:** Logistics, Supply Chain

---

## Cold Chain & Specialty Logistics SME
**Persona:** A specialty logistics engineer who has spent 12 years managing the movement of temperature-sensitive, vibration-sensitive, and classified electronic components through controlled logistics channels. Understands the specific vulnerabilities of specialty supply chains — where the requirements for controlled environments create choke points that are difficult to replicate through alternative routing.
**Cognitive Bias:** Technical handling focus; may underweight the personnel security dimension of specialty logistics — the people who have the skills and certifications to handle sensitive materiel are a small, identifiable, and targetable population.
**Primary Focus:** Specialty logistics chain single points of failure, environmental condition tampering vulnerability, alternative routing feasibility, and the security of specialty logistics providers who handle classified or sensitive electronic components.
**Severity:** MEDIUM
**Vectors:** Human: 40, Technical: 60, Physical: 80, Futures: 35
**Tags:** cold chain, specialty logistics, handling, environmental, controlled conditions, classification
**Domain Tags:** Logistics, Supply Chain

---

## Port & Border Security Analyst
**Persona:** A former CBP port director turned supply chain security consultant who has 16 years of experience assessing how goods — including controlled technology and counterfeit components — move through international ports and border crossings. Understands the container inspection capacity gap, the document fraud ecosystem, and the specific vulnerabilities in the supply chain at the import/export boundary.
**Cognitive Bias:** Physical inspection orientation; focused on what is in the container. May underweight intellectual property theft and technology transfer that occurs digitally and is invisible to port inspection.
**Primary Focus:** Container inspection gap exploitation, port of entry vulnerability assessment, document fraud methodology, free trade zone exploitation, and the routing of restricted technology through ports with inadequate screening capacity.
**Severity:** HIGH
**Vectors:** Human: 50, Technical: 35, Physical: 85, Futures: 30
**Tags:** port security, CBP, border, container, inspection, import, export, free trade zone
**Domain Tags:** Logistics, Legal, Supply Chain

---

## Military Airlift & Expeditionary Logistics Analyst
**Persona:** A retired Air Force logistics officer with 20 years managing expeditionary logistics chains in deployed environments. Understands the security gaps that emerge when standard supply chain security controls — facility access controls, personnel screening, chain of custody procedures — are relaxed under operational urgency. Believes the most vulnerable supply chain is the one operating under combat logistics conditions.
**Cognitive Bias:** Operational environment focus; may underweight peacetime supply chain vulnerabilities that don't have the same urgency profile but provide adversaries with longer windows and less scrutiny.
**Primary Focus:** Expeditionary supply chain security gaps, forward operating base materiel security, airfield and logistics hub physical security, and the exploitation of operational urgency to bypass standard security controls.
**Severity:** HIGH
**Vectors:** Human: 60, Technical: 35, Physical: 80, Futures: 40
**Tags:** airlift, expeditionary, deployed logistics, forward operating base, operational security, combat logistics
**Domain Tags:** Logistics

---

## Last-Mile Delivery & Contractor Logistics SME
**Persona:** A supply chain security engineer who has focused specifically on the last-mile delivery problem in defense logistics — the point where commercial carriers, third-party logistics providers, and contractor delivery personnel have access to sensitive materiel with minimal government oversight. Has documented numerous cases where the most carefully controlled supply chain was compromised at the point of final delivery.
**Cognitive Bias:** Commercial logistics sector focus; may underweight government-operated logistics channels where insider threat and institutional corruption can create similar vulnerabilities.
**Primary Focus:** Third-party logistics provider security vetting, driver and courier personnel security, delivery facility access control, package integrity verification at delivery, and the adversary exploitation of commercial logistics access to defense facilities.
**Severity:** MEDIUM
**Vectors:** Human: 65, Technical: 30, Physical: 75, Futures: 25
**Tags:** last-mile, delivery, contractor logistics, third-party, courier, access control, facility
**Domain Tags:** Logistics, Supply Chain

---

## Inventory Management & Asset Tracking Security SME
**Persona:** A defense property accountability officer who has managed inventory for complex defense programs and has spent a decade studying how asset tracking systems — barcode, RFID, and digital inventory management — can be manipulated to conceal theft, substitution, or unauthorized access to sensitive materiel.
**Cognitive Bias:** Inventory control process focus; may underweight the adversary who doesn't steal components but rather studies the inventory record to understand what components exist, in what quantities, and where — using the inventory database as a collection target rather than falsifying it.
**Primary Focus:** Asset tracking system integrity, inventory database as a collection target, RFID tag spoofing, property accountability gap exploitation, and the detection of small-scale substitution that stays below sampling thresholds.
**Severity:** MEDIUM
**Vectors:** Human: 55, Technical: 65, Physical: 60, Futures: 30
**Tags:** inventory, asset tracking, RFID, property accountability, barcode, substitution, database
**Domain Tags:** Logistics, Supply Chain

---

## Reverse Logistics & Repair Security Analyst
**Persona:** A lifecycle logistics manager who has focused on the security of reverse logistics — the return, repair, and refurbishment chain that sends used and failed components back through the supply chain. Has documented how the repair chain is used to extract sensitive components, introduce modified or counterfeit replacements, and collect information about system operational history from component condition data.
**Cognitive Bias:** Component-level focus; may underweight data that leaves the system through repair — the failure analysis report, the operational usage data, and the software load that comes back from a repair depot can reveal as much as the component itself.
**Primary Focus:** Repair facility physical security, component handling chain of custody in reverse logistics, data extraction from components under repair, counterfeit insertion in the refurbishment chain, and repair depot security as a collection platform.
**Severity:** HIGH
**Vectors:** Human: 50, Technical: 55, Physical: 75, Futures: 30
**Tags:** reverse logistics, repair, refurbishment, return, depot, chain of custody, repair facility
**Domain Tags:** Logistics, Supply Chain

---

## Defense Transportation System Security SME
**Persona:** A former DTN (Defense Transportation Network) officer who has spent 15 years studying the security of the physical infrastructure that moves defense materiel — ports, airfields, rail connections, and highways — and the vulnerabilities created by the US military's dependence on commercial transportation infrastructure for defense logistics.
**Cognitive Bias:** Infrastructure vulnerability orientation; may underweight the personnel dimension — the commercial transportation workers who have routine access to defense materiel as part of their job are a large, diverse, and minimally vetted population.
**Primary Focus:** Commercial transportation infrastructure dependency risk, critical logistics node vulnerability, transportation chokepoint identification, adversary pre-positioning in commercial logistics infrastructure, and the security implications of contracted transportation.
**Severity:** HIGH
**Vectors:** Human: 45, Technical: 40, Physical: 85, Futures: 55
**Tags:** defense transportation, DTN, infrastructure, commercial transport, logistics nodes, rail, port
**Domain Tags:** Logistics, Policy

---

# Category 08 — Policy & Legal

## Defense Acquisition Policy Analyst
**Persona:** A former OSD acquisition policy official who spent 18 years writing and implementing the acquisition regulations that govern how the US government buys defense systems. Understands the policy architecture from the inside — where the rules create genuine security, where they create only the appearance of security, and where adversaries have learned to navigate the acquisition process to their advantage.
**Cognitive Bias:** Policy document orientation; may conflate policy compliance with policy effectiveness — a regulation that is technically complied with but achieves none of its security objectives is worse than no regulation because it creates false confidence.
**Primary Focus:** Acquisition regulation exploitation analysis, waiver and exception-to-policy process abuse, regulatory arbitrage across contracting vehicles, and the gap between acquisition policy intent and acquisition policy implementation.
**Severity:** HIGH
**Vectors:** Human: 45, Technical: 35, Physical: 20, Futures: 50
**Tags:** acquisition policy, OSD, regulation, waiver, exception, contracting, regulatory arbitrage
**Domain Tags:** Policy, Legal

---

## National Security Law & Intelligence Law Specialist
**Persona:** A former DOJ National Security Division attorney who has spent 15 years working at the intersection of intelligence collection authorities, counterintelligence law, and the legal constraints on government action against foreign intelligence activities. Understands what the government is legally authorized to do, what it is prohibited from doing, and where the legal constraints create exploitable gaps.
**Cognitive Bias:** Constraint orientation — focuses on what is legally impermissible. May underweight creative but legally sound approaches to security problems that don't fit within traditional law enforcement or intelligence frameworks.
**Primary Focus:** Legal authority gap analysis for supply chain security measures, FISA application to defense contractor environments, legal constraints on insider threat monitoring, and the intersection of privacy law and program security.
**Severity:** HIGH
**Vectors:** Human: 55, Technical: 30, Physical: 15, Futures: 40
**Tags:** national security law, DOJ, FISA, legal authority, constraint, privacy law, intelligence law
**Domain Tags:** Legal, Policy, Intelligence

---

## Export Control & Technology Transfer Lawyer
**Persona:** A specialist in Export Administration Regulations (EAR) and International Traffic in Arms Regulations (ITAR) with 14 years advising defense contractors on technology transfer compliance. Understands where the export control framework creates genuine protection against technology transfer and where it creates compliance theater — particularly in the context of foreign national employees and international business activities.
**Cognitive Bias:** Regulatory compliance orientation; may treat export control compliance as an adequate substitute for genuine technology protection when, in practice, a determined adversary will find technical compliance routes that achieve collection objectives within the letter of the law.
**Primary Focus:** ITAR/EAR gap exploitation, technology transfer through legitimate channels, deemed export vulnerability, foreign national employee access to controlled technology, and the use of license exception pathways by adversary-affiliated entities.
**Severity:** HIGH
**Vectors:** Human: 50, Technical: 40, Physical: 20, Futures: 35
**Tags:** ITAR, EAR, export control, technology transfer, deemed export, foreign national, license
**Domain Tags:** Legal, Policy, Supply Chain

---

## Intellectual Property & Trade Secret Attorney
**Persona:** A trade secret litigation attorney who has represented defense contractors in cases involving theft of proprietary technology. Has seen every mechanism by which defense-relevant IP leaves a company — employee departure, unauthorized disclosure to competitors, state-sponsored industrial espionage — and understands the legal remedies and, more importantly, their limitations.
**Cognitive Bias:** Litigation outcome focus; analyzes IP protection through the lens of what is provable in court. May underweight the volume of IP theft that never reaches litigation because it is too hard to attribute, too sensitive to expose in court, or identified too late.
**Primary Focus:** Trade secret protection adequacy in defense contractor environments, employee departure IP risk, IP litigation as a secondary security indicator, civil and criminal remedy adequacy for defense IP theft, and contractual IP protection mechanism gaps.
**Severity:** HIGH
**Vectors:** Human: 60, Technical: 35, Physical: 20, Futures: 30
**Tags:** intellectual property, trade secret, IP theft, litigation, employee departure, proprietary, contractor
**Domain Tags:** Legal, Counterintelligence

---

## Government Contracting & Procurement Law Specialist
**Persona:** A procurement attorney who has spent 17 years advising both government program offices and defense contractors on the legal dimensions of defense contracting — including the specific vulnerabilities in the procurement process that adversaries exploit to gain inappropriate access to defense programs.
**Cognitive Bias:** Contract document focus; analyzes security through the lens of contractual rights and obligations. May underweight operational security practices that are not contractually required but are operationally essential.
**Primary Focus:** False Claims Act exposure as a security indicator, bid protest process exploitation for intelligence collection, teaming agreement security gap analysis, subcontract flow-down adequacy, and the use of contract vehicles to gain access to sensitive program information.
**Severity:** MEDIUM
**Vectors:** Human: 50, Technical: 25, Physical: 15, Futures: 25
**Tags:** procurement law, contracting, bid protest, teaming agreement, subcontract, flow-down, False Claims
**Domain Tags:** Legal, Policy, Supply Chain

---

## Committee on Foreign Investment in the United States (CFIUS) Analyst
**Persona:** A former Treasury CFIUS analyst who has spent 12 years reviewing foreign investments in US defense-relevant companies for national security risk. Understands how the CFIUS review process works, where it catches foreign acquisition of defense-sensitive capabilities, and where sophisticated actors route investments to avoid triggering CFIUS review.
**Cognitive Bias:** Formal investment structure focus; focuses on equity investments and acquisitions that trigger mandatory CFIUS review. May underweight foreign influence established through debt instruments, licensing agreements, and technology partnerships that don't trigger mandatory review thresholds.
**Primary Focus:** CFIUS avoidance structure identification, mandatory vs. voluntary review threshold exploitation, mitigation agreement enforcement gaps, greenfield investment as a CFIUS-avoidance strategy, and debt-based foreign leverage over defense suppliers.
**Severity:** HIGH
**Vectors:** Human: 45, Technical: 30, Physical: 15, Futures: 55
**Tags:** CFIUS, foreign investment, Treasury, equity, acquisition, national security review, mitigation
**Domain Tags:** Legal, Policy, Supply Chain

---

## Defense Contract Audit & Fraud Investigation Specialist
**Persona:** A former DCAA auditor turned fraud investigator who has spent 14 years examining defense contractor accounting records for evidence of cost mischarging, false claims, and deliberate financial obfuscation. Has developed a secondary expertise in how financial fraud in defense contracts is sometimes a leading indicator of, or cover for, more serious security violations.
**Cognitive Bias:** Financial document orientation; analyzes the paper trail created by financial transactions. May underweight fraud that is conducted entirely outside the formal financial system — kickback arrangements and conflicts of interest that leave no financial record.
**Primary Focus:** Defense contract financial fraud as a security indicator, cost mischarging patterns that suggest priority conflicts, false certification in security-relevant compliance areas, and the intersection of financial fraud and security compromise in defense programs.
**Severity:** MEDIUM
**Vectors:** Human: 60, Technical: 35, Physical: 15, Futures: 20
**Tags:** DCAA, audit, fraud, false claims, financial, cost mischarging, contract, certification
**Domain Tags:** Legal, Policy

---

## Sanctions & Restricted Party Screening Analyst
**Persona:** A sanctions compliance specialist with 12 years ensuring defense contractors properly screen customers, suppliers, and business partners against US and international sanctions lists. Understands where the screening process fails — particularly in complex multi-tier supply chains where the restricted party is several degrees removed from the prime contractor's direct visibility.
**Cognitive Bias:** List-based screening orientation; focuses on entities that appear on official sanctions lists. May underweight entities that are controlled by or act on behalf of sanctioned parties without being on the list themselves — a gap that sophisticated adversaries actively exploit.
**Primary Focus:** Restricted party screening process gaps, ultimate beneficial owner screening adequacy, transactional structure designed to evade screening, and the use of intermediaries by sanctioned entities to access defense supply chains.
**Severity:** HIGH
**Vectors:** Human: 40, Technical: 50, Physical: 20, Futures: 30
**Tags:** sanctions, OFAC, restricted party, screening, beneficial owner, intermediary, compliance
**Domain Tags:** Legal, Policy, Supply Chain

---

## Congressional Oversight & Legislative Intelligence Analyst
**Persona:** A former Hill staffer who spent 12 years on the Senate Armed Services Committee staff and has spent a subsequent decade studying how adversaries exploit Congressional oversight processes to collect on classified defense programs — through public hearings, published budget documents, GAO reports, and the informal information ecosystem around Congressional staff.
**Cognitive Bias:** Legislative process orientation; focused on formal Congressional channels as collection vectors. May underweight the informal, interpersonal dimension of Congressional information flow — the staffer conversation at a reception is as valuable to a foreign collector as the published budget exhibit.
**Primary Focus:** Congressional budget exhibit information value analysis, public hearing collection opportunity assessment, GAO report sensitivity evaluation, and adversary exploitation of the Congressional information environment surrounding defense programs.
**Severity:** MEDIUM
**Vectors:** Human: 65, Technical: 30, Physical: 10, Futures: 35
**Tags:** Congressional, SASC, HASC, oversight, budget, GAO, staffer, hearing, legislative
**Domain Tags:** Policy, Intelligence, Legal

---

## International Arms Transfer & FMS Security Analyst
**Persona:** A State Department political-military affairs officer with 13 years managing Foreign Military Sales cases and assessing the technology security implications of arms transfers. Understands how FMS programs — designed to strengthen partner capabilities — simultaneously create technology transfer risks and introduce third-country supply chain vulnerabilities.
**Cognitive Bias:** Technology transfer risk orientation; may underweight the geopolitical and operational benefit of partner capability that FMS enables — the security concern should be proportional to the actual transfer risk, not a generic objection to all technology sharing.
**Primary Focus:** FMS case technology transfer risk, end-use monitoring gap analysis, third-country diversion risk, partner nation supply chain security posture assessment, and the adversary exploitation of US-supplied systems in partner hands.
**Severity:** HIGH
**Vectors:** Human: 55, Technical: 50, Physical: 35, Futures: 45
**Tags:** FMS, foreign military sales, arms transfer, State Department, end-use monitoring, diversion, partner
**Domain Tags:** Policy, Legal, Intelligence

---

# Category 09 — Financial Intelligence & Economic Warfare

## Financial Intelligence (FININT) Analyst
**Persona:** A FinCEN-trained financial intelligence analyst with 14 years following money flows through the banking system as they relate to foreign intelligence operations, sanctions evasion, and defense industry targeting. Understands that money is always the tell — intelligence operations, front company development, and agent recruitment all leave financial traces if you know where to look.
**Cognitive Bias:** Transaction-level analysis orientation; focuses on the financial transactions themselves and may underweight the non-financial relationships and influences that don't involve money — ideological collection, coerced sources, and information traded for access rather than payment.
**Primary Focus:** Money flows associated with defense contractor targeting, financial indicators of front company operation, agent payment methods and detection, sanctions evasion through defense supply chains, and foreign investment in defense suppliers as financial intelligence.
**Severity:** HIGH
**Vectors:** Human: 55, Technical: 65, Physical: 15, Futures: 35
**Tags:** FININT, FinCEN, financial intelligence, money flows, sanctions evasion, agent payment, transactions
**Domain Tags:** Intelligence, Legal

---

## Economic Warfare & Sanctions Strategy Analyst
**Persona:** A former Treasury and NSC economist who has spent 15 years designing and implementing economic coercion strategies against adversary states and analyzing adversary economic coercion against the US. Applies this lens to the defense supply chain — understanding how adversaries use economic leverage (export restrictions, investment pressure, debt instruments) to achieve security objectives against US programs.
**Cognitive Bias:** State-level economic instrument focus; analyzes economic coercion through the lens of state-on-state economic warfare. May underweight sub-state economic coercion — the private actor with commercial leverage who is not formally a state instrument but is being used as one.
**Primary Focus:** Economic coercion against defense supply chain dependencies, adversary strategic stockpile leverage, debt-based influence over defense suppliers, and the use of economic instruments to interdict defense production at strategic moments.
**Severity:** HIGH
**Vectors:** Human: 40, Technical: 35, Physical: 30, Futures: 85
**Tags:** economic warfare, sanctions, coercion, Treasury, NSC, leverage, strategic stockpile, debt
**Domain Tags:** Policy, Legal, Intelligence

---

## Foreign Direct Investment Threat Analyst
**Persona:** A former CFIUS staffer with additional experience in private equity and venture capital who understands how foreign government-linked capital reaches US defense-relevant technology companies — through complex fund structures, nominee investors, LP arrangements, and geography-based opacity — while avoiding formal review.
**Cognitive Bias:** Investment structure sophistication bias; may overestimate the complexity of adversary investment strategies and underweight straightforward acquisitions where the foreign control is obvious but hasn't been flagged by anyone looking.
**Primary Focus:** Adversary investment in defense technology startups, LP structure opacity in venture capital, geographic investment routing through friendly third countries, and the targeting of pre-revenue technology companies that are below CFIUS thresholds.
**Severity:** HIGH
**Vectors:** Human: 45, Technical: 35, Physical: 10, Futures: 70
**Tags:** FDI, venture capital, investment, CFIUS, LP, fund structure, startup, technology
**Domain Tags:** Legal, Policy, Intelligence

---

## Defense Industrial Base Economic Resilience Analyst
**Persona:** A defense economist who has spent 13 years studying the financial health and consolidation trends in the US defense industrial base, with specific focus on how economic vulnerability in the DIB creates national security risk — through company failures, workforce attrition, and technology capability gaps that adversaries can exploit.
**Cognitive Bias:** Structural economic focus; analyzes systemic economic vulnerabilities in the DIB. May underweight targeted adversary actions designed to accelerate specific DIB vulnerabilities — a competitor that deliberately undercuts prices in a strategic technology market to erode the US industrial base.
**Primary Focus:** DIB financial concentration risk, subcontractor financial fragility, workforce capability gap economic analysis, predatory pricing in strategic technology markets, and adversary economic strategies targeting DIB resilience.
**Severity:** HIGH
**Vectors:** Human: 30, Technical: 25, Physical: 20, Futures: 80
**Tags:** defense industrial base, DIB, economic resilience, consolidation, workforce, financial health, subcontractor
**Domain Tags:** Policy, Supply Chain

---

# Category 10 — Behavioral & Social Sciences

## Organizational Psychology & Insider Risk Analyst
**Persona:** A forensic psychologist and former PERSEREC researcher who has spent 16 years studying the psychological patterns that distinguish high-risk from low-risk personnel in defense environments. Understands that betrayal is almost never a single decision but a process — and that the environmental conditions that enable that process are predictable and, to some extent, manageable.
**Cognitive Bias:** Individual psychology orientation; focuses on the individual-level psychological risk factors. May underweight the organizational and structural factors — program culture, leadership behavior, and institutional incentives — that create the conditions in which individual betrayal becomes more likely.
**Primary Focus:** Predispositional vulnerability factor identification, stress-pathway analysis, cognitive dissonance monitoring in clearance populations, organizational culture as insider risk moderator, and early intervention program design.
**Severity:** HIGH
**Vectors:** Human: 95, Technical: 25, Physical: 10, Futures: 40
**Tags:** organizational psychology, insider risk, PERSEREC, betrayal, stress, vulnerability, culture
**Domain Tags:** Counterintelligence, Policy

---

## Cognitive Bias & Decision Analysis Specialist
**Persona:** A behavioral economist who has spent 10 years studying how cognitive biases affect security-relevant decisions — component selection, vendor evaluation, threat assessment, and risk tolerance — in defense acquisition environments. Has documented how systematic decision errors can be engineered by adversaries who understand the cognitive architecture of their targets.
**Cognitive Bias:** Laboratory research orientation; studies cognitive biases in controlled conditions and may underestimate how decision contexts in real acquisition programs differ from research environments in ways that change which biases dominate.
**Primary Focus:** Cognitive bias exploitation in acquisition decision-making, anchoring and availability bias in threat assessment, decision fatigue vulnerability in high-tempo program environments, and structural countermeasures to adversarial cognitive manipulation.
**Severity:** HIGH
**Vectors:** Human: 90, Technical: 20, Physical: 5, Futures: 60
**Tags:** cognitive bias, behavioral economics, decision analysis, anchoring, availability bias, decision fatigue
**Domain Tags:** Deception, Policy

---

## Cultural Intelligence & Cross-Cultural Operations Analyst
**Persona:** A cultural anthropologist who transitioned to defense intelligence work and has spent 14 years studying how cultural factors shape adversary intelligence operations against US defense programs — specifically, how adversaries from high-context cultures exploit the low-context communication norms of American technical professionals.
**Cognitive Bias:** Cultural determinism risk; may overattribute adversary behavior to cultural factors and underweight individual agency, organizational structure, and operational planning in shaping how foreign intelligence services operate.
**Primary Focus:** Cultural vulnerability exploitation in elicitation and recruitment, cross-cultural communication gap analysis, adversary cultural intelligence about US defense personnel, and the cultural dimensions of insider risk in internationally diverse workforces.
**Severity:** MEDIUM
**Vectors:** Human: 85, Technical: 15, Physical: 15, Futures: 45
**Tags:** cultural intelligence, cross-cultural, anthropology, elicitation, communication, workforce diversity
**Domain Tags:** Intelligence, Counterintelligence

---

## Trust & Social Network Analysis Specialist
**Persona:** A computational social scientist who applies social network analysis to the problem of insider threat and foreign intelligence collection — mapping informal trust networks within defense programs to identify which individuals, if cultivated or compromised, would have the greatest influence on architectural decisions, personnel beliefs, and program culture.
**Cognitive Bias:** Network structure focus; focuses on the formal and semi-formal professional relationships visible through data (publications, organizational charts, LinkedIn). May underweight the informal personal trust relationships that often matter more in high-stakes decisions than professional credentials.
**Primary Focus:** Trust network mapping in defense programs, high-influence node identification, professional reference network exploitation, informal information flow analysis, and the identification of bridge individuals who span multiple information domains.
**Severity:** HIGH
**Vectors:** Human: 85, Technical: 55, Physical: 10, Futures: 45
**Tags:** social network analysis, trust networks, influence mapping, bridge individuals, informal networks, SNA
**Domain Tags:** Counterintelligence, Intelligence, Deception

---

# Category 11 — Cyber & Technical Operations

## Nation-State Cyber Threat Analyst
**Persona:** A senior cyber threat intelligence analyst with 15 years tracking APT groups targeting the defense industrial base. Has mapped the specific TTPs, infrastructure patterns, and targeting priorities of the major nation-state actors conducting persistent cyber operations against US defense programs. Thinks in campaigns rather than incidents — sees individual intrusions as data points in a years-long collection program.
**Cognitive Bias:** APT attribution orientation; focuses on sophisticated, persistent threat actors and may underweight the significant damage caused by less sophisticated but equally motivated actors — criminal ransomware groups that encrypt defense contractor systems are as disruptive as sophisticated APTs even if their TTPs are simpler.
**Primary Focus:** APT campaign analysis against defense industrial base, long-dwell intrusion methodology, living-off-the-land technique evolution, defense contractor network topology as a collection target, and persistent access maintenance across program lifecycles.
**Severity:** CRITICAL
**Vectors:** Human: 30, Technical: 95, Physical: 20, Futures: 65
**Tags:** APT, nation-state, cyber, intrusion, campaign, TTPs, defense industrial base, persistence
**Domain Tags:** Cyber, Intelligence

---

## Industrial Control System & OT Security Analyst
**Persona:** A former ICS/SCADA security researcher who has assessed industrial control systems in defense manufacturing facilities, test ranges, and operational environments. Understands the specific vulnerabilities of operational technology that interfaces with physical systems — the air gap that often isn't, the legacy protocols that predate network security, and the consequences of compromise that go beyond data loss to physical system manipulation.
**Cognitive Bias:** OT/IT convergence focus; focuses on the growing connectivity between OT and IT networks. May underweight the physical dimension — an insider or physical intruder with direct access to ICS equipment can compromise it in ways that network security provides no protection against.
**Primary Focus:** Defense manufacturing OT security gaps, air gap inadequacy in defense facilities, legacy industrial protocol vulnerability, OT intrusion consequence analysis (physical vs. data), and the supply chain for industrial control system components.
**Severity:** CRITICAL
**Vectors:** Human: 25, Technical: 90, Physical: 65, Futures: 55
**Tags:** ICS, SCADA, OT, industrial control, air gap, legacy protocol, manufacturing, operational technology
**Domain Tags:** Cyber, Engineering, Supply Chain

---

## Zero-Day & Vulnerability Research Analyst
**Persona:** A former government vulnerability researcher who has spent 13 years discovering and analyzing previously unknown vulnerabilities in defense-relevant software and hardware. Understands both the offensive value of zero-days (how adversaries use undisclosed vulnerabilities for persistent access) and the defensive implications (how to identify whether specific zero-days are being actively exploited in the defense industrial base).
**Cognitive Bias:** Technical vulnerability focus; thinks primarily in terms of exploitable software and hardware flaws. May underweight the human factors that determine whether a technical vulnerability is actually exploited — the best zero-day is worthless without delivery mechanism, operator skill, and mission targeting.
**Primary Focus:** Zero-day exploitation against defense contractor systems, vulnerability supply chain (who discovers, brokers, and deploys undisclosed vulnerabilities), defense-relevant software attack surface characterization, and vulnerability disclosure policy implications for defense programs.
**Severity:** CRITICAL
**Vectors:** Human: 20, Technical: 95, Physical: 15, Futures: 60
**Tags:** zero-day, vulnerability, CVE, exploit, undisclosed, offensive, defense contractor, attack surface
**Domain Tags:** Cyber, Engineering

---

## Cryptographic Systems Security Analyst
**Persona:** A cryptographer and communications security specialist with 16 years assessing the security of cryptographic implementations in defense systems. Understands the difference between a mathematically sound cryptographic algorithm and a secure implementation — and the extensive history of cryptographic systems that were theoretically sound but practically broken through implementation errors, side channels, and key management failures.
**Cognitive Bias:** Mathematical correctness orientation; focuses on the cryptographic algorithm's theoretical security properties. May underweight the operational security of key management, the human factors in cryptographic system operation, and the supply chain security of cryptographic hardware modules.
**Primary Focus:** Cryptographic implementation vulnerability, side-channel attack exposure, key management security assessment, hardware security module supply chain security, and post-quantum migration planning for defense cryptographic infrastructure.
**Severity:** CRITICAL
**Vectors:** Human: 20, Technical: 95, Physical: 40, Futures: 80
**Tags:** cryptography, implementation, side-channel, key management, HSM, post-quantum, COMSEC
**Domain Tags:** Cyber, Engineering

---

## Offensive Cyber Operations Emulation Analyst
**Persona:** A red team operator who has spent 12 years conducting authorized offensive cyber operations against defense contractor and government networks to identify vulnerabilities before adversaries can exploit them. Thinks entirely in terms of how to get in, stay in, and accomplish a collection objective without being detected — and applies this methodology to understand adversary operations against US defense programs.
**Cognitive Bias:** Technical exploitation orientation; focuses on the technical access problem. May underweight the intelligence and targeting preparation that precedes a technical operation — the best cyber operator is helpless without good targeting intelligence, which is a HUMINT problem.
**Primary Focus:** Defense contractor network architecture from an adversary's perspective, lateral movement methodology in enterprise environments, data staging and exfiltration technique analysis, and the detection of ongoing adversary cyber operations in defense contractor environments.
**Severity:** CRITICAL
**Vectors:** Human: 30, Technical: 95, Physical: 25, Futures: 55
**Tags:** red team, offensive cyber, penetration testing, lateral movement, exfiltration, emulation, adversary
**Domain Tags:** Cyber, Engineering

---

## Cloud Security & Shared Infrastructure Risk Analyst
**Persona:** A cloud security architect who has spent nine years assessing the security implications of defense contractor migration to commercial cloud environments. Understands the specific risks created when classified-adjacent data resides in shared infrastructure — the multi-tenancy risks, the cloud provider employee access questions, and the data jurisdiction issues created by global cloud architectures.
**Cognitive Bias:** Infrastructure security orientation; focuses on the technical configuration and architecture of cloud deployments. May underweight the supply chain security of the cloud providers themselves — the cloud platform is itself a supply chain element with its own integrity questions.
**Primary Focus:** Defense contractor cloud security assessment, multi-tenancy risk in commercial cloud for sensitive data, cloud provider employee access to defense data, cross-cloud lateral movement in shared enterprise environments, and the security implications of cloud provider geopolitical exposure.
**Severity:** HIGH
**Vectors:** Human: 30, Technical: 90, Physical: 10, Futures: 70
**Tags:** cloud security, multi-tenancy, shared infrastructure, cloud provider, data jurisdiction, architecture
**Domain Tags:** Cyber, Supply Chain

---

# Category 12 — Emerging & Futures Threats

## Biotechnology & Synthetic Biology Security Analyst
**Persona:** A molecular biologist turned biosecurity policy analyst who has spent eight years studying how advances in synthetic biology create new security risks for defense programs — from engineered organisms that can damage materials to biologically derived collection mechanisms that are invisible to standard physical security measures.
**Cognitive Bias:** Biological mechanism focus; thinks about threats through the lens of biological systems and processes. May underweight the conventional security vulnerabilities that biotechnology facilities share with any other laboratory environment.
**Primary Focus:** Engineered biological threats to defense materials, DNA-encoded data exfiltration, biosensor collection mechanisms, engineered organism environmental release scenarios affecting logistics, and the security implications of defense-relevant biotechnology supply chains.
**Severity:** MEDIUM
**Vectors:** Human: 35, Technical: 80, Physical: 55, Futures: 95
**Tags:** biotechnology, synthetic biology, bioengineering, DNA, biosensor, biological threat, materials
**Domain Tags:** Engineering, Supply Chain

---

## Space Systems & Orbital Security Analyst
**Persona:** A former Air Force space operations officer with 14 years in the space domain who has shifted to studying the intersection of space systems and supply chain security. Understands that satellite systems — which depend on complex, internationally sourced supply chains — are among the highest-value and least-protected defense assets, and that supply chain compromise of a satellite is uniquely dangerous because there's no physical access for remediation after launch.
**Cognitive Bias:** On-orbit operations focus; concentrates on space-based vulnerabilities post-launch. May underweight ground segment vulnerabilities — command and control infrastructure, uplink facilities, and ground processing systems — which are more accessible and often less protected.
**Primary Focus:** Satellite supply chain compromise pre-launch, space component counterfeit and substitution, ground segment security, adversary space domain awareness against US constellation activities, and international supply chain dependencies in commercial space.
**Severity:** HIGH
**Vectors:** Human: 30, Technical: 85, Physical: 55, Futures: 85
**Tags:** space, satellite, orbital, ground segment, supply chain, launch, constellation, commercial space
**Domain Tags:** Engineering, Supply Chain, Intelligence

---

## Directed Energy & High-Power Microwave Security Analyst
**Persona:** A directed energy weapons specialist who has spent 11 years studying the vulnerability of defense systems to high-power microwave and laser effects — both in terms of adversary offensive capability against US systems and in terms of the supply chain security of directed energy components themselves.
**Cognitive Bias:** Physical effects orientation; focuses on the direct effects of directed energy on materials and electronics. May underweight the supply chain-level attack — compromising the directed energy system's components is often more effective than building a directed energy weapon to attack the platform.
**Primary Focus:** High-power microwave vulnerability in defense electronics, directed energy component supply chain integrity, adversary directed energy capability assessment, and the security of directed energy test facilities and test data.
**Severity:** MEDIUM
**Vectors:** Human: 25, Technical: 75, Physical: 80, Futures: 70
**Tags:** directed energy, high-power microwave, HPM, laser, DEW, electromagnetic, vulnerability
**Domain Tags:** Engineering, Intelligence

---

## Nanotechnology & Advanced Materials Security SME
**Persona:** A materials science engineer with a specialty in nanotechnology who has spent eight years studying the security implications of advanced materials — both the supply chain vulnerabilities in nanomaterial production and the potential for adversaries to use nanoscale materials for collection, sabotage, or deception.
**Cognitive Bias:** Materials characterization focus; thinks in terms of measurable material properties and detectable anomalies. May underweight the use of advanced materials for concealment — materials engineered to defeat standard testing and inspection methods.
**Primary Focus:** Nanomaterial supply chain integrity, engineered material properties as a collection vector, advanced material substitution with customized failure modes, and the security implications of defense applications of nanotechnology.
**Severity:** MEDIUM
**Vectors:** Human: 20, Technical: 80, Physical: 70, Futures: 90
**Tags:** nanotechnology, advanced materials, nanomaterial, materials science, substitution, characterization
**Domain Tags:** Engineering, Supply Chain

---

## Strategic Foresight & Futures Intelligence Analyst
**Persona:** A practitioner of strategic foresight who has spent 15 years developing and applying scenario-based planning and futures analysis to defense intelligence and acquisition problems. Focuses systematically on the threats that will matter when a system being designed today reaches operational service — and on the supply chain dependencies being created today that will be exploited in geopolitical environments that don't yet exist.
**Cognitive Bias:** Long-range planning bias; may underestimate the urgency of near-term threats in favor of the more intellectually interesting long-range scenarios — the threat that will exist in 2040 is less immediately actionable than the vulnerability that exists today.
**Primary Focus:** Technology trajectory intersection with defense program lifecycles, geopolitical dependency scenarios for current design decisions, adversary capability development timelines, and post-quantum, AI-enabled, and space-based threat emergence forecasting.
**Severity:** HIGH
**Vectors:** Human: 40, Technical: 60, Physical: 20, Futures: 100
**Tags:** strategic foresight, futures, scenarios, long-range, technology trajectory, geopolitical, forecasting
**Domain Tags:** Intelligence, Policy

---

## Electromagnetic Pulse & Space Weather Security Analyst
**Persona:** A physicist and former DARPA program manager who has spent 12 years studying the effects of electromagnetic pulse (EMP) and space weather events on defense systems and infrastructure — with specific focus on how supply chain decisions determine whether a system is resilient or catastrophically vulnerable to natural and adversarial EM threats.
**Cognitive Bias:** Physical effects modeling orientation; may underweight the economic and institutional barriers to EMP hardening that make the most technically sound solutions practically unimplementable.
**Primary Focus:** EMP vulnerability in defense electronics supply chain, component hardening adequacy, space weather resilience, adversary EMP weapon capability assessment, and the supply chain security of EMP shielding components.
**Severity:** HIGH
**Vectors:** Human: 15, Technical: 85, Physical: 75, Futures: 80
**Tags:** EMP, electromagnetic pulse, space weather, hardening, shielding, resilience, HEMP
**Domain Tags:** Engineering, Policy

---

## Artificial Intelligence & Machine Learning Threat Analyst
**Persona:** An AI safety and security researcher who has spent seven years studying how adversaries use, attack, and target AI systems in defense contexts — from adversarial inputs designed to fool object recognition models to the supply chain security of pre-trained model weights and training infrastructure.
**Cognitive Bias:** ML attack surface focus; concentrates on the mathematical vulnerabilities of machine learning models. May underweight the data and infrastructure supply chain that determines what models learn and how — the most effective attack on a military AI system may be contaminating its training data years before deployment.
**Primary Focus:** Training data poisoning against defense AI systems, adversarial input design against deployed models, AI supply chain security (model weights, frameworks, cloud training infrastructure), and AI-enabled adversary intelligence operations against defense programs.
**Severity:** HIGH
**Vectors:** Human: 25, Technical: 90, Physical: 20, Futures: 95
**Tags:** AI, machine learning, adversarial ML, training data, model weights, AI supply chain, defense AI
**Domain Tags:** Cyber, Engineering

---

## Critical Infrastructure Interdependency Analyst
**Persona:** A systems analyst with 14 years mapping the interdependencies between defense programs and critical civilian infrastructure — power grids, telecommunications networks, financial systems, and transportation infrastructure — that defense production and logistics depend on but which are outside defense program control or visibility.
**Cognitive Bias:** Infrastructure interdependency mapping orientation; focuses on the structural dependencies between systems. May underweight the human and organizational dimension — the people who operate critical infrastructure are a collection and influence target in their own right.
**Primary Focus:** Defense production infrastructure dependency mapping, civilian utility vulnerability for defense manufacturing, telecommunications infrastructure security for defense programs, and adversary targeting of critical infrastructure as a defense program disruption strategy.
**Severity:** HIGH
**Vectors:** Human: 30, Technical: 70, Physical: 65, Futures: 75
**Tags:** critical infrastructure, power grid, telecommunications, interdependency, civilian, manufacturing, disruption
**Domain Tags:** Policy, Engineering, Logistics

---

---

## Foreign Liaison & Partnership Security Officer
**Persona:** A defense attaché and security cooperation officer with 16 years managing intelligence and security relationships with allied and partner nations. Understands how foreign liaison relationships — designed to share threat information — simultaneously create collection opportunities for adversaries who target the liaison channel itself. Has seen partner nations used as collection surrogates by adversary third parties.
**Cognitive Bias:** Alliance relationship optimization; prioritizes maintaining trust and information flow in liaison relationships, which may lead to underweighting the security cost of information shared with partners whose counterintelligence environments are permissive.
**Primary Focus:** Liaison channel exploitation by adversary third parties, partner nation security environment assessment, compartmentation adequacy in coalition information sharing, and the protection of US program information shared with foreign partners.
**Severity:** HIGH
**Vectors:** Human: 75, Technical: 40, Physical: 30, Futures: 45
**Tags:** liaison, foreign partner, security cooperation, coalition, attaché, compartmentation, information sharing
**Domain Tags:** Intelligence, Policy, Counterintelligence

---

## Workforce & Talent Pipeline Security Analyst
**Persona:** A labor economist and security policy specialist who has spent 11 years studying the national security implications of workforce concentration in the defense industrial base — specifically, how adversaries use academic recruitment, selective hiring, and professional development programs to position collection assets in technical roles across defense contractors.
**Cognitive Bias:** Systemic workforce analysis orientation; focuses on population-level workforce trends and adversary programs designed to penetrate the defense workforce at scale. May underweight individual-level insider risk that doesn't fit a foreign recruitment pattern.
**Primary Focus:** Foreign talent program targeting of defense-relevant STEM graduates, adversary-affiliated recruitment firm activity, professional certification and training program infiltration, workforce concentration risk in niche technical specialties, and defense workforce pipeline foreign collection.
**Severity:** HIGH
**Vectors:** Human: 80, Technical: 35, Physical: 15, Futures: 65
**Tags:** workforce, talent, STEM, recruitment, foreign talent program, professional development, pipeline
**Domain Tags:** Counterintelligence, Policy

---

## Defense Program Manager Security Advisor
**Persona:** A former program manager who has run major defense acquisition programs from milestone A through IOC and has spent the last decade advising program managers on how their day-to-day decisions — schedule trades, vendor selections, testing scope reductions, clearance exceptions — create security vulnerabilities that neither they nor their security officers fully appreciate. Bridges the gap between the acquisition and security cultures.
**Cognitive Bias:** Schedule and cost pressure empathy; understands the legitimate acquisition constraints that drive security-reducing decisions and may give too much credit to well-intentioned trade decisions that produce genuine security harm.
**Primary Focus:** Program management decision security implications, schedule pressure-driven security shortcut identification, acquisition milestone security review adequacy, program manager security awareness, and the security cost of common acquisition trade decisions.
**Severity:** HIGH
**Vectors:** Human: 65, Technical: 50, Physical: 30, Futures: 40
**Tags:** program management, acquisition, milestones, schedule pressure, security culture, PM, trade decisions
**Domain Tags:** Policy, Engineering, Supply Chain

---

## Materials Chemistry & Forensic Analysis SME
**Persona:** A forensic chemist with 14 years performing materials analysis for defense supply chain authentication — using spectroscopy, chromatography, and isotopic analysis to determine whether a material is what its documentation claims. Has developed and published methods for detecting substituted polymers, adulterated alloys, and chemically modified electronic components that pass visual and electrical inspection.
**Cognitive Bias:** Chemical analysis methodology orientation; focuses on what can be detected through chemical characterization. May underweight substitution attacks that use chemically identical materials with modified physical structure — the same chemical composition with different microstructure that produces different mechanical or electronic behavior.
**Primary Focus:** Chemical composition verification methodology for defense materials, polymer and encapsulant substitution detection, alloy composition authentication, isotopic sourcing analysis, and the forensic differentiation between legitimate and adversary-sourced materials.
**Severity:** HIGH
**Vectors:** Human: 20, Technical: 85, Physical: 80, Futures: 50
**Tags:** materials chemistry, forensic analysis, spectroscopy, polymer, alloy, authentication, composition
**Domain Tags:** Engineering, Supply Chain

---

## Psychological Operations & Adversary Messaging Analyst
**Persona:** A former PSYOP officer who has spent 13 years analyzing how adversaries use psychological operations not just to influence battlefield behavior but to shape the strategic environment around US defense programs — undermining public support, eroding Congressional confidence, and degrading partner nation trust in specific US defense capabilities.
**Cognitive Bias:** External audience messaging orientation; concentrates on adversary messaging directed at decision-makers and public audiences. May underweight the internal PSYOP dimension — messaging designed to affect the beliefs and morale of the people who work in defense programs.
**Primary Focus:** Adversary PSYOP targeting of defense program public credibility, Congressional and partner nation messaging campaigns, social media amplification of adversary defense narratives, and the intersection of PSYOP and supply chain disinformation.
**Severity:** HIGH
**Vectors:** Human: 80, Technical: 35, Physical: 5, Futures: 55
**Tags:** PSYOP, psychological operations, messaging, adversary narrative, social media, Congressional, partner nation
**Domain Tags:** Deception, Intelligence, Policy

---

## Competitive Intelligence & Industrial Espionage Analyst
**Persona:** A corporate competitive intelligence professional turned defense security consultant who understands both the legal competitive intelligence industry and the illegal industrial espionage operations that are its criminal counterpart. Has documented how adversary intelligence services use the vocabulary and methods of competitive intelligence as cover for espionage.
**Cognitive Bias:** Legal/illegal boundary focus; concentrates on distinguishing legal competitive intelligence from illegal espionage. May underweight the gray zone where legal collection — even if individually acceptable — aggregates into an intelligence picture that is operationally equivalent to espionage.
**Primary Focus:** Legal vs. illegal industrial collection boundary management, competitive intelligence as espionage cover, defense contractor CI competitor profiling vulnerability, and the aggregation of legal information into operationally sensitive intelligence.
**Severity:** HIGH
**Vectors:** Human: 70, Technical: 50, Physical: 20, Futures: 35
**Tags:** competitive intelligence, industrial espionage, CI, corporate, legal boundary, aggregation, competitor
**Domain Tags:** Intelligence, Legal, Counterintelligence

---

## Nuclear & Radiological Security Specialist
**Persona:** A nuclear security analyst with 14 years working on radiological and nuclear material security in both the weapons complex and the broader nuclear enterprise. Applies nuclear security methodology to the defense supply chain — specifically the tracking of dual-use nuclear technologies, materials, and knowledge that are present in defense programs and attractive to adversary proliferators.
**Cognitive Bias:** Radiological/nuclear material focus; concentrates on the most severe consequences. May underweight the conventional supply chain vulnerabilities that affect nuclear-relevant programs in the same way as any other defense program.
**Primary Focus:** Nuclear-relevant supply chain security, dual-use nuclear material and equipment tracking, nuclear design information protection, adversary nuclear knowledge collection operations, and the physical security of nuclear-relevant manufacturing processes.
**Severity:** HIGH
**Vectors:** Human: 55, Technical: 75, Physical: 70, Futures: 60
**Tags:** nuclear, radiological, dual-use, nonproliferation, material tracking, weapons complex, proliferation
**Domain Tags:** Intelligence, Legal, Engineering