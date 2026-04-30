import { PurchaseOrderStoreService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PurchaseOrderStoreServices.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

var baseUrl = sessionStorage.getItem('AppBaseURL');

// ─── GENERAL TERMS & CONDITIONS ───────────────────────────────────────────────
// Change the text below to customise the printed terms for each document type.

const PURCHASE_CONDITION = `
1. Scope of Supply
This Purchase Order, along with its schedules, annexures, and appended documentation ("Order"), constitutes the entire contract for the Supply of the Equipment. The Supplier shall perform this Order by providing in full the design, engineering, procurement, manufacturing, production, assembly, testing, packaging, transportation, and delivery ("Supply") of the Equipment set out in the Order at the Delivery Site, in accordance with: (i) Applicable Laws (including all Indian laws and GST regulations); (ii) Good Industry Practices; (iii) the Technical Specifications (Annexure 2); (iv) the Delivery Schedule (Annexure 1); and (v) all other terms and conditions herein.

2. Precedence of Documents
The Order and the General Terms and Conditions are intended to complement one another and should be interpreted harmoniously. In case of any inconsistency, the following descending order of precedence shall apply:
1st – Purchase Order
2nd – Special Conditions of Contract / SCC
3rd – General Terms and Conditions
4th – Technical Specifications
5th – Other Schedules

3. Order Value / Price
The Order Value is a lump-sum, non-escalating price in INR (Indian Rupees), inclusive of all applicable Taxes and Duties including GST (IGST / CGST / SGST / UGST), as applicable. The Order Value covers all costs including: (a) design, manufacturing, testing, and packaging; (b) loading and transportation to Delivery Site; (c) rectification of Defects during the Warranty Period; (d) issuance and maintenance of the Performance Bank Guarantee; and (e) all other obligations reasonably inferable under Good Industry Practices.
The Supplier has satisfied itself as to the correctness and sufficiency of the Order Value and shall not be entitled to claim any increase unless documented verifiable expenditure is demonstrated.

4. Statutory Variations for Taxes and Duties
The Order Value is inclusive of all applicable Taxes, duties, and levies including GST. The Purchaser shall deduct Tax at Source (TDS) on payments to the Supplier as required under Applicable Laws and issue TDS certificates accordingly.
Any upward statutory variation in GST rates applicable after the Order Date shall be reimbursed by the Purchaser at actuals upon submission of proof of payment. Any downward statutory variation in GST rates shall be passed on to the Purchaser.
The Supplier shall strictly comply with all Indian taxation laws, file all GST returns (GSTR-1, GSTR-3B, etc.) on time, and remit all Taxes within the prescribed timelines. Failure to upload invoices on the GSTN portal within prescribed timelines shall authorise the Purchaser to deduct the equivalent Tax amount from amounts payable to the Supplier.
In case any Claims are made against the Purchaser or Losses are suffered by the Purchaser on account of the Supplier's non-compliance with Tax laws, the Supplier shall indemnify and hold harmless the Purchaser Indemnified Parties, and such Losses shall be recoverable by deduction from amounts payable to the Supplier.

5. Effective Date of Contract
The effective date of this Order ("Effective Date") is the date of execution of this Order by both Parties, as stated in the Purchase Order.

6. Delivery / Performance
The Supplier shall be responsible for packaging, loading, and transportation of the Equipment from the Supplier's manufacturing facility / warehouse to the Delivery Site, in accordance with the Delivery Schedule (Annexure 1) and as per the agreed Incoterms.
TIME IS THE ESSENCE OF THIS ORDER. If the Supplier fails to deliver the Equipment by the Delivery Date, the Purchaser may at its sole discretion: (a) treat the Order as cancelled and recover all losses from the Supplier; or (b) procure the Equipment from alternate suppliers at the Supplier's risk, cost, and responsibility, and the Supplier shall pay the difference in price plus all additional losses suffered by the Purchaser.
The Supplier shall provide an E-Way Bill and all required GST documentation in advance of despatch. All damaged Equipment shall be replaced by the Supplier at no cost to the Purchaser. The Supplier shall keep the Purchaser informed about the arrival of Equipment at the Delivery Site.

7. Liquidated Damages
a) Delay Liquidated Damages for delay in Supply beyond the Delivery Date shall be levied at [●]% of the Order Value per week (or part thereof, pro-rata), capped at a maximum of [●]% of the Order Value ("Delay LDs"). Delay LDs are over and above the maximum overall liability cap.
b) The Parties agree that any sums payable hereunder are liquidated damages, not a penalty, and are a genuine pre-estimate of Loss. Payment of Delay LDs shall not prejudice the Purchaser's right to terminate the Order, nor release the Supplier from any payment obligations.
c) Liquidated Damages shall be recovered by deduction from any amounts due to the Supplier. The Purchaser may also make additional claims for any deficit amount not so recovered.

8. Performance Bank Guarantee
a) Prior to commencement of the Warranty Period, the Supplier shall provide an unconditional, irrevocable, on-demand Performance Bank Guarantee ("PBG") for [●]% of the Order Value, to secure the Supplier's obligations during the Warranty Period.
b) The PBG shall be valid until expiry of the Warranty Period (as may be extended) ("PBG Validity Period") plus an additional claim period of 1 (one) month ("PBG Claim Period").
c) The Purchaser may draw multiple times on the PBG if the Supplier fails to pay any amounts due to the Purchaser within 15 Business Days of written demand, or fails to fulfil its Warranty Period obligations.
d) If the Supplier fails to extend the PBG at least 15 Business Days before expiry, the Purchaser may drawdown the full PBG amount and retain it as cash security until a valid extension is submitted.
e) The PBG shall be extended as instructed by the Purchaser. All costs of providing, maintaining, or renewing the PBG shall be borne by the Supplier.
f) The Purchaser shall be entitled to assign the PBG in favour of its Lenders with prior intimation to the issuing bank.

9. Standard of Care / Defects Liability
The Supplier warrants that the Equipment shall: (a) strictly conform to the Technical Specifications and requirements of this Order; and (b) be new, free from Defects, and fit for the intended purpose ("Warranty").

During the Warranty Period (as specified in the Order), the Supplier shall, at its own cost, remedy any Defect (including Latent Defects) within 30 days of notice. If the Supplier fails to remedy within 45 days of notice, the Purchaser may appoint a third party to remedy the Defect and the Supplier shall reimburse all costs within 3 days of demand.

With respect to all Equipment, the Supplier shall transfer/assign all OEM warranties that extend beyond the Warranty Period to the Purchaser upon its expiry. This Warranty obligation survives termination of the Order.

10. Inspections, Testing, and Approval of Deliverables
The Purchaser shall have the right to depute its representative or a third-party consultant for physical inspection: (i) at the Supplier's manufacturing facility (with 10 Business Days' advance notice); or (ii) at the Delivery Site.
Upon delivery at the Delivery Site, the Purchaser's Representative shall have at least 5 Business Days to inspect each item. The Purchaser shall either endorse the Delivery Note (acceptance) or reject Equipment with reasons. Rejected Equipment shall be repaired or replaced by the Supplier at its own cost. Endorsement of the Delivery Note does not relieve the Supplier of its Warranty obligations.
Costs of repeated inspections due to Defects shall be borne by the Supplier. The Purchaser shall approve Supplier invoices or notify reasons for withholding within 30 days of receipt.

11. Order Confirmation
The Supplier is required to confirm its acceptance of this Order in writing within 2 (two) weeks of receipt. Failure to confirm, or confirmation on different terms, shall entitle the Purchaser to terminate the Order forthwith. Any amendments shall only be effective upon the Purchaser's written confirmation.

12. Insurance
a) The Supplier shall obtain and maintain, at its own cost, all required insurances for the Equipment during transit to the Delivery Site (including goods-in-transit insurance covering the full replacement value of the Equipment).
b) Any loss or damage to the Equipment prior to endorsement of the Delivery Note by the Purchaser shall be to the Supplier's account. The Supplier shall replace or repair any lost or damaged Equipment at its own cost.
c) The Purchaser shall be endorsed as additional insured on all transit insurance policies. All insurances must be capable of being assigned to the Lenders.
d) The Supplier shall inform the Purchaser at least 30 days in advance of expiry, cancellation, or change of any insurance and shall ensure timely renewal. The Supplier shall indemnify the Purchaser against any claims, losses, or damages arising from non-compliance with insurance obligations.

13. Intellectual Property
a) All Intellectual Property Rights in the Equipment shall remain the sole and exclusive property of the Supplier. The Supplier represents and warrants that it owns or has the right to use all IP Rights in the Equipment and that such rights do not infringe third-party rights during the Operational Life of the Project.
b) The Supplier grants an irrevocable, perpetual, royalty-free, non-exclusive, assignable licence to the Purchaser to use the IP Rights in the Equipment, Documents, and related materials for the Operational Life of the Project.
c) If the Purchaser's use of the Equipment is subject to an IP infringement claim, the Supplier shall, at its own cost: (i) procure the Purchaser's right to continue use; or (ii) alter, modify, or replace the infringing Equipment with a functionally equivalent alternative.
d) The Supplier shall indemnify the Purchaser against all claims, damages, and expenses arising from any breach of this Clause or any third-party IP claim relating to the Equipment.

14. Manpower and No Liability Towards Personnel
The Supplier shall employ sufficient skilled personnel for performance of its obligations under this Order. The Supplier's personnel shall work under its direct control and supervision. The Purchaser shall have no employer-employee relationship with Supplier's personnel. The Supplier shall be solely responsible for payment of all remunerations, statutory dues, and contributions in respect of its personnel. The Supplier shall indemnify the Purchaser against any such claims.

15. Subcontractors
The Supplier may Subcontract any or all of its obligations under this Order, provided that: (a) the Supplier remains fully liable to the Purchaser for all acts and omissions of its Subcontractors; (b) the Supplier ensures all Subcontracts permit assignment of rights, title, and benefit to the Purchaser without requiring Subcontractor consent; (c) there is no privity between the Purchaser and Subcontractors; and (d) the Supplier remains responsible for all Subcontractor payments. Nothing herein creates any obligation on the Purchaser to pay Subcontractors directly.

16. Indemnity
The Supplier shall indemnify and hold harmless the Purchaser, its Personnel, Associates, officers, directors, and agents ("Purchaser Indemnified Parties") from and against all Claims and Losses arising from: (a) failure to pay Taxes; (b) non-compliance with Applicable Laws; (c) breach of obligations or representations and warranties; (d) bodily injury, sickness, or death; (e) loss of or damage to third-party property; (f) defect in title or Lien on Equipment; (g) fraud, gross negligence, or wilful misconduct; (h) failure to obtain Government Approvals; or (i) infringement of third-party IP Rights.

All indemnities shall be continuing, separate, and independent obligations and shall survive termination of this Order.

17. Limitation of Liability
a) The maximum aggregate liability of either Party under this Order shall be limited to 100% (one hundred percent) of the Order Value ("Liability Cap"), except as excluded below.
b) The Liability Cap shall not apply to: (i) fraud, wilful misconduct, or gross negligence; (ii) death or personal injury caused by negligence; (iii) breach of confidentiality obligations; (iv) breach of IP obligations; (v) Supplier's indemnity obligations for third-party claims; and (vi) Delay Liquidated Damages.
c) Neither Party shall be liable for consequential, incidental, indirect, special, exemplary, or punitive damages (including loss of profits, loss of revenues, loss of use, or increased cost of capital), except as specifically provided in this Order.

18. Supplier's Representations and Warranties
The Supplier represents and warrants to the Purchaser that as of the Effective Date and throughout the Term: (a) it is duly incorporated and validly existing under the laws of India; (b) it has full power and authority to execute and perform this Order; (c) this Order constitutes its legal, valid, and binding obligation; (d) execution of this Order does not conflict with any Applicable Laws or its constitutional documents; (e) there are no pending proceedings that could materially affect its ability to perform; (f) it is registered under the GST Act, 2017 and is in good GST compliance standing; (g) it has the financial standing, technical expertise, and capacity to perform all obligations within the timelines set out herein; and (h) the Purchaser shall have a good, clear, and marketable title in the Equipment.

19. Term and Termination
This Order shall come into full force and effect from the Effective Date and remain valid until completion of all Warranty Period obligations, unless terminated earlier. The following events shall constitute Events of Default:

Supplier's Events of Default: (a) insolvency, liquidation, or administration; (b) failure to remedy a material breach within 30 days of notice; (c) breach of representations or warranties; (d) violation of business ethics or Code of Ethics / ABAC Obligations; (e) wilful misconduct or gross negligence; (f) breach of Applicable Laws or Government Approvals; (g) breach of the Delay LD cap while delay subsists; or (h) breach of material insurance requirements.

Purchaser's Events of Default: (a) failure to remedy a material breach within 30 days of notice; or (b) insolvency, liquidation, or administration.

Upon occurrence of an Event of Default, the non-defaulting Party may terminate this Order upon 7 days' Default Notice. The Purchaser may also terminate for convenience by giving 30 days' prior written notice. In the event of delay beyond 30 days past the Delivery Date attributable to the Supplier, the Purchaser may also terminate.

If the Supplier has not executed the Order within 7 days of issuance, the Purchaser reserves the right to revoke the Order.

20. Termination Consequences
a) Upon termination for Supplier's default: the Supplier shall refund all amounts received for undelivered Equipment (after adjusting undisputed dues); the Purchaser may appoint a replacement contractor, and the Supplier shall pay the cost differential between the replacement contractor price and the Order Value for the terminated Supply.
b) Upon termination for Purchaser's default or convenience: the Purchaser shall pay outstanding undisputed amounts for Supply completed as of the date of termination, at actuals, subject to documentary evidence.
Upon termination, the Supplier shall: assign all Subcontract rights and OEM warranties to the Purchaser if requested; remove its tools and materials from the Delivery Site; and continue to be liable for Defect rectification in respect of completed Supply for which payment has been received.

21. Entirety
This Order constitutes the entire agreement between the Parties with respect to the subject matter and supersedes all prior communications, negotiations, and agreements (whether written or oral).

22. Amendments
No amendment or variation of this Order shall be effective unless it is in writing, dated, expressly refers to this Order, and signed by duly authorised representatives of both Parties.

23. Notices
All notices shall be in writing and delivered by hand (against written acknowledgement), registered mail, courier, or email (followed by registered post). Notices shall be effective: (a) if by email, when sender receives automated delivery confirmation; (b) if by registered mail, when confirmed by signature on receipt; (c) if personally delivered, on receipt by the intended recipient.

Supplier: [●] | Email: [●] | Attn: [●]
Purchaser: [●] | Email: [●] | Attn: [●]

Either Party may change its notice details by giving at least 15 days' prior written notice.

24. Governing Law & Jurisdiction
This Order shall be governed by the laws of India. Subject to Clause 25 (Arbitration), the courts of [●] (New Delhi) shall have exclusive jurisdiction to hear any Dispute arising out of or in relation to this Order.

25. Arbitration
Any Dispute arising out of or in connection with this Order (including breach, termination, interpretation, or invalidity) shall be resolved by good faith negotiations within 30 days. Failing resolution, the Dispute shall be referred to arbitration under the Arbitration and Conciliation Act, 1996 (India). If the Parties cannot agree on a sole arbitrator, a panel of 3 arbitrators shall be appointed – each Party appoints 1, and the two appointed arbitrators jointly appoint the presiding arbitrator within 30 days. The language of arbitration shall be English and the seat shall be New Delhi, India. The award shall be final and binding. During pendency of any Dispute, the Parties shall continue to perform unaffected obligations.

26. Emergency Relief – Carve-Out from Arbitration
a) Notwithstanding Clause 25, either Party may seek urgent or interim relief (including injunctions, specific performance, or attachment orders) from any court of competent jurisdiction without first complying with the consultation period.
b) An application for interim relief shall not constitute a waiver of the right to refer the underlying Dispute to arbitration.
c) The courts of New Delhi, India shall have non-exclusive jurisdiction for the purposes of this Clause.

27. Step-In Rights
a) The Purchaser reserves its rights to step-in if: (i) the Supplier is unable to pay its Subcontractors or Government Authorities required for the Supply; or (ii) delivery is delayed beyond the Delivery Schedule or this Order is terminated. In such cases, the Purchaser may make payments on behalf of the Supplier or engage an alternate supplier, all at the Supplier's risk, cost, and responsibility.
b) All costs of exercising Step-In rights shall be recoverable from the Supplier by way of set-off from amounts payable to the Supplier.
c) The Supplier shall cooperate fully and sign all novation agreements with Subcontractors as required by the Purchaser to effect the step-in.

28. Performance Obligation
a) The Equipment supplied shall be new, of good quality, and free from Defects.
b) The Equipment shall conform to the Technical Specifications (Annexure 2) and be inspected and approved by the Purchaser's representative.
c) The Supplier shall procure and maintain all required insurance cover as set out in Clause 12.
d) The Supplier shall provide commissioning supervision and training as specified in the Order, at its own cost.

29. Invoice
Invoices shall be GST-compliant and submitted together with all supporting documents (including the endorsed Delivery Note, GST-compliant Tax Invoice, E-Way Bill, delivery challan, and countersigned Code of Ethics). The Purchaser shall have no obligation to process or make payment of any Invoice, or portion thereof, that is disputed, and may withhold such amounts pending resolution, without any liability for interest or delay.

30. Payment
Definite payment terms are set out in the Order. The Purchaser shall make payments after appropriate tax deduction at source as per Applicable Laws. The Purchaser may set off any amounts due from the Supplier from amounts payable to the Supplier. If the Purchaser disputes any amounts, it may give written notice of Disputed Amounts, and the Parties shall seek to resolve the dispute in accordance with Clause 25 (Arbitration).

31. Force Majeure
Force Majeure means an exceptional event or circumstance: (i) beyond a Party's control; (ii) which could not reasonably have been provided for; (iii) which could not reasonably have been avoided or overcome; and (iv) not substantially attributable to the other Party.

Force Majeure includes: radioactive contamination originating externally; geological conditions not reasonably discoverable; nationwide strikes not attributable to the Affected Party; nationalisation or compulsory acquisition; acts of war, invasion, terrorism; and acts of God (flood, earthquake, cyclone, etc.), if declared by the competent Government Authority.

Force Majeure does not include: foreseeable adverse weather; Supplier's or Subcontractor's employee strikes; Subcontractor or supplier failures; economic hardship; material shortages or price fluctuations; manpower shortages; or delay by contractors or Subcontractors.

The Affected Party must notify the other Party within 5 days of becoming aware, provide weekly updates, and take all reasonable steps to mitigate. The Supplier shall not be entitled to any Force Majeure relief under this Order unless the Purchaser receives a corresponding relief under the PPA. If Force Majeure prevents substantially all Supply for a continuous period of 45 days ("Prolonged Force Majeure"), either Party may terminate upon 7 days' notice.

32. Suspension
The Purchaser may, at any time and for any reason, by written notice to the Supplier, suspend performance under this Order, in whole or in part. In the event of suspension for convenience exceeding 90 consecutive days, the Supplier may treat the suspended portion as terminated for convenience, and the provisions of Clause 19 (termination for convenience) shall apply to that portion only.

33. Labour
The Supplier shall at all times comply with all Applicable Laws relating to employment of labour, including but not limited to the Code on Wages, 2019; the Industrial Relations Code, 2020; the Occupational Safety, Health & Working Conditions Code, 2020; and the Code on Social Security, 2020. The Supplier shall ensure timely payment of wages, statutory dues, EPF, ESI, gratuity, and all other statutory contributions. The Supplier shall indemnify the Purchaser against any claims arising from non-compliance with labour laws.
The Supplier shall comply with the Purchaser's Health, Safety and Environment Policy (as set out in Annexure 5) and shall take appropriate measures to prevent exploitation, sexual harassment, child labour, and any practices inconsistent with applicable human rights conventions.

34. Encumbrances and Liens
The Supplier shall not create or allow any Lien over the Equipment (including in favour of third parties), or sell, transfer, lease, or otherwise dispose of any Equipment without the Purchaser's consent. The title in the Equipment shall pass to the Purchaser upon endorsement of the Delivery Note by the Purchaser, or upon payment (or part payment), whichever is earlier. Risk passes upon endorsement of the Delivery Note at the Delivery Site.

35. Publicity and Use of Name or Logo
The Supplier shall not advertise or make public its contractual relationship with the Purchaser, nor use the Purchaser's name, emblem, or trademarks without prior written permission.

36. Conflict of Interests / Business Ethics
Neither Party shall pay any fee, commission, rebate, or anything of value to, or for the benefit of, any employee of the other Party. The Parties shall exercise reasonable care to prevent actions that could result in a conflict of interests. Each Party undertakes to notify the other immediately if it becomes aware of, or suspects, a breach of this obligation. This obligation extends to Subcontractors, employees, and agents.

37. Assignment and Novation
The Supplier shall not assign or transfer this Order or any rights, benefit, or interest hereunder to any third party without the Purchaser's prior written consent (save for Subcontracting as permitted herein). The Purchaser shall have the right to assign its rights or novate this Order in favour of any person (including its Lenders or Associates) upon intimation to the Supplier. The Supplier agrees to execute all documents required to effect such novation, provided it does not adversely impact the Supplier's rights without its consent.

38. Confidentiality
Each Party shall keep all Confidential Information and terms of this Order confidential and shall not disclose such information to any third party without prior written consent, except: (a) as required by Applicable Laws or stock exchange rules; (b) to the Lenders for financing purposes; (c) to Associates on a need-to-know basis under equivalent confidentiality obligations; or (d) as required by a Government Authority. Each Party shall use the same degree of care to protect the other's Confidential Information as it uses for its own (not less than reasonable care). Confidential Information shall remain the property of the disclosing Party. This obligation survives termination of this Order.

39. Supplier's Representative / Project Manager
Each Party may appoint a representative to act on their behalf under this Order. The Supplier shall inform the Purchaser within 7 days of receipt of this Order of the name and contact details of its representative. Representatives shall carry out assigned duties and exercise delegated authority, and shall be deemed to have full authority of the relevant Party, except in respect of variation, termination, or amendment of this Order.

40. Kick-Off Meeting
A kick-off meeting shall be held within 10 days of issue of this Order. The Supplier shall furnish a detailed schedule (L2 Schedule) along with a list of documents, drawings, and QAP planned for submission.

41. Contract Coordination Meeting and Progress Reports
The Supplier shall attend all meetings with the Purchaser or its consultants at its own cost as and when required. The Supplier shall submit detailed monthly progress reports by the 5th of each month, reaching the Purchaser's representative by the 10th of each month.

42. Right of Entry and Audit
a) The Purchaser shall have the right to enter the Supplier's manufacturing facility or any other premises with or without prior notice.
b) The Supplier shall maintain complete, accurate, and up-to-date records of all costs, materials, manpower, Subcontractor payments, and statutory compliance for a minimum of 7 years from final completion or termination.
c) The Purchaser (and authorised persons including auditors and Lenders) shall have the right, upon 3 Business Days' notice (except in cases of suspected fraud), to inspect, audit, and take copies of all records and interview Supplier personnel.
d) If any audit reveals overcharging by the Supplier, the Supplier shall promptly reimburse the overcharged amount with interest and bear the cost of the audit.

43. Code of Ethics and ABAC Obligations
a) The Supplier assumes and accepts the Purchaser's Code of Ethics (attached as Annexure 5 and available at https://zelestra.energy/wp-content/uploads/2024/07/Suppliers_Code_of-Ethics_EN.pdf) and undertakes to comply with it. The Supplier shall countersign and return the Code of Ethics on or before the Effective Date as a condition precedent to any payment.
b) The Supplier acknowledges the Purchaser's zero-tolerance policy toward bribery, corruption, and facilitation payments. The Supplier shall comply with all anti-bribery, anti-corruption, and anti-money laundering laws and shall not offer, promise, give, solicit, or accept anything of value in connection with this Order. These obligations extend to all Subcontractors and Personnel.
c) The Supplier shall maintain accurate books and records and internal controls to detect, prevent, and report any violations. Any breach shall be immediately disclosed in writing to the Purchaser. The Purchaser may investigate breaches through independent advisors and may suspend or terminate this Order in the event of a breach.

44. Data Protection and Cybersecurity
The Supplier shall comply with all applicable data protection laws in connection with any personal data processed under this Order. The Supplier shall implement appropriate technical and organisational security measures to protect Purchaser data. Any data breach or cybersecurity incident shall be reported to the Purchaser within 48 hours. Upon termination, the Supplier shall securely delete or return all Purchaser data within 14 days. The Supplier shall indemnify the Purchaser against all fines, penalties, and damages arising from any breach of this Clause.

45. Other Conditions
The Supplier shall use all materials, tools, drawings, and specifications provided by the Purchaser exclusively for performance of this Order. The Supplier confirms that it is not aware of any fact that could adversely impact its ability to complete its obligations under this Order. In the event any terms given by the Supplier are at variance with these General Terms and Conditions, these Terms and Conditions shall prevail.

46. General
The provisions of this Order are severable. If any provision is prohibited, invalid, or unenforceable, such invalidity shall not affect the validity of any other provision. The Parties agree to negotiate an equitable amendment to give effect to the original intention. This Order may be executed in counterparts, each of which shall be deemed an original. Delivery of a counterpart by email attachment shall be an effective mode of delivery. Nothing in this Order shall constitute any agency, partnership, or joint venture between the Parties. All Annexures form an integral part of this Order.

Annexure 1 – Delivery Schedule (Project Schedule)

Milestone	Scheduled Date
[       ]	[            ]
[       ]	[            ]
Delivery Date	[        ]

Annexure 2 – Technical Specifications
As enclosed / to be updated.

Annexure 3 – Payment Terms

(a) [●]% Advance within [●] days of Order.
(b) [●]% Against dispatch / delivery.
(c) [●]% Within [●] days of Delivery Note endorsement and receipt of PBG.

Annexure 4 – Performance Bank Guarantee Format
To be mutually agreed before PBG issuance.

Annexure 5 – Employer Policies (Code of Ethics & EHS Policy)


`;

const WORK_ORDER_CONDITION = `
1. Scope:
This work order, supply order, or service order, as applicable (Order) along with its schedules, annexures, and other appended documentation, shall constitute a contract. The Contractor shall perform this Order by providing in full the supply, services, or the works (Deliverables) set out in the Order.
The Order and the General Terms and Conditions are to be read as one, forming a single, integrated agreement, each supplementing and complementing the other (collectively the Contract).
This Contract between the Parties in respect of the subject matter hereof and supersedes all prior discussions, negotiations, understandings and agreements, whether written or oral, relating thereto.
In the event of an inconsistency between the Order and the General Terms and Conditions, the inconsistency will be resolved in accordance with Clause 2 (Precedence of Documents)

2. Precedence of Documents:
The Order and the General Terms and Conditions are intended to complement one another and should be interpreted harmoniously. In case of any inconsistency between them, they shall have the following descending order of precedence:
1st – Order | 2nd – General Terms and Conditions.

3. Price:
The currency of the Contract Price shall be INR unless specifically mentioned in the Order.
Notwithstanding anything to the contrary, the Contract Price set out in the Order is firm.
The Employer shall have the right to deduct or withhold taxes on payments due to the Contractor under this Contract to the extent that such deduction or withholding may be required by any competent government authority.
Payment by the Employer to any competent government authority of the amount so deducted or withheld will relieve the Employer from any further obligation to Contractor with respect to the amount so deducted or withheld. The Employer shall issue a tax deduction or withholding certificate to Contractor, evidencing the tax deducted or withheld and deposited by the Employer on payments made to Contractor, to enable the Contractor to claim the credit of the tax deducted or withheld by the Employer.
The Contract Price shall be subjected to variation in case of statutory variation for GST and other Taxes and Duties.

4. Statutory Variations for Taxes and Duties:
Any upward variation in GST and other Taxes and Duties payable on account of (a) variation in the rate of GST and other Taxes and Duties, or (b) change/introduction of any new GST and other Taxes and Duties, or (c) change of the GST and Other Tax regime effected by the Indian Central/State/Local authorities after the date of the Order shall be reimbursed by the Employer, as a statutory variation, to the Contractor at actuals during the Term of the Contract upon submission by the Contractor of proof of payment.
Similarly in the event of a downward variation in GST and other Taxes and Duties payable on account of (a) variation in the rate of GST and other Taxes and Duties, or (b) change/introduction of any new GST and other Taxes and Duties, or (c) change of the GST and other Tax regime effected by the Indian/State/local authorities after the date of the Order during the Term of the Contract, the same shall be passed on to the Employer, as a statutory variation, by the Contractor at actuals.

5. Effective Date of Contract:
The effective date of this Contract is the date of the Order, subject to the satisfaction of any conditions precedent set out in the Order.

6. Delivery / Performance:
The Term and the Schedule of Deliverables shall be provided in the Order.
TIME IS THE ESSENCE OF THIS CONTRACT and must be strictly adhered to. If the Contractor fails to deliver and/or perform the Deliverables within the stipulated timelines, the Employer may at its sole discretion:
a) Treat the Contract as cancelled, at any time, and recover any losses incurred or damages suffered from the Contractor, or
b) Procure the Deliverables or any part thereof from third parties, in which case, the Contractor shall be liable to pay the Employer not only the difference between the price at which such Deliverables have been actually procured and the price calculated at the rate set out in the Order, but also any other loss or damage the Employer may suffer.

7. Liquidated Damages:
a) The Delay Liquidated Damages for delay in performance of the Deliverables shall be levied as mentioned in the Order.
b) The Performance Liquidated Damages for any shortfall in performance of the Deliverables shall be levied as mentioned in the Order.
c) The Liquidated Damages shall be recovered by adjusting/deducting from any amounts due to the Contractor, at the sole discretion of the Employer. The Contractor shall issue a credit note equal to the Liquidated Damages due and payable by the Contractor to the Employer in favor of the Employer. The Employer shall have the right to make additional Claims for recovery of any deficit amount of the Liquidated Damages which could not be so recovered from the Contractor.
d) It is understood and agreed by the Parties that any sums which would be payable hereunder are in the nature of liquidated damages and not a penalty and are pre-genuine estimate of losses and reasonable.

8. Performance Bank Guarantee:
a) The Performance Bank Guarantee to be made to the Employer under this Contract shall be specified in the Order.
b) The Contractor shall furnish unconditional and irrevocable Performance Bank Guarantees from a Scheduled Bank as per the format set out at Annexure 4 (PBG Format).
c) The Contractor agrees that in the event the Contractor fails to refund or pay any amount due and payable by it to the Employer in accordance with this Contract, the Employer shall be entitled to, without any notice, invoke the Performance Bank Guarantees to recover such payments from the Contractor. Such invocation of the Performance Bank Guarantees shall be without prejudice to the Employer's other rights and remedies under this Contract or under Applicable Law, nor shall it discharge the Contractor from its obligation to refund any amounts remaining unpaid or unrecovered from the Performance Bank Guarantees.
d) The Performance Bank Guarantee shall be kept valid only till the expiry of the Defect Liability Period with an additional claim period of 3 (three) months.
e) The Performance Bank Guarantee whenever required to be extended for the purpose of completing any specific obligation under this Contract, shall be extended at least 15 (fifteen) days prior to their expiry.
f) All costs associated with providing, maintaining or renewing Performance Bank Guarantee shall be borne by the Contractor.
g) The Employer shall be entitled to assign the Performance Bank Guarantee in favor of the Lenders or persons to whom this Contract is assigned in terms hereof, with prior intimation to the issuing bank.

9. Standard of Care / Defects Liability:
The Contractor shall exercise reasonable skill, care, and diligence expected of an experienced contractor in the performance of Deliverables under the Order. The Contractor shall remedy any defect due to faulty material or workmanship and pay for any damage resulting therefrom which shall appear within the Warranty Period, as defined in the Order.
Further the Contractor shall ensure that the Deliverables conforms to latest Indian Standards and the Contractor's Quality Assurance Plan, which document is required to be approved in advance by the Employer. All Deliverables will be subject to inspection and approval by the Employer, either at the Contractor's premises or at the place of delivery/performance, as may be determined by the Employer.
If, during the performance of the Deliverables or during the Warranty Period following the performance of the Deliverables by Contractor, it is shown that there is a defect in the Deliverables caused by Contractor's failure to meet the Warranties or the Contractor's Quality Assurance Plan and the Employer has notified the Contractor in writing of any such defect promptly upon discovery, the Contractor shall, within the time the Employer reasonably requires and in a manner which causes minimum disruption to works or activities of the Employer or any other contractor, or any power generation or other facility in which the Deliverables may have been incorporated, promptly re-perform, repair, or replace, as the case may be, the Deliverables within the original scope of Deliverables as may be necessary to remedy such defect at its risk and expense. The Employer, at its sole discretion, may opt not to invalidate the remainder of the Order.
This Warranty Period will be extended (by a period equivalent to the original Warranty Period) following any re-performance by Contractor. The obligations and representations contained in this section are Contractor's sole warranty and guarantee obligations and Employer's exclusive remedy in respect of quality of the Deliverables.
If Contractor fails to promptly remedy any defect, Employer may, itself or through third parties, and without prejudice to Contractor's continuing obligations, remedy such defect and Contractor shall promptly reimburse Employer all costs of remedy.

10. Approval of Deliverables:
The Employer shall, within [30] days after receipt of the Contractor's invoice, either approve Contractor's invoice, or notify the Contractor of the reasons for withholding payment. Contractor shall make necessary corrections and resubmit the invoice.
Tests, inspections, and approvals of portions of the Deliverables required by the Contract or by Applicable Laws, ordinances, rules or regulations shall be made at an appropriate time. Unless otherwise provided, Contractor shall make arrangements for such tests, inspections and approvals, and shall bear related costs of tests, inspections, and approvals.
If such procedures for testing, inspection, or approval reveal failure of the Deliverables (or portions thereof) to comply with requirements established by the Contract, the Contractor shall bear all costs made necessary by such failure including those of repeated procedures and rectification.

11. Order Confirmation:
The Contractor is required to confirm its acceptance of the Contract in writing within 2 (two) weeks of its receipt of this Contract.
If the Contractor has not confirmed acceptance of the Contract (confirmation) in writing within 2 (two) weeks of its receipt or if the terms of the confirmation varies from the terms of the Contract, the Employer may terminate forthwith the Contract. Any amendments terms or addition to the Contract shall only be effective if the Employer confirms such in writing.

12. Insurance:
For Storage, Construction, Erection, Testing and Commissioning (as may be applicable), Construction All Risk/ Erection All Risk insurance shall be arranged by Employer. In the event that any of the Employer's claims with the insurance company stand rejected for reasons attributable to the Contractor, the Contractor shall be liable to compensate the Employer for the entire amount of such claim and the Employer may choose to set-off the amount expended in this regard with the dues payable by the Employer to the Contractor.
However, it is made clear that, in case any part of the Project that has not been covered specifically under the abovementioned comprehensive policy and falls exclusively under the Contractor's scope, it shall be required to procure insurance for the same.
a. The responsibility to maintain adequate insurance coverage on comprehensive all risks basis at all times during the performance of the Contract shall be that of the Contractor alone. The Contractor shall arrange, secure and maintain insurance policy as may be necessary and for all such amounts to protect its interests and the Employer's interests, against all risks as detailed herein at its own expense and cost.
The form and the limit of the insurances to be procured by the Contractor together with the under-writer thereof, in each case, must be approved by the Employer. However, irrespective of such acceptance, the responsibility of procuring and maintaining adequate insurance cover remains with the Contractor Alone. The Contractor's failure in this regard shall not relieve him of any of his contractual responsibilities and obligations.
b. Any loss or damage to the Deliverables or arising out of operation of the Deliverables, till such time the Deliverables are taken over or the Deliverables are accepted by the Employer, shall be to the account of the Contractor. The Contractor shall be responsible for preferring of all claims and making good for the damage or loss by way of repairs and/or replacement of the Deliverables (or parts thereof) damaged or lost at his own cost. The transfer of title shall not in any way relieve the Contractor of the above responsibility during the performance of the Contract. The Contractor shall provide the Employer with copies of all insurance policies and documents taken out by him pursuant to the Contract immediately after such insurance coverage is procured.
The Contractor shall also inform the Employer in writing at least sixty (60) days in advance, regarding the expiry, cancellation or change in any of such documents and ensure timely revalidation/renewal, etc. as may be necessary. The Contractor shall indemnify and hold the Employer harmless against any claims, losses, or damages in this regard including claims, losses, or damages on account of any non-compliance with statutory provisions in this regard or on any account whatsoever.
c. The risks that are to be covered under the insurance procured by the Contractor shall include, but not be limited to, the loss or damage caused by or during theft, pilferage, riot, civil commotion, weather conditions, accidents of all kinds, fire, terrorist attack, etc. The scope of such insurance shall cover the entire value of the Deliverables from time to time. In all such policies, the Lender, the Security Trustee, and the Employer shall be endorsed as beneficiary of the policies.
d. The Contractor shall take adequate insurance cover for its personnel and to cover the risk of insurance and payment of compensation under all labour laws including but not limited to, the Code on Wages, 2019; the Industrial Relations Code, 2020; the Occupational Safety, Health & Working Conditions Code, 2020; and the Code on Social Security, 2020 - at its own cost & expenses. The Contractor shall indemnify and hold the Employer harmless against any claims, losses, or damages arising on account of any non-compliance with statutory provisions in this regard or on any account whatsoever.
e. During the performance of its obligations under the Contract, the Contractor undertakes to maintain at its expense an insurance policy for General Liability covering risks including bodily injury, disease and death of its personnel and the Employer's personnel at the Project Site, as well as damage to the Employer's property or third party property etc. The General Liability Insurance policy should have a 'hold harmless' clause in favour of the Employer (whereby the Contractor holds the Employer harmless for suits alleging sole negligence of the Contractor or joint negligence of the Contractor and Employer, or sole negligence of the Employer). The Contractor shall indemnify and hold the Employer harmless against any claims, losses or damages arising on account of any non-compliance with statutory provisions in this regard or on any account whatsoever.
f. The Contractor shall arrange for necessary insurance cover for the assets owned by the Contractor including insurance related to temporary establishments like site office, canteen, labour colony etc. for Contractor, if applicable.
g. All costs on account of insurance liabilities covered under the Contract will be on the Contractor's account and is included in Contract Price. However, the Employer may from time to time, during the pendency of the Contract, ask the Contractor in writing to limit the insurance coverage risks and in such a case, the parties to the Contract will agree with a mutual settlement for reduction in Contract Price to the extent of reduced premium amounts and the same shall be reduced in writing.

13. Intellectual Property Assignment:
a.  All intellectual property rights, including but not limited to patents, copyrights, designs, trademarks, trade secrets, know-how, and any other proprietary rights (collectively, "Intellectual Property") in or arising from the Deliverables, all documents, drawings, designs, software, data, reports, specifications, and other materials created, developed, or produced by the Contractor (or its employees, agents, or sub-contractors) in the course of performing its obligations under this Contract ("Contract IP") shall vest in, and are hereby assigned to, the Employer with effect from the date of their creation.
b.  The Contractor agrees to execute all such documents and take all such steps as may be necessary or desirable to perfect or register the Employer's title in and to the Contract IP, at the Employer's cost. The Contractor hereby appoints the Employer as its attorney for this purpose.
c.  The Contractor warrants that the Contract IP and the Deliverables shall not infringe any third-party intellectual property rights. In the event of any actual or threatened infringement claim, the Contractor shall, at its own cost and at the Employer's option: (i) obtain a licence permitting the Employer's continued use, or (ii) modify or replace the infringing element so as to remove the infringement, without materially reducing quality or performance.
d.  The Contractor retains no licence or right to use the Contract IP for any purpose other than performing its obligations under this Contract, unless otherwise agreed in writing by the Employer.
e.  All pre-existing intellectual property of the Contractor used in the Deliverables shall be clearly identified by the Contractor prior to commencement of work. The Contractor hereby grants the Employer a non-exclusive, royalty-free, irrevocable, perpetual, worldwide licence to use such pre-existing intellectual property to the extent necessary to use, operate, maintain, and modify the Deliverables.
f.  The Contractor shall indemnify and hold the Employer harmless from and against all claims, damages, costs (including legal costs on a full indemnity basis), and expenses arising from any breach of this Clause or any third-party intellectual property claim relating to the Deliverables.

14. Manpower and No Liability Towards Personnel:
The Contractor shall employ sufficient number of persons, highly skilled and semi-skilled personnel etc., for the performance of the Deliverables under this Contract. In case the Employer is of the view that the persons employed by the Contractor are not sufficient, the Employer undertakes to employ the required number of persons as directed by the Employer from time to time.
Person/persons engaged by the Contractor for the performance of the Deliverables shall work under the Contractor's direct control and supervision. Nothing herein shall be construed as establishing any relationship of employer and employee between the Employer and the person/s engaged by the Contractor for the performance of the Deliverables, or part thereof.
The Contractor shall be liable for payment of all remunerations, statutory dues, wages including Employees' Provident Fund, Employees State Insurance etc. in respect of persons engaged by the Contractor. The Contractor shall indemnify and hold the Employers harmless and indemnified against any claims, losses, or damages arising on account of any non-compliance of statutory provisions in this regard.
The Contractor shall also comply with all laws, bye laws, rules, regulations as are or shall be applicable on the Contractor as well as Clause 33 of these General Terms and Conditions. The Contractor shall indemnify and hold the Employer harmless against any claims, losses or damages arising on account of any non-compliance of statutory provisions in this regard.

15. Subcontractors:
The Contractor shall not subcontract the performance of any obligations under this Contract without the prior written consent of the Employer. No such subcontracting shall relieve the Contractor of any of its obligations or liabilities under this Contract. The Contractor shall remain fully responsible for the acts, omissions, risks and costs associated with its subcontractor(s), and for the proper and timely performance of all obligations under this Contract.

16. Indemnity:
The Contractor indemnifies the Employer and its directors, officers, employees, against any losses/damages/expenses (direct and indirect)/prosecution etc. occasioned to the Employer or on account of an act or omission attributable to the Contractor or any its employees or agents.
The Contractor indemnifies and holds harmless the Employer and its directors, officers, employees, from and against all claims, demands, losses and damages, penalties, expenses and proceedings connected with this Contract or arising from any breach in relation to breach of any terms and conditions of this Contract.
Each Party shall defend and indemnify the other Party and its affiliates and their officers, representatives, directors, and employees from and against any liability or expense (including attorneys' fees) associated with third party personal injury death, property damage, breach of applicable laws, and/or infringement of third-party intellectual property rights, where attributable to the extent such injury or damage results from the gross negligence, fraud, or willful misconduct of the other Party. Neither Party shall be liable to the other Party for loss of profits or revenue; loss of use; loss of opportunity; loss of goodwill; cost of substitute facilities, goods or services; cost of capital; cost of replacement power; governmental and regulatory sanctions; and claims of customers for such damages; or for any indirect, special or consequential loss or damage, incidental, punitive, or exemplary damages in any way arising from or related to the performance or non-performance of this Contract.
All indemnities given by the Contractor shall survive the expiry or termination of this Contract.

17. Limitation of Liability:
The maximum aggregate liability of the Employer in respect of any claim, liability or expense (including attorneys' fees) under this Contract shall not in the aggregate exceed 100% (one hundred percent) of the Contract Price.
a. The maximum aggregate liability of the Contractor to the Employer in respect of all claims under or in connection with this Contract, whether arising in contract, tort (including negligence), breach of statutory duty, or otherwise, shall not exceed [●]% (as agreed in the Order) of the Contract Price ("Liability Cap").

Notwithstanding Clause (a), the Liability Cap shall not apply to, and there shall be no limitation on the Contractor's liability in respect of:
(i)  fraud or wilful misconduct by the Contractor or its personnel;
(ii)  death or personal injury caused by the Contractor's negligence;
(iii)  breach of7yfv confidentiality obligations under Clause 36 of the General Terms and Conditions;
(iv)  breach of the intellectual property assignment and indemnity obligations under Clause 13 (Intellectual Property Assignment);
(v)  the Contractor's indemnity obligations in respect of third-party claims under Clause 16 of the General Terms and Conditions; and
(vi)  liquidated damages levied in accordance with Clause 7 of the General Terms and Conditions.
c.  For the avoidance of doubt, Clause 17 of the General Terms and Conditions shall apply only to the Employer's liability to the Contractor and shall not limit or qualify the Contractor's liability to the Employer in any respect.

18. Contractor's Representations and Warranties:
The Contractor makes the following representations and warranties to the Employer, each of which is true and correct as on the Effective Date which representations and warranties shall continue to be true and correct throughout the term of this Contract:
a. The Contractor has been incorporated, as a company the Companies Act, 1956 (or Companies Act, 2013), is validly existing, in good standing, and has the power and authority to carry on its business as is currently being conducted in India and to perform all its obligations under this Contract; and
b. The Contractor has the authority and power, including all corporate approvals, required to enter into this Contract, and is not otherwise restrained, prevented, or inhibited from entering into this Contract or from complying with the Contractor's obligations under this Contract; and
c. The Contractor's signatory to this Contract is duly authorized to execute the same in a manner binding upon it and that all corporate approvals and procedures necessary for entering into this Contract and the vesting the authority in such signatory have been duly obtained and complied with; and
d. The Contractor shall, throughout the validity of this Contract, obtain and maintain all Applicable Permits required to be taken by the Contractor under the Applicable Laws, to perform its obligations hereunder; and
e. that there are no threatened or actual claims or suits in connection with any Intellectual Property matter that would materially adversely affect the Contractor's ability to perform its obligations under this Contract; and
f. The Contractor has satisfied itself as to the sufficiency and correctness of the Contract Price, which shall, except as otherwise provided in this Contract, cover all its obligations under this Contract; and
g. The Contractor's obligations under this Contract are valid and binding and are enforceable against it in accordance with the terms of this Contract; and
h. The Contractor's representations and warranties are enforceable against the Contractor.
19. Term and Termination:
This Contract shall be deemed to have commenced from the date of execution of the Order by both parties (unless specific conditions precedent are set forth in the Order) and shall subsist on the parties till completion of all their obligations unless terminated in accordance with the terms hereof (Term).
In accordance with this Contract, the Employer shall be entitled to terminate this Contract, or a part thereof:
a. If the Contractor has not executed the Contract for a period of 07 days from the issue of this Contract, then the Purchaser reserves the rights to revoke the Contract.
b. If the Contractor has not started performance of the Deliverables within the stipulated timelines and / or didn't respond to the communications of delays in the performance of the Deliverables by the Employer about the status of progress (Three Reminder's being sent to the Contractor)
c. If the performance of the Deliverables has been delayed, for reasons not attributable to the Employer, to the extent that the Employer is entitled to the maximum amount of LD.
d. For convenience, at any time, by giving 7 (seven) days' prior written notice to the Contractor.
e. In case of breach of any term and condition of this Contract which, if capable of remedy, has not been remedied within [(30)] days of receipt by the Contractor of a notice specifying the breach and requiring its remedy
f. In case the Contractor, (i) ceases to do business in the normal course, (ii) becomes or is declared unable to pay its debts, insolvent or bankrupt, (iii) has a liquidator, receiver, or administrator appointed in relation to its winding up, liquidation or insolvency (iv) has a petition for winding up pending before a court of competent jurisdiction which has not been dismissed for a period of [120] days.
20. Termination consequences:
a. In the event this Contract is terminated in pursuance of Clause 19 (b), (c), (e), and/or (f) above, the Employer may avail the performance of the Deliverables similar to those undelivered, upon such terms and in such manner as it deems appropriate, whereupon the Contractor shall be liable to reimburse the Employer for any excess costs & risk for such substituted performance. The Employer shall be entitled to set off any amounts due under this Contract against amounts owed by the Contractor to the Employer.
b. In the event this Contract is terminated in pursuance of Clause 19 (d) above, the Contractor will receive the Contract Price in respect of the portion of the Deliverables performed till the effective date of termination. The Employer shall have the right to take over Deliverables completed so far and covered by the above mentioned consideration.
Furthermore, the Contractor shall upon termination of this Contract, assist the Employer or the new contractor appointed by the Employer, to complete the unexecuted part of the Deliverables in terms of this Contract.
21. Entirety:
This Contract shall constitute the entire understanding between the Parties.
22. Amendments:
This Contract may be modified only by a written instrument duly executed by both Parties. All amendments and other modifications hereof shall be in writing and signed by each Party.
23. Notices:
All notices required to be served under this Contract shall be in writing and sent by registered mail or by facsimile, by one Party to the other at the addresses provided in the Order or any later addresses, details of which have duly been conveyed under this Clause. All such notices shall be effective upon actual receipt or it shall deem to have been received on the fifth day after the day of dispatch, whichever is earlier.
24. Governing Laws & Jurisdiction:
This Contract shall be governed by the laws of Republic of India and any legal action pertaining to this Order shall be subject to the exclusive jurisdiction of Courts of New Delhi.
25. Arbitration:
All disputes arising out of or in relation to this Contract, including any question regarding its existence, validity or termination, which cannot be amicably resolved by the parties within [30] days of being brought to their attention ("Consultation Period"), shall be settled by arbitration governed by the provisions of Arbitration and Conciliation Act, 1996. If the parties are not able to agree on a sole arbitrator, a panel of three arbitrators shall be appointed wherein each Party shall appoint one arbitrator within 30 days of the expiry of the Consultation Period, and the two arbitrators together shall appoint the presiding arbitrator within 30 days of the appointment of the last of the two arbitrators. The venue and seat of Arbitration shall be in [New Delhi, India] and the language of arbitration shall be English. A dispute shall be deemed to have arisen when either Party notifies the other Party in writing to that effect.
The award of the Arbitrator shall be final and binding upon the parties.

26. Emergency Relief — Carve-Out from Arbitration:
a.  Notwithstanding Clause 25 (Arbitration) of the General Terms and Conditions and without prejudice to any other right or remedy, either Party shall be entitled to seek urgent or interim relief (including injunctions, specific performance, attachment orders, or other interim measures) from any court of competent jurisdiction at any time without being required to first comply with the Consultation Period referred to in Clause 25.
b.  The Employer shall, in particular, be entitled to seek urgent relief from a court of competent jurisdiction in the following circumstances, without any requirement for prior notice to the Contractor:
(i)  where there is an imminent risk of dissipation of assets by the Contractor that would prejudice any recovery by the Employer;
(ii)  where the Contractor is in breach of its confidentiality obligations and continued breach would cause irreparable harm to the Employer;
(iii)  where immediate judicial intervention is required to preserve the integrity, safety, or continuity of the Project;
(iv)  where the Contractor is threatening to or has actually removed plant, equipment, or materials from the Project Site in breach of this Contract; and
(v)  any other circumstance where damages alone would be an inadequate remedy.
c.  An application for, or grant of, interim or urgent relief shall not be construed as a waiver of a Party's right to refer the underlying dispute to arbitration under Clause 25 of the General Terms and Conditions, and any such arbitration may continue concurrently with court proceedings for interim relief.
d.  The Parties agree that the courts of New Delhi shall have non-exclusive jurisdiction for the purposes of this Clause 26.

27. Enhanced Suspension Rights and Compensation:
a.  The Employer's right to suspend performance under Clause 32 of the General Terms and Conditions is hereby supplemented as follows.
b.  In the event of suspension ordered by the Employer for convenience, the Contractor shall be entitled to:
(i)  reimbursement of direct, reasonable, and demonstrable costs of demobilisation and re-mobilisation, supported by documentary evidence;
(ii)  an extension of time equal to the period of suspension plus any reasonable period required for re-mobilisation; and
(iii)  reimbursement of reasonable site standing costs (including watchman, security, and preservation costs) during the period of suspension, subject to the Contractor taking all reasonable steps to mitigate such costs.
c.  The Contractor shall not be entitled to any suspension compensation (including lost profits, overhead contribution, or financing costs) beyond what is expressly provided in Clause 27(b).
d.  If suspension exceeds [90 (ninety)] consecutive days for reasons other than Force Majeure or the Contractor's default, the Contractor may, by written notice to the Employer, treat the suspended portion of the Deliverables as terminated for convenience, in which case the provisions of Clause 19(d) of the General Terms and Conditions shall apply to that portion only.


28. Performance obligation:
a. The Deliverables processed and delivered by the Contractor shall be from of good quality components/materials, as acceptable to the Employer, and shall evidence excellent workmanship.
b. Safe custody of free issue material will be responsibility of the Contractor. In case of loss due to negligence of the Contractor, the materials will be replaced/replenished by the Contractor.
c. The Deliverables performed by the Contractor will be certified the Employer's representative as provided in this Contract.
d. The Contractor shall procure insurance cover as set out in this Contract.
29. Invoice:
The Invoice for Deliverables, or portions thereof (as provided in the Order), completed and accepted by the Employer must be submitted in triplicate duly bearing the Contractor's Tax registration numbers, supported certification from Employer with the required forms as specified in the Order and showing the description of Order no, Contractor code number, challan no and date. The Contractor will ensure that, all original Invoices with test certificates are enclosed with Invoices. The Employer shall have no obligation to process or make payment of any Invoice, or any portion thereof, that is disputed, and may withhold such amounts pending resolution of the dispute, without any liability for interest or delay.
30. Payment:
Definite terms of Payment are provided in the Order.
Payment for Deliverables completed, provided they are not rejected by the Employer/consignee shall be made as per the terms provided in the Order. Payment falls due after the agreed credit period from the date of acceptance of Deliverables or from the date of receipt of Invoices, whichever is later. Invoices should be submitted within 4 days from the date of performance of the Deliverables. The Employer shall all point of time have all rights to deduct from any unpaid Invoices, debit notes falling due in case any Deliverables are rejected on line or any claims for deductions are raised on the Contractor.
31. Force Majeure:
In this Contract, Force Majeure means any exceptional events or circumstance (or combination of events and circumstances): (i) which are beyond a Party's control; (ii) which such Party could not reasonably have provided for against before entering into the Order; (iii) which, having arisen, such Party could not reasonably have avoided or overcome; and (iv) which are not substantially attributable to the other Party's act or omission.
Notwithstanding any other provision of this Contract, the following events are deemed not to be Force Majeures: (i) strikes or other employee disturbances affecting only Contractor's or any subcontractor's employees; (ii) any acts or omissions by the affected Party's suppliers or subcontractors, unless resulting from a Force Majeure event; (iii) economic hardship; (iv) shortages or price fluctuations (including as a result of currency fluctuations) with respect to materials, supplies or components of equipment; (v) shortages of manpower; or (vi) weather conditions which might reasonably have been foreseen by the Party claiming Force Majeure and which were not unusually adverse.
Provided the affected Party notifies the other Party as soon as reasonably practicable and in any event not more than 45 days after the occurrence of a Force Majeure event and uses reasonable commercial efforts to mitigate or cure the effect of the Force Majeure, the affected Party shall not be liable for failure to perform its obligations under the Order to the extent such failure results from the Force Majeure.
In the event that a Force Majeure event prevents either Party from performing its obligations for a period exceeding 6 (six) months, then either Party may terminate this Contract upon written notice to the other Party. A Force Majeure event shall not relieve a Party from any liability for an obligation (including payment obligations) which arose before the occurrence of such Force Majeure event.
Upon termination of this Contract under this Clause, the Employer will only be required to make payment for the Deliverables performed until the date of occurrence of the Force Majeure event.
32. Suspension:
The Employer may, at any time and for any reason whatsoever, by written notice to the Contractor, suspend performance under this Contract, in whole or in part and to the extent specified in such notice.
33. Labour:
The Contractor shall, at all times, comply with all requirements of any Applicable Law relating to the employment of labour/personnel under this Contract, including but not limited to matters relating registrations under the applicable statutes, timely payment of wages and allowances, payment of minimum wages, payment of overtime, grant of leave, payment of workmen's compensation, working hours, safety, maternity benefits, holidays, framing of standing orders, disciplinary action against employees, payment of provident fund contributions, payment of gratuities and payment of bonuses. The Contractor shall submit, with its Invoices, declaration for compliance with labour laws during the preceding month.
In the employment of labour for the performance of the Deliverables, the Contractor shall comply with the provisions of the Labour Laws including but not limited to the Code on Wages, 2019; the Industrial Relations Code, 2020; the Occupational Safety, Health & Working Conditions Code, 2020; and the Code on Social Security, 2020 or the modifications thereof or any other law relating thereto and the rules made there under from time to time (collectively referred to as the "Labour Laws").
The Employer may require the Contractor to dismiss or remove from the Project Site any person or persons in the Contractor's employment or deputed at the Project Site who in the opinion of the Employer Representative is incompetent or who has misconduct himself and the Contractor shall forthwith comply with such requirements. The removal of the relevant person from the Project Site will be a redeployment of the Contractor's personnel and the Contractor is free to utilise the relevant person's services in other projects. This will not be construed as termination of employment.
Contractor will comply with the Employer's Health, Safety and Environment Policy, as revised from time to time. The Contractor undertakes to keep itself updated regularly of the Employer's Health, Safety and Environment Policy.
Contractor represents and warrants that neither it, its parent entities (if any), nor any of the Contractor's subsidiary or affiliated entities or subcontractors (if any) is engaged in any practice inconsistent with the rights set forth in the Convention on the Rights of the Child, including Article 32 thereof, which, inter alia, requires that a child shall be protected from performing any work that is likely to be hazardous or to interfere with the child's education, or to be harmful to the child's health or physical, mental, spiritual, moral, or social development.
Contractor shall take all appropriate measures to prevent sexual harassment, exploitation or abuse of anyone by its employees or any other persons engaged and controlled by Contractor to perform any services under the Contract, including but not limited to compliance with the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013.
34. Encumbrances and Liens:
Contractor shall not cause or permit any lien, attachment or other encumbrance by any person to be placed on file or to remain on file in any public office or on file against any monies due to Contractor or that may become due for any Deliverables under the Contract, or by reason of any other claim or demand against Contractor or Employer.
Contractor hereby waives any and all liens, charges, or encumbrances, in relation to the Deliverables, created in its favour under Applicable Laws or equity, to the extent permitted by Applicable Laws.
Contractor shall defend and indemnify Employer against any liens or encumbrances on the Deliverables, the title to which have been transferred to the Employer under this Contract, including from any claims for unpaid work, labour or materials.
35. Publicity and Use of Name or Logo of Employer:
The Contractor shall not advertise or otherwise make public for purposes of commercial advantage or goodwill that it has a contractual relationship with the Employer, nor shall the Contractor, in any manner whatsoever use the name, emblem or trademarks of the Employer, or any abbreviation of the name of the Employer in connection with its business or otherwise without the written permission of the Employer.
36. Conflict of Interests:
The Contract Price shall constitute the Contractor's sole remuneration in connection with this Contract, and the Contractor shall not accept for its own benefit any trade commission, discount, or similar payment in connection with activities pursued in the performance of this Contract or in the discharge of their obligations under the Contract, and the Contractors shall use their best efforts to ensure that their personnel, Subcontractors, and agents similarly shall not receive any such additional remuneration. Neither the Contractor nor their Subcontractors nor their personnel shall engage in, either directly or indirectly, during the performance of this Contract, any business or professional activities which would conflict with the activities assigned to them under this Contract.
37. Assignment:
The Contract shall not be assignable by the Contractor to any other person. The Employer may assign this Contract in favour of third-person, its Affiliates, Lenders, or the Security Trustee.
This Contract shall be binding upon and inure to the benefit of any third party acquiring all or substantially all of the business and assets of a Party.
38. Confidentiality:
If for the purposes of this Contract, the Employer furnishes the Contractor with any drawings, dyes, floppies, documents etc., these are made by the Contractor himself, the same shall be kept strictly confidentially used by the Contractor and shall be used by it only for the performance of its obligations under the Contract. On demand by the Employer at any time or on completion of performance of the Deliverables, the Employers drawings etc. shall be returned forthwith by the Contractor to the Employer. The Contractor shall under no circumstances allow the drawings, etc. made for the performance of the Deliverables to be used by a third party. The Contractor shall also not make supplies of the articles made with the help of these drawings, etc. to any Party other than the Employer.
The Contractor shall indemnify and hold the Employer (and its officers, directors etc.) harmless against any claims, losses, damages arising on account any noncompliance of this Clause or any statutory provisions in this regard.
39. Project Manager and Engineer-in-Charge:
The Contractor shall inform the Employer within seven (7) days of receipt of this Contract, the name and address of the Project Manager who shall represent the Contractor and be responsible for all the activities of this contract.
The Employer will inform the Contractor of the Engineer-in-Charge with respect to this Contract and provide necessary contact details.
40. Kick off Meeting:
Kick-off meeting for the Project will be held within 10 days of issue of this Contract, at the Employer's Office.
The Contractor shall furnish during this meeting a detailed project schedule (L2 Schedule) along with list of documents, drawings, QAP, etc. that are planned for submission.
41. Contract Coordination Meeting and Progress Report:
The Contractor shall attend all meetings with the Employer or consultants appointed by the Employer at its own cost, as and when required.
The Contractor is required to fully cooperate with such persons and agencies involved during these discussions.
The Contractor shall submit at its own cost a detailed monthly progress report to the Engineer-in-Charge in three copies by the 5th of every month so that the progress report can reach Engineer-in-Charge latest by the 10th of every month.
42. Right of Entry and Audit:
a. The Employer shall have the right to enter the Contractor's works/place of processing/manufacture or and other premises at any time with or without any prior intimation
b. The Contractor shall maintain complete, accurate, and up-to-date books of account, records, registers, and documentation ("Records") in relation to the performance of its obligations under this Contract, including without limitation records of:
(i)  costs incurred in the performance of the Deliverables, where such costs may form the basis of any claim against the Employer;
(ii)  quantities of materials used, procured, or supplied;
(iii)  manpower deployed at the Project Site;
(iv)  sub-contractor arrangements and payments; and
(v)  compliance with applicable statutory and regulatory requirements.
c.  The Contractor shall retain all Records for a minimum period of [7 (seven)] years from the date of final completion of the Deliverables or from the date of termination of this Contract, whichever is later.
d.  The Employer (and any person authorised in writing by the Employer, including auditors and lenders) shall, upon not less than [3 (three)] Business Days' prior written notice (save in cases of suspected fraud, where no notice is required), have the right to:
(i)  inspect, audit, and take copies of any Records;
(ii)  access the Contractor's premises, plant, or equipment used in the performance of the Deliverables; and
(iii)  interview the Contractor's personnel involved in the performance of this Contract.
e.  The Contractor shall provide all reasonable assistance to the Employer and its authorised representatives in the conduct of any audit and shall ensure that its sub-contractors are subject to equivalent audit rights.
f.  If any audit reveals that the Contractor has overcharged the Employer, the Contractor shall promptly reimburse the Employer the amount overcharged together with interest at the rate of [●]% per annum from the date of the relevant payment, and the cost of the audit shall be borne by the Contractor.
.
43. Step-In Rights:
a.  Without prejudice to any other rights or remedies available to the Employer under this Contract or at law, the Employer shall have the right (but not the obligation) to step in and take over the performance of the Deliverables, in whole or in part, ("Step-In") in the following circumstances:
(i)  the Contractor has failed to commence performance of the Deliverables within the stipulated timeline and has not remedied such failure within [7 (seven)] days of receipt of written notice from the Employer;
(ii)  performance of the Deliverables is delayed to such an extent that, in the Employer's reasonable opinion, the Contractor will not be able to achieve the Scheduled Date of Completion;
(iii)  there exists a material risk to health, safety, or the environment at the Project Site attributable to the Contractor's acts or omissions;
(iv)  a Force Majeure event has occurred and the Contractor is unable to perform;
(v)  the Employer has issued a termination notice under Clause 19 of the General Terms and Conditions; or
(vi)  any other circumstance where the Employer reasonably determines that immediate intervention is necessary to protect the Project or the Employer's interests.
b.  Upon Step-In, the Employer may:
(i)  itself, or through any third party appointed by it, perform or procure the performance of the Deliverables or any part thereof;
(ii)  take possession of, and use, all plant, equipment, materials, drawings, documents, software, and other assets on the Project Site belonging to or under the control of the Contractor that relate to the Deliverables; and
(iii)  direct the Contractor's sub-contractors to continue performance directly for the Employer.
c.  All costs incurred by the Employer in exercising its Step-In rights, including the costs of any third-party contractor appointed by the Employer, shall be borne by the Contractor and may be set off by the Employer against any amounts due to the Contractor under this Contract.
d.  The exercise of Step-In rights shall not constitute a termination of this Contract unless accompanied by a formal termination notice. The Employer may at any time, at its discretion, relinquish Step-In and restore performance obligations to the Contractor.
e.  During any Step-In period, the Contractor shall:
(i)  provide full cooperation to the Employer and any third party appointed by the Employer;
(ii)  not remove or dispose of any plant, equipment, or materials from the Project Site without the prior written consent of the Employer; and
(iii)  continue to be responsible for the safety and security of the Project Site and the Deliverables.

44. Data Protection and Cybersecurity:
a.  The Contractor shall comply with all applicable data protection laws and regulations, including but not limited to the Digital Personal Data Protection Act, 2023 and any rules made thereunder ("Data Protection Laws"), in connection with any personal data processed in the course of performing its obligations under this Contract.
b.  The Contractor shall implement and maintain appropriate technical and organisational security measures to protect all data (including personal data and confidential information of the Employer) processed under this Contract against accidental or unlawful destruction, loss, alteration, unauthorised disclosure, or access.
c.  The Contractor shall, without undue delay and in any event within [48 (forty-eight)] hours of becoming aware, notify the Employer in writing of any actual or suspected:
(i)  personal data breach;
(ii)  unauthorised access to or disclosure of Employer data or confidential information; or
(iii)  cybersecurity incident affecting systems used in connection with this Contract.
d.  The Contractor shall not engage any sub-processor to process Employer data without the prior written consent of the Employer and shall impose equivalent data protection obligations on any approved sub-processor.
e.  Upon expiry or termination of this Contract, the Contractor shall, at the Employer's election, either securely delete or return all Employer data and provide written certification of such deletion or return within [14 (fourteen)] days.
f.  The Contractor shall indemnify and hold the Employer harmless from and against all fines, penalties, claims, and damages arising from any breach by the Contractor of its obligations under this Clause G or the applicable Data Protection Laws.

45. Other Conditions:
The Contractor shall use the material/tools/drawings/specifications etc. provided to it exclusively for performance of obligations under this Contract and the same shall not be used by the Contractor for any other purpose.
The machines/tools/raw material etc. provided by the Employer to the Contractor shall remain in the Contractor's custody as a bailee and the Contractor shall forthwith return the said products/raw material/machines/ tools to the Employer on being so called upon by the Employer.
The Contractor will comply with all Applicable Law in respect of this Contract.
In the event that any terms and conditions given by the Contractor are at variance with these General Terms and Conditions, then these terms and conditions shall prevail.
46. Code of Conduct:
The Contractor is obliged to comply with the Applicable Law. In particular, the Contractor will not engage actively or passively, nor directly or indirectly in any form of bribery, in any violation of basic human rights of employees or any child labour. Moreover, the Contractor will take responsibility for the health & safety of its employees. The Contractor will act in accordance with the applicable environmental laws and will use best efforts to promote the Code of Conduct among its Contractors.
Contractor will comply with the Employer's: (i) Business Ethics Policy, and (ii) Health, Safety and Environment Policy, each as set out in Annexure 5 (Employer Policies), as revised from time to time ("Employer Policies"). The Contractor undertakes to keep itself updated regularly of the Employer's Policies.
47. General:
The Clauses as mentioned above shall hold good until and unless any Clause is commented upon in the body of the Order. The Clauses commented upon only, in the body of the WO shall override the ones mentioned here.
Subject to Clause 2, this Contract shall prevail over any other terms or conditions contained in any invoices/bills or any other document.
Any right or obligation which becomes absolute before termination/expiration of this Contract for any reason, or which is by definition of a continuing nature, will survive such termination/expiration.
In the event that any provision of this Contract conflicts with the law under which this Contract is to be construed or if any such provision is held invalid by a court with jurisdiction over the parties to this Contract, (i) such provision shall be deemed to be restated to reflect as nearly as possible the original intentions of the parties in accordance with applicable law, and (ii) the remaining terms, provisions, covenants and restrictions of this Contract shall remain in full force and effect.
All Annexures shall form an integral part of this Contract.

Note -1: Invoice should be presented along with the necessary supporting documents. These are essential to process the invoice. The Contractor's Tax Registration No., any other taxes deposited with authorities with sufficient proof as desired by the Employer shall be furnished with the invoices.
In case of a final invoice, documents desired by the Employer shall be furnished as per the Order. This may include (but not be limited to) completion of punch list points, work completion certificate issued at Project Site, As built drawings, field Test reports, service reports, complete service reconciliation statement and any other documents as may be applicable for the Deliverables performed.


Annexure 1 – Project Schedule
Annexure 2 – Technical Specifications
Annexure 3 – Payment Terms
Annexure 4 – ABG / PBG Format
Annexure 5 – Employer Policies (Code of Ethics & EHS Policy)
`;

// Internal state for print options modal
let _printCode = null;
let _printMode = null;

let G_POStoreList = [];
let G_POStoreItemList = [];
let G_POStoreEditMode = 'New';
let G_ItemMasterList = [];
let G_UOMMasterList = [];
let G_VendorList = [];
let G_PaymentTermsList = [];
let G_ProjectList = [];
let G_SubProjectList = [];
let G_ItemRowCount = 0;
let G_MobileItemEditRowId = null;
let G_BillToShipToList = [];
let G_SiteRepList = [];
let G_ItemWithoutProjectList = [];
let G_CompanyInfoList = [];

const DEFAULT_SERVICE_SCOPE_OF_WORK = '';

BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

// ─── FLOAT BAR MARGIN — tracks sidebar collapsed state ───────────────────────
function SyncFloatBarMargin() {
    const bar = document.getElementById('poFloatBar');
    if (!bar) return;
    if (window.innerWidth <= 768) {
        bar.style.marginLeft = '0';
        return;
    }
    const sidebar = document.getElementById('modern-sidebar');
    bar.style.marginLeft = (sidebar && sidebar.classList.contains('collapsed')) ? '70px' : '280px';
}

// ─── PO STAT COUNTS (Pending on Me / Approved) ──────────────────────────────

function LoadPOStatCounts() {
    // Pending On Me = POs awaiting the current user's approval
    PurchaseOrderStoreService.GetPendingPOStoreList().then(function (data) {
        const count = Array.isArray(data) ? data.length : 0;
        $('#statPendingOnMePO').text(count > 0 ? count : '—');
    }).catch(() => { $('#statPendingOnMePO').text('—'); });
}

function NavigateToPOApproval() {
    const appBase = (sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/')).replace(/\/?$/, '/');
    window.location.href = appBase + 'PurchaseTransactions/PurchaseOrder/POLevelsApprove?ModuleDesp=PO%20Approval';
}

$(document).ready(function () {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    $('#lstTxtFromDate').val(FormatDateInput(firstDay));
    $('#lstTxtToDate').val(FormatDateInput(today));
    InitDropdowns();
    LoadPOStatCounts();
    window.ShowPOListGrid();

    // Initialise generic email modal
    var _emailControlUrl = (sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/')).replace(/\/?$/, '/') + 'CustomControl/EmailControl';
    $('#PurchaseOrderStore_EmailControlContainer').load(_emailControlUrl);

    // Attachment badge: update count when files are queued in the shared control
    window.AttachmentControl_onQueueChange = function (count) {
        const badge = document.getElementById('poTempAttachBadge');
        if (!badge) return;
        badge.textContent = String(count);
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
    };

    // Watch sidebar class changes (collapse/expand) and sync float bar
    const sidebarEl = document.getElementById('modern-sidebar');
    if (sidebarEl) {
        new MutationObserver(SyncFloatBarMargin)
            .observe(sidebarEl, { attributes: true, attributeFilter: ['class'] });
    }
    window.addEventListener('resize', SyncFloatBarMargin);

    // Auto-fill Scope of Work default when Work Type is Service on a New PO
    $('#frmDdlWorkType').on('change', function () {
        if (G_POStoreEditMode !== 'New') return;
        const selectedText = $(this).find('option:selected').text().trim().toLowerCase();
        if (selectedText.includes('service')) {
            if (!$('#frmTxtScopeOfWork').val()) {
                $('#frmTxtScopeOfWork').val(DEFAULT_SERVICE_SCOPE_OF_WORK);
            }
        } else {
            if ($('#frmTxtScopeOfWork').val() === DEFAULT_SERVICE_SCOPE_OF_WORK) {
                $('#frmTxtScopeOfWork').val('');
            }
        }
    });
});

function FormatDateInput(d) {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
}

function FormatDateDisplay(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    const dy = String(dt.getDate()).padStart(2, '0');
    const mo = String(dt.getMonth() + 1).padStart(2, '0');
    const yr = dt.getFullYear();
    return `${dy}/${mo}/${yr}`;
}

function IsMobile() {
    return window.innerWidth <= 768;
}

function GetUserCode() {
    try {
        const authKey = JSON.parse(sessionStorage.getItem('authKey'));
        return authKey ? authKey.UserMaster_Code : 0;
    } catch { return 0; }
}

// ─── INIT DROPDOWNS ─────────────────────────────────────────────────────────

function InitDropdowns() {
    LoadStatusDropdown();
    LoadVendorDropdown();
    LoadWorkTypeDropdown();
    LoadItemDropdown();
    LoadItemWithoutProjectList();
    LoadCompanyInfoDropdown();
    LoadUOMDropdown();
    LoadPaymentTermsDropdown();
    LoadBillToShipToDropdown();
    LoadSiteRepDropdown();
}

function LoadStatusDropdown() {
    PurchaseOrderStoreService.GetPOStoreStatusList().then(function (data) {
        let html = '<option value="0">-- All Status --</option>';
        if (data && data.length > 0) {
            data.forEach(s => { html += `<option value="${s.Code}">${s.Name}</option>`; });
        }
        $('#lstDdlStatus').html(html);
    }).catch(() => { $('#lstDdlStatus').html('<option value="">-- All Status --</option>'); });
}

function LoadVendorDropdown() {
    PurchaseOrderStoreService.GetVendorList().then(function (data) {
        G_VendorList = data || [];
        let html = '<option value="">-- Select Vendor --</option>';
        G_VendorList.forEach(v => { html += `<option value="${v.Code}">${v.Name}</option>`; });
        $('#frmDdlVendor').html(html);
    }).catch(() => { $('#frmDdlVendor').html('<option value="">-- Select Vendor --</option>'); });
}

function LoadWorkTypeDropdown() {
    PurchaseOrderStoreService.GetWorkTypeList().then(function (data) {
        let html = '<option value="">-- Select Work Type --</option>';
        if (data && data.length > 0) {
            data.forEach(w => { html += `<option value="${w.Code}">${w.Name}</option>`; });
        }
        $('#frmDdlWorkType').html(html);
    }).catch(() => { $('#frmDdlWorkType').html('<option value="">-- Select Work Type --</option>'); });
}

function LoadItemDropdown() {
    PurchaseOrderStoreService.GetItemList().then(function (data) {
        G_ItemMasterList = data || [];
    }).catch(() => { G_ItemMasterList = []; });
}

function LoadItemWithoutProjectList() {
    PurchaseOrderStoreService.GetItemListWithoutProject().then(function (data) {
        G_ItemWithoutProjectList = data || [];
    }).catch(() => { G_ItemWithoutProjectList = []; });
}

function LoadCompanyInfoDropdown(selectedCode) {
    PurchaseOrderStoreService.GetCompanyInfoList().then(function (data) {
        G_CompanyInfoList = data || [];
        let html = '<option value="">-- Select Company --</option>';
        G_CompanyInfoList.forEach(function (c) {
            const sel = selectedCode && c.Code == selectedCode ? 'selected' : '';
            html += `<option value="${c.Code}" ${sel}>${c.Name}</option>`;
        });
        $('#frmDdlCompanyInfo').html(html);
    }).catch(() => { $('#frmDdlCompanyInfo').html('<option value="">-- Select Company --</option>'); });
}

function LoadUOMDropdown() {
    PurchaseOrderStoreService.GetUOMList().then(function (data) {
        G_UOMMasterList = data || [];
    }).catch(() => { G_UOMMasterList = []; });
}

function LoadPaymentTermsDropdown(selectedCode) {
    PurchaseOrderStoreService.GetPaymentTermsList().then(function (data) {
        G_PaymentTermsList = data || [];
        let html = '<option value="">-- Select Payment Terms --</option>';
        G_PaymentTermsList.forEach(p => {
            const sel = selectedCode && p.Code == selectedCode ? 'selected' : '';
            html += `<option value="${p.Code}" ${sel}>${p.Name}</option>`;
        });
        $('#frmDdlPaymentTerms').html(html);
    }).catch(() => { $('#frmDdlPaymentTerms').html('<option value="">-- Select Payment Terms --</option>'); });
}

// ─── FILTERED ITEM LIST ──────────────────────────────────────────────────────

function GetFilteredItemList() {
    const againstProject = $('#frmChkAgainstProject').is(':checked');
    const workTypeCode   = parseInt($('#frmDdlWorkType').val()) || 0;

    if (!againstProject) {
        if (workTypeCode) {
            const workTypeName = $('#frmDdlWorkType option:selected').text().trim();
            return G_ItemWithoutProjectList.filter(i => i.WorkTypDesp === workTypeName);
        }
        return G_ItemWithoutProjectList;
    }

    const projectCode    = parseInt($('#frmDdlProject').val())    || 0;
    const subProjectCode = parseInt($('#frmDdlSubProject').val()) || 0;

    if (subProjectCode && workTypeCode) {
        return G_ItemMasterList.filter(i =>
            i.ProjectMaster_Code    == projectCode &&
            i.SubProjectMaster_Code == subProjectCode &&
            i.WorkTypeMaster_Code   == workTypeCode
        );
    }
    if (workTypeCode) {
        return G_ItemMasterList.filter(i => i.WorkTypeMaster_Code == workTypeCode);
    }
    return G_ItemMasterList;
}

function RefreshAllItemDropdowns() {
    const filtered = GetFilteredItemList();
    $('#tblPOItemsBody tr').each(function () {
        const rowId     = $(this).attr('id').replace('itemRow_', '');
        const currentVal = $(`#frmDdlItem_${rowId}`).val();
        let html = '<option value="">-- Select Item --</option>';
        filtered.forEach(i => {
            const sel = currentVal && i.Code == currentVal ? 'selected' : '';
            html += `<option value="${i.Code}" ${sel}>${i.Name}</option>`;
        });
        $(`#frmDdlItem_${rowId}`).html(html);
    });
}

// ─── ITEM SELECT HTML ────────────────────────────────────────────────────────

function BuildItemSelect(rowId, selectedCode) {
    let html = `<select id="frmDdlItem_${rowId}" class="form-control form-control-sm" onchange="OnItemChange(${rowId})">
        <option value="">-- Select Item --</option>`;
    GetFilteredItemList().forEach(i => {
        const sel = selectedCode && i.Code == selectedCode ? 'selected' : '';
        html += `<option value="${i.Code}" ${sel}>${i.Name}</option>`;
    });
    html += '</select>';
    return html;
}

function BuildUOMSelect(rowId, selectedCode) {
    let html = `<select id="frmDdlUOM_${rowId}" class="form-control form-control-sm">
        <option value="">UOM</option>`;
    G_UOMMasterList.forEach(u => {
        const sel = selectedCode && u.Code == selectedCode ? 'selected' : '';
        html += `<option value="${u.Code}" ${sel}>${u.Name}</option>`;
    });
    html += '</select>';
    return html;
}

// ─── TOGGLE PROJECT FIELDS ───────────────────────────────────────────────────

window.ToggleProjectFields = function () {
    const checked = $('#frmChkAgainstProject').is(':checked');
    if (checked) {
        $('#divProjectFields').slideDown(220);
        if (G_ProjectList.length === 0) LoadProjectDropdown();
    } else {
        $('#divProjectFields').slideUp(220);
        G_ProjectList = [];
        G_SubProjectList = [];
        $('#frmDdlProject').html('<option value="">-- Select Project --</option>');
        $('#frmDdlSubProject').html('<option value="">-- Select Sub Project --</option>');
        if (G_ItemWithoutProjectList.length === 0) LoadItemWithoutProjectList();
    }
    RefreshAllItemDropdowns();
};

function LoadProjectDropdown(selectedCode) {
    PurchaseOrderStoreService.GetProjectList().then(function (data) {
        G_ProjectList = data || [];
        let html = '<option value="">-- Select Project --</option>';
        G_ProjectList.forEach(p => {
            const sel = selectedCode && p.Code == selectedCode ? 'selected' : '';
            html += `<option value="${p.Code}" ${sel}>${p.Name}</option>`;
        });
        $('#frmDdlProject').html(html);
        if (selectedCode) {
            const proj = G_ProjectList.find(p => String(p.Code) === String(selectedCode));
            if (proj && proj.DataBaseLocation_Code) {
                $('#frmDdlCompanyInfo').val(proj.DataBaseLocation_Code);
            }
        }
    }).catch(() => { $('#frmDdlProject').html('<option value="">-- Select Project --</option>'); });
}

window.LoadSubProjects = function (selectedCode) {
    const projectCode = $('#frmDdlProject').val();
    if (!projectCode) {
        $('#frmDdlSubProject').html('<option value="">-- Select Sub Project --</option>');
        RefreshAllItemDropdowns();
        return;
    }
    const selectedProject = G_ProjectList.find(p => String(p.Code) === String(projectCode));
    if (selectedProject && selectedProject.DataBaseLocation_Code) {
        $('#frmDdlCompanyInfo').val(selectedProject.DataBaseLocation_Code);
    }
    PurchaseOrderStoreService.GetSubProjectList(projectCode).then(function (data) {
        G_SubProjectList = data || [];
        let html = '<option value="">-- Select Sub Project --</option>';
        G_SubProjectList.forEach(s => {
            const sel = selectedCode && s.Code == selectedCode ? 'selected' : '';
            html += `<option value="${s.Code}" ${sel}>${s.Name}</option>`;
        });
        $('#frmDdlSubProject').html(html);

        // Auto-set default Site Representative when user picks a Sub Project
        $('#frmDdlSubProject').off('change.siterepdefault').on('change.siterepdefault', function () {
            const subCode = $(this).val();
            const sub = G_SubProjectList.find(s => String(s.Code) === String(subCode));
            if (sub && sub.SiteRepresentativeMaster_Code) {
                if (G_SiteRepList.length > 0) {
                    if ($('#frmDdlSiteRep').data('select2')) {
                        $('#frmDdlSiteRep').val(sub.SiteRepresentativeMaster_Code).trigger('change');
                    } else {
                        $('#frmDdlSiteRep').val(sub.SiteRepresentativeMaster_Code);
                        ShowSiteRepDetails(sub.SiteRepresentativeMaster_Code);
                    }
                } else {
                    LoadSiteRepDropdown(sub.SiteRepresentativeMaster_Code);
                }
            }
        });

        RefreshAllItemDropdowns();
    }).catch(() => { $('#frmDdlSubProject').html('<option value="">-- Select Sub Project --</option>'); });
};

// ─── BILL TO / SHIP TO ───────────────────────────────────────────────────────

function LoadBillToShipToDropdown(billToCode, shipToCode) {
    PurchaseOrderStoreService.GetBillToShipToList().then(function (data) {
        G_BillToShipToList = data || [];
        PopulateBillShipDropdowns(billToCode, shipToCode);
    }).catch(() => {
        G_BillToShipToList = [];
        PopulateBillShipDropdowns(billToCode, shipToCode);
    });
}

function PopulateBillShipDropdowns(billToCode, shipToCode) {
    let opts = '<option value="">-- Select Address --</option>';
    G_BillToShipToList.forEach(a => {
        opts += `<option value="${a.Code}">${a.Name}</option>`;
    });

    if ($('#frmDdlBillTo').data('select2')) $('#frmDdlBillTo').select2('destroy');
    if ($('#frmDdlShipTo').data('select2')) $('#frmDdlShipTo').select2('destroy');

    $('#frmDdlBillTo').html(opts);
    $('#frmDdlShipTo').html(opts);

    if ($.fn.select2) {
        $('#frmDdlBillTo').select2({
            placeholder: '-- Select Bill To Address --',
            allowClear: true,
            width: '100%',
            dropdownParent: $('body')
        });
        $('#frmDdlShipTo').select2({
            placeholder: '-- Select Ship To Address --',
            allowClear: true,
            width: '100%',
            dropdownParent: $('body')
        });
        $('#frmDdlBillTo').off('change.bts').on('change.bts', function () {
            ShowAddressDetails('BillTo', $(this).val());
        });
        $('#frmDdlShipTo').off('change.bts').on('change.bts', function () {
            ShowAddressDetails('ShipTo', $(this).val());
        });
    }

    if (billToCode) { $('#frmDdlBillTo').val(billToCode).trigger('change'); }
    if (shipToCode) { $('#frmDdlShipTo').val(shipToCode).trigger('change'); }
}

function ShowAddressDetails(type, code) {
    const prefix = type === 'BillTo' ? 'billTo' : 'shipTo';
    const divId  = type === 'BillTo' ? '#divBillToAddress' : '#divShipToAddress';
    if (!code) { $(divId).hide(); return; }
    const addr = G_BillToShipToList.find(a => String(a.Code) === String(code));
    if (!addr)  { $(divId).hide(); return; }
    $(`#${prefix}Name`).text(addr.Name || '');
    $(`#${prefix}DisplayName`).text(addr.DisplayName || '');
    $(`#${prefix}Address`).text(addr.Address || '');
    $(`#${prefix}GSTNo`).text(addr.GSTNo || '');
    $(divId).show();
}

window.OpenAddAddressModal = function (type) {
    $('#addrModalType').val(type);
    $('#modalAddAddressTitle').text(type === 'BillTo' ? 'Add Bill To Address' : 'Add Ship To Address');
    $('#addrTxtName').val('');
    $('#addrTxtDisplayName').val('');
    $('#addrTxtAddress').val('');
    $('#addrTxtGSTNo').val('');
    $('#modalAddAddress').modal('show');
};

window.SaveBillToShipToAddress = function () {
    const name        = $('#addrTxtName').val().trim();
    const displayName = $('#addrTxtDisplayName').val().trim();
    const address     = $('#addrTxtAddress').val().trim();
    const gstNo       = $('#addrTxtGSTNo').val().trim();
    const type        = $('#addrModalType').val();

    if (!name)        { toastr.warning('Please enter Name.');         return; }
    if (!displayName) { toastr.warning('Please enter Display Name.'); return; }
    if (!address)     { toastr.warning('Please enter Address.');      return; }

    const payload = JSON.stringify({ Code:0, Addresses: [{ Name: name, DisplayName: displayName, Address: address, GSTNo: gstNo }]});

    PurchaseOrderStoreService.SaveBillToShipToAddress(payload).then(function (res) {
        if (res && res.Status === 'Y') {
            toastr.success(res.Msg || 'Address saved successfully.');
            $('#modalAddAddress').modal('hide');
            const newCode = res.Code || res.NewCode || null;
            LoadBillToShipToDropdown(
                type === 'BillTo'  ? (newCode || $('#frmDdlBillTo').val() || null)  : ($('#frmDdlBillTo').val() || null),
                type === 'ShipTo'  ? (newCode || $('#frmDdlShipTo').val() || null)  : ($('#frmDdlShipTo').val() || null)
            );
        } else {
            toastr.error(res ? res.Msg : 'Failed to save address.');
        }
    }).catch(err => {
        toastr.error('Error saving address.');
        console.error(err);
    });
};

// ─── SITE REPRESENTATIVE ──────────────────────────────────────────────────

function LoadSiteRepDropdown(selectedCode) {
    PurchaseOrderStoreService.GetSiteRepresentativeList().then(function (data) {
        G_SiteRepList = data || [];
        PopulateSiteRepDropdown(selectedCode);
    }).catch(function () {
        G_SiteRepList = [];
        PopulateSiteRepDropdown(selectedCode);
    });
}

function PopulateSiteRepDropdown(selectedCode) {
    let opts = '<option value="">-- Select Site Representative --</option>';
    G_SiteRepList.forEach(function (r) {
        opts += '<option value="' + r.Code + '">' + r.Name + '</option>';
    });
    if ($('#frmDdlSiteRep').data('select2')) $('#frmDdlSiteRep').select2('destroy');
    $('#frmDdlSiteRep').html(opts);
    if ($.fn.select2) {
        $('#frmDdlSiteRep').select2({
            placeholder: '-- Select Site Representative --',
            allowClear: true,
            width: '100%',
            dropdownParent: $('body')
        });
        $('#frmDdlSiteRep').off('change.srep').on('change.srep', function () {
            ShowSiteRepDetails($(this).val());
        });
    }
    if (selectedCode) { $('#frmDdlSiteRep').val(selectedCode).trigger('change'); }
}

function ShowSiteRepDetails(code) {
    if (!code) { $('#divSiteRepDetails').hide(); return; }
    const rep = G_SiteRepList.find(function (r) { return String(r.Code) === String(code); });
    if (!rep) { $('#divSiteRepDetails').hide(); return; }
    $('#siteRepName').text(rep.Name || '');
    $('#siteRepMobile').text(rep.Mobile || rep.MobileNo || '');
    $('#siteRepEmail').text(rep.Email || '');
    $('#divSiteRepDetails').show();
}

window.OpenAddSiteRepModal = function () {
    $('#siteRepTxtName').val('');
    $('#siteRepTxtMobile').val('');
    $('#siteRepTxtEmail').val('');
    $('#modalAddSiteRep').modal('show');
};

window.SaveSiteRepresentative = function () {
    const name   = $('#siteRepTxtName').val().trim();
    const mobile = $('#siteRepTxtMobile').val().trim();
    const email  = $('#siteRepTxtEmail').val().trim();
    if (!name) { toastr.warning('Please enter Name.'); return; }
    if (mobile && !/^[6-9]\d{9}$/.test(mobile)) {
        toastr.warning('Please enter a valid 10-digit Mobile No (starting with 6–9).');
        $('#siteRepTxtMobile').focus();
        return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        toastr.warning('Please enter a valid Email address.');
        $('#siteRepTxtEmail').focus();
        return;
    }
    const payload = JSON.stringify({Code: 0, siteRepresentatives: [{ Code: 0, Name: name, MobileNo: mobile, Email: email }]});
    PurchaseOrderStoreService.SaveSiteRepresentative(payload).then(function (res) {
        if (res && res.Status === 'Y') {
            toastr.success(res.Msg || 'Site Representative saved.');
            $('#modalAddSiteRep').modal('hide');
            const newCode = res.Code || res.NewCode || null;
            LoadSiteRepDropdown(newCode);
        } else {
            toastr.error(res ? res.Msg : 'Failed to save Site Representative.');
        }
    }).catch(function (err) {
        toastr.error('Error saving Site Representative.');
        console.error(err);
    });
};

// ─── PO LIST GRID ──────────────────────────────────────────────────

window.ShowPOListGrid = function () {
    const fromDate = $('#lstTxtFromDate').val();
    const toDate = $('#lstTxtToDate').val();
    const status = $('#lstDdlStatus').val();

    if (!fromDate || !toDate) {
        toastr.warning('Please select From Date and To Date.');
        return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
        toastr.warning('From Date cannot be greater than To Date.');
        return;
    }

    PurchaseOrderStoreService.GetPurchaseOrderStoreList(status, fromDate, toDate).then(function (data) {
        G_POStoreList = data || [];
        $('#statTotalPO').text(G_POStoreList.length || '—');
        const pendingCount  = G_POStoreList.filter(i => (i.Status || '').toLowerCase() === 'pending').length;
        const approvedCount = G_POStoreList.filter(i => (i.Status || '').toLowerCase() === 'approved').length;
        $('#statPendingPO').text(pendingCount  > 0 ? pendingCount  : '—');
        $('#statApprovedPO').text(approvedCount > 0 ? approvedCount : '—');
        if (G_POStoreList.length === 0) {
            $('#tblPOListHeader').html('');
            $('#tblPOListBody').html('<tr><td colspan="10" class="text-center text-muted py-4"><i class="fa fa-inbox fa-2x d-block mb-2 text-muted"></i>No records found for the selected period.</td></tr>');
            $('#paginator-tblPOList').html('');
            return;
        }
        const stringFilterColumn = ['PO No', 'Vendor', 'Status', 'Project Name', 'Sub Project Name','Work Type'];
        const numericFilterColumn = ['Total Amount'];
        const dateFilterColumn = ['PO Date'];
        const button = false;
        const showButtons = [];
        const hiddenColumns = ['Code'];
        const columnAlignment = { 'Total Amount': 'right', 'PO Date': 'center', 'PO No': 'center' };
        const TotalColumns = ['Total Amount'];
        const commaColumns = ['Total Amount'];

        const displayData = G_POStoreList.map(item => ({
            'Code': item.Code,
            'PO No': item.PONo || item.PO_No || '',
            'PO Date': FormatDateDisplay(item.PODate || item.PO_Date),
            'Vendor': item.VendorName || item.Vendor || '',
            'Ref No': item.RefNo || '',
            'Project Name': item.ProjectName,
            'Sub Project Name': item.SubProjectName,
            'Work Type': item.WorkType,
            'Total Amount': parseFloat(item.TotalPOAmount || item.Total_Amount || 0),
            'Status': item.Status || '',
            'Action': `<button class="btn btn-info icon-height mb-1" title="View" onclick="ViewPO('${item.Code}')"><i class="fa fa-eye"></i></button>
                       <button class="btn btn-warning icon-height mb-1 ms-1" title="Edit" onclick="OpenPOForm('Edit','${item.Code}')"><i class="fa fa-edit"></i></button>
                       <button class="btn btn-danger icon-height mb-1 ms-1" title="Delete" onclick="InitDeletePO('${item.Code}','${item.PONo || item.PO_No || ''}')"><i class="fa fa-trash"></i></button>
                       <button class="btn btn-secondary icon-height mb-1 ms-1" title="Print Preview" onclick="PrintPO('${item.Code}','preview')"><i class="fa fa-search-plus"></i></button>
                       <button class="btn btn-dark icon-height mb-1 ms-1" title="Print" onclick="PrintPO('${item.Code}','print')"><i class="fa fa-print"></i></button>
                       <button class="btn icon-height mb-1 ms-1" title="Attachments" style="background:${(item.HasAttach || '').toUpperCase() === 'Y' ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#0ea5e9,#0284c7)'};color:#fff;border:none;" onclick="openPOListAttachmentControl('${item.Code}','${item.PONo || item.PO_No || ''}','${(item.PODate || item.PO_Date || '').substring(0, 10)}')"><i class="fa fa-paperclip"></i></button>
                       ${(item.Status || '').toLowerCase() === 'approved' ? `<button class="btn icon-height mb-1 ms-1" style="background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border:none;" title="Cancel PO" onclick="InitCancelPO('${item.Code}','${item.PONo || item.PO_No || ''}')"><i class="fa fa-ban"></i></button>` : ''}
                       ${(item.Status || '').toLowerCase() === 'approved' ? `<button class="btn icon-height mb-1 ms-1" style="background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;border:none;" title="Send Email" onclick="SendMailPO('${item.Code}')"><i class="fa fa-envelope"></i></button>` : ''}`
        }));
        BizsolCustomFilterGrid.CreateDataTable('tblPOListHeader', 'tblPOListBody', displayData, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, [], hiddenColumns, columnAlignment, true, TotalColumns, null, commaColumns);
    }).catch(err => {
        toastr.error('Error loading PO list.');
        console.error(err);
    });
};

// ─── OPEN / CLOSE FORM ───────────────────────────────────────────────────────

window.OpenPOForm = function (mode, code) {
    const ModuleName = $('#ERPHeading').text().trim();
    const OptionName = mode;
    const ShowMsg = 'Y';
    const FinYear = BizSolHelperFunction.getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (respCheck) {
        if (respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg);
            return;
        }

        G_POStoreEditMode = mode;
        ResetPOForm();
        $('#divPOList').hide();
        $('#divPOForm').show();
        // Show floating save bar
        $('#poFloatBar').css('display', 'flex');
        SyncFloatBarMargin();
        // Update floating bar labels
        $('#floatPONo').text(mode === 'New' ? 'New PO' : 'Loading…');
        if (mode === 'Edit') {
            $('#floatModeBadge').text('EDIT').removeClass('bg-success').addClass('bg-warning text-dark');
        } else {
            $('#floatModeBadge').text('NEW').removeClass('bg-warning text-dark').addClass('bg-success');
        }
        if (mode === 'Edit' && code) {
            LoadPOForEdit(code);
        } else {
            $('#frmTxtPODate').val(FormatDateInput(new Date()));
            G_ItemRowCount = 0;
            if (IsMobile()) {
                RenderMobileItemCards();
            } else {
                AddItemRow();
            }
        }
    });
};

window.ClosePOForm = function () {
    $('#divPOForm').hide();
    $('#poFloatBar').hide();
    $('#divPOList').show();
    if (typeof window.ClearPendingAttachments_AttachmentControl === 'function') {
        window.ClearPendingAttachments_AttachmentControl();
    }
};

function ResetPOForm() {
    $('#frmHfCode').val('');
    $('#frmTxtPONo').val('');
    $('#frmTxtPODate').val('');
    $('#frmDdlVendor').val('');
    $('#frmTxtRefNo').val('');
    $('#frmTxtRefDate').val('');
    $('#frmDdlPaymentTerms').val('');
    $('#frmTxtRemarks').val('');
    $('#frmTxtTermsCondition').val('');
    $('#frmTxtScopeOfWork').val('');
    $('#frmChkAgainstProject').prop('checked', true);
    $('#divProjectFields').show();
    $('#frmDdlCompanyInfo').val('');
    G_SubProjectList = [];
    if (G_ProjectList.length === 0) LoadProjectDropdown();
    $('#frmDdlProject').html('<option value="">-- Select Project --</option>');
    $('#frmDdlSubProject').html('<option value="">-- Select Sub Project --</option>');
    $('#frmDdlWorkType').val('');
    $('#frmTxtOtherCharges1').val(0);
    $('#frmTxtOtherCharges2').val(0);
    $('#frmChkRoundOff').prop('checked', false);
    $('#tblPOItemsBody').html('');
    G_ItemRowCount = 0;
    UpdateSummary(0, 0, 0, 0, 0);
    if ($('#frmDdlBillTo').data('select2')) {
        $('#frmDdlBillTo').val(null).trigger('change');
        $('#frmDdlShipTo').val(null).trigger('change');
    } else {
        $('#frmDdlBillTo').val('');
        $('#frmDdlShipTo').val('');
    }
    $('#divBillToAddress').hide();
    $('#divShipToAddress').hide();
    if ($('#frmDdlSiteRep').data('select2')) {
        $('#frmDdlSiteRep').val(null).trigger('change');
    } else {
        $('#frmDdlSiteRep').val('');
    }
    $('#divSiteRepDetails').hide();
}

// ─── ADD / DELETE ITEM ROWS ──────────────────────────────────────────────────

window.AddItemRow = function (silent) {
    if (IsMobile() && !silent) {
        OpenMobileItemModal(null);
        return;
    }
    G_ItemRowCount++;
    const rowId = G_ItemRowCount;
    const itemSelect = BuildItemSelect(rowId, null);
    const uomSelect = BuildUOMSelect(rowId, null);
    const row = `<tr id="itemRow_${rowId}">
        <td class="text-center fw-bold">${rowId}</td>
        <td>${itemSelect}</td>
        <td><input type="text" id="frmTxtSpecification_${rowId}" class="form-control form-control-sm" placeholder="Specification…" /></td>
        <td>${uomSelect}</td>
        <td><input type="number" id="frmTxtGSTRate_${rowId}" class="form-control form-control-sm" value="0" min="0" max="100" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
        <td><input type="number" id="frmTxtQty_${rowId}" class="form-control form-control-sm" value="0" min="0" step="0.001" onchange="CalcRowValue(${rowId})" /></td>
        <td><input type="number" id="frmTxtRate_${rowId}" class="form-control form-control-sm" value="0" min="0" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
        <td><input type="number" id="frmTxtValue_${rowId}" class="form-control form-control-sm" value="0" readonly /></td>
        <td class="text-center">
            <input type="hidden" id="frmHfDetailCode_${rowId}" value="0" />
            <input type="hidden" id="frmHfBaseQty_${rowId}" value="0" />
            <input type="hidden" id="frmHfQtyTolerance_${rowId}" value="0" />
            <input type="hidden" id="frmHfBaseRate_${rowId}" value="0" />
            <input type="hidden" id="frmHfRateTolerance_${rowId}" value="0" />
            <button type="button" class="del-row-btn" title="Remove" onclick="DeleteItemRow(${rowId})"><i class="fa fa-times-circle"></i></button>
        </td>
    </tr>`;
    $('#tblPOItemsBody').append(row);
    RenumberRows();
};

window.DeleteItemRow = function (rowId) {
    if ($('#tblPOItemsBody tr').length <= 1) {
        toastr.warning('At least one item row is required.');
        return;
    }
    $(`#itemRow_${rowId}`).remove();
    RenumberRows();
    CalcTotals();
    if (IsMobile()) RenderMobileItemCards();
};

function RenumberRows() {
    $('#tblPOItemsBody tr').each(function (index) {
        $(this).find('td:first').text(index + 1);
    });
}

// ─── TOLERANCE HELPERS (temporarily disabled) ───────────────────────────────

/* TOLERANCE DISABLED
function GetRowToleranceInfo(rowId) {
    const baseQty  = parseFloat($(`#frmHfBaseQty_${rowId}`).val())       || 0;
    const qtyTol   = parseFloat($(`#frmHfQtyTolerance_${rowId}`).val())  || 0;
    const baseRate = parseFloat($(`#frmHfBaseRate_${rowId}`).val())      || 0;
    const rateTol  = parseFloat($(`#frmHfRateTolerance_${rowId}`).val()) || 0;
    // When baseQty > 0 and tolerance is 0, cap equals baseQty (no excess allowed)
    const maxQty   = baseQty  > 0 ? parseFloat((baseQty  * (1 + qtyTol  / 100)).toFixed(3)) : 0;
    const maxRate  = baseRate > 0 ? parseFloat((baseRate * (1 + rateTol / 100)).toFixed(2)) : 0;
    return { baseQty, qtyTol, baseRate, rateTol, maxQty, maxRate };
}

function ApplyToleranceToRow(rowId, item) {
    const againstProject = $('#frmChkAgainstProject').is(':checked');
    if (!againstProject) {
        $(`#frmHfBaseQty_${rowId}`).val(0);
        $(`#frmHfQtyTolerance_${rowId}`).val(0);
        $(`#frmHfBaseRate_${rowId}`).val(0);
        $(`#frmHfRateTolerance_${rowId}`).val(0);
        $(`#frmTxtQty_${rowId}`).removeAttr('title');
        $(`#frmTxtRate_${rowId}`).removeAttr('title');
        return;
    }
    const baseQty  = item ? (parseFloat(item.QtyRequired  || item.Qty          || 0)) : 0;
    const qtyTol   = item ? (parseFloat(item.QtyTolerance || item.Tolerance     || 0)) : 0;
    const baseRate = item ? (parseFloat(item.Rate         || item.EstimatedRate || 0)) : 0;
    const rateTol  = item ? (parseFloat(item.RateTolerance                      || 0)) : 0;

    $(`#frmHfBaseQty_${rowId}`).val(baseQty);
    $(`#frmHfQtyTolerance_${rowId}`).val(qtyTol);
    $(`#frmHfBaseRate_${rowId}`).val(baseRate);
    $(`#frmHfRateTolerance_${rowId}`).val(rateTol);

    // When base value > 0 and tolerance is 0, cap equals base value (no excess allowed)
    const maxQty  = baseQty  > 0 ? parseFloat((baseQty  * (1 + qtyTol  / 100)).toFixed(3)) : 0;
    const maxRate = baseRate > 0 ? parseFloat((baseRate * (1 + rateTol / 100)).toFixed(2)) : 0;

    if (maxQty  > 0) {
        const qtyTitle = qtyTol > 0 ? 'Max Qty (' + qtyTol + '% tolerance): ' + maxQty : 'Max Qty (no tolerance): ' + maxQty;
        $(`#frmTxtQty_${rowId}`).attr('title', qtyTitle);
    } else {
        $(`#frmTxtQty_${rowId}`).removeAttr('title');
    }
    if (maxRate > 0) {
        const rateTitle = rateTol > 0 ? 'Max Rate (' + rateTol + '% tolerance): ' + maxRate : 'Max Rate (no tolerance): ' + maxRate;
        $(`#frmTxtRate_${rowId}`).attr('title', rateTitle);
    } else {
        $(`#frmTxtRate_${rowId}`).removeAttr('title');
    }
}
TOLERANCE DISABLED */

window.OnItemChange = function (rowId) {
    const selectedCode = $(`#frmDdlItem_${rowId}`).val();
    const againstProject = $('#frmChkAgainstProject').is(':checked');
    const itemList = againstProject ? G_ItemMasterList : G_ItemWithoutProjectList;
    const item = itemList.find(i => String(i.Code) === String(selectedCode));
    if (item && item.UOM_Code) {
        $(`#frmDdlUOM_${rowId}`).val(item.UOM_Code);
    }
    if (item && item.GSTRate !== undefined) {
        $(`#frmTxtGSTRate_${rowId}`).val(item.GSTRate || 0);
    }
    $(`#frmTxtSpecification_${rowId}`).val(item ? (item.ItemSpecificationDesp || '') : '');
    // ApplyToleranceToRow(rowId, item || null); // TOLERANCE DISABLED
    CalcRowValue(rowId);
};

window.CalcRowValue = function (rowId) {
    const againstProject = $('#frmChkAgainstProject').is(':checked');
    let qty  = parseFloat($(`#frmTxtQty_${rowId}`).val())  || 0;
    let rate = parseFloat($(`#frmTxtRate_${rowId}`).val()) || 0;

    /* TOLERANCE DISABLED
    if (againstProject) {
        const tol = GetRowToleranceInfo(rowId);
        if (tol.maxQty > 0 && qty > tol.maxQty) {
            const qtyMsg = tol.qtyTol > 0
                ? 'Qty exceeds the ' + tol.qtyTol + '% tolerance. Maximum allowed Qty is ' + tol.maxQty + '.'
                : 'Qty cannot exceed the required Qty of ' + tol.maxQty + ' (no tolerance allowed).';
            toastr.warning(qtyMsg);
            qty = tol.maxQty;
            $(`#frmTxtQty_${rowId}`).val(qty);
        }
        if (tol.maxRate > 0 && rate > tol.maxRate) {
            const rateMsg = tol.rateTol > 0
                ? 'Rate exceeds the ' + tol.rateTol + '% tolerance. Maximum allowed Rate is ' + tol.maxRate + '.'
                : 'Rate cannot exceed the required Rate of ' + tol.maxRate + ' (no tolerance allowed).';
            toastr.warning(rateMsg);
            rate = tol.maxRate;
            $(`#frmTxtRate_${rowId}`).val(rate);
        }
    }
    TOLERANCE DISABLED */

    const value = qty * rate;
    $(`#frmTxtValue_${rowId}`).val(value.toFixed(2));
    CalcTotals();
};

// ─── CALCULATE TOTALS ────────────────────────────────────────────────────────

window.CalcTotals = function () {
    let taxableAmount = 0;
    let totalGST = 0;

    $('#tblPOItemsBody tr').each(function () {
        const rowId = $(this).attr('id').replace('itemRow_', '');
        const value = parseFloat($(`#frmTxtValue_${rowId}`).val()) || 0;
        const gstRate = parseFloat($(`#frmTxtGSTRate_${rowId}`).val()) || 0;
        taxableAmount += value;
        totalGST += value * gstRate / 100;
    });

    const otherCharges1 = parseFloat($('#frmTxtOtherCharges1').val()) || 0;
    const otherCharges2 = parseFloat($('#frmTxtOtherCharges2').val()) || 0;
    let totalPO = taxableAmount + totalGST + otherCharges1 + otherCharges2;

    let roundOff = 0;
    if ($('#frmChkRoundOff').is(':checked')) {
        const rounded = Math.round(totalPO);
        roundOff = rounded - totalPO;
        totalPO = rounded;
    }

    UpdateSummary(taxableAmount, totalGST, otherCharges1, otherCharges2, totalPO, roundOff);
};

function UpdateSummary(taxable, gst, other1, other2, total, roundOff) {
    $('#sumTaxableAmount').text(parseFloat(taxable || 0).toFixed(2));
    $('#sumTotalGST').text(parseFloat(gst || 0).toFixed(2));
    $('#sumRoundOff').text(parseFloat(roundOff || 0).toFixed(2));
    $('#sumTotalPOAmount').text(parseFloat(total || 0).toFixed(2));
}

// ─── SAVE PO ─────────────────────────────────────────────────────────────────

window.SavePO = function () {
    const poDate = $('#frmTxtPODate').val();
    const vendorCode = $('#frmDdlVendor').val();

    if (!poDate)     { toastr.warning('Please select PO Date.'); return; }
    if (!vendorCode) { toastr.warning('Please select Vendor.'); return; }
    if (!$('#frmDdlWorkType').val()) { toastr.warning('Please select Work Type.'); return; }
    if ($('#frmChkAgainstProject').is(':checked')) {
        if (!$('#frmDdlProject').val())    { toastr.warning('Please select Project.');     return; }
        if (!$('#frmDdlSubProject').val()) { toastr.warning('Please select Sub Project.'); return; }
    }

    const masterCode = parseInt($('#frmHfCode').val()) || 0;
    const agaistProject = $('#frmChkAgainstProject').is(':checked') ? 'Y' : 'N';
    const projectCode = agaistProject === 'Y' ? (parseInt($('#frmDdlProject').val()) || 0) : 0;
    const taxable = parseFloat($('#sumTaxableAmount').text()) || 0;
    const totalGST = parseFloat($('#sumTotalGST').text()) || 0;
    const totalPO = parseFloat($('#sumTotalPOAmount').text()) || 0;
    const freightAmt = parseFloat($('#frmTxtOtherCharges2').val()) || 0;
    const otherChargesAmt = parseFloat($('#frmTxtOtherCharges1').val()) || 0;

    const transactions = [];
    let itemValid = true;

    $('#tblPOItemsBody tr').each(function () {
        const rowId = $(this).attr('id').replace('itemRow_', '');
        const detailCode = parseInt($(`#frmHfDetailCode_${rowId}`).val()) || 0;
        const itemCode = parseInt($(`#frmDdlItem_${rowId}`).val()) || 0;
        const qty = parseFloat($(`#frmTxtQty_${rowId}`).val()) || 0;
        const rate = parseFloat($(`#frmTxtRate_${rowId}`).val()) || 0;
        const gstRate = parseFloat($(`#frmTxtGSTRate_${rowId}`).val()) || 0;
        const amount = parseFloat($(`#frmTxtValue_${rowId}`).val()) || 0;

        if (!itemCode) { toastr.warning('Please select item in all rows.'); itemValid = false; return false; }
        if (qty <= 0) { toastr.warning('Qty must be greater than 0 for all items.'); itemValid = false; return false; }
        /* TOLERANCE DISABLED
        if (agaistProject === 'Y') {
            const saveTol = GetRowToleranceInfo(rowId);
            if (saveTol.maxQty > 0 && qty > saveTol.maxQty) {
                const saveQtyMsg = saveTol.qtyTol > 0
                    ? 'Row ' + rowId + ': Qty ' + qty + ' exceeds the ' + saveTol.qtyTol + '% tolerance. Maximum allowed: ' + saveTol.maxQty + '.'
                    : 'Row ' + rowId + ': Qty ' + qty + ' cannot exceed the required Qty of ' + saveTol.maxQty + ' (no tolerance allowed).';
                toastr.warning(saveQtyMsg);
                itemValid = false; return false;
            }
            if (saveTol.maxRate > 0 && rate > saveTol.maxRate) {
                const saveRateMsg = saveTol.rateTol > 0
                    ? 'Row ' + rowId + ': Rate ' + rate + ' exceeds the ' + saveTol.rateTol + '% tolerance. Maximum allowed: ' + saveTol.maxRate + '.'
                    : 'Row ' + rowId + ': Rate ' + rate + ' cannot exceed the required Rate of ' + saveTol.maxRate + ' (no tolerance allowed).';
                toastr.warning(saveRateMsg);
                itemValid = false; return false;
            }
        }
        TOLERANCE DISABLED */

        transactions.push({
            code: detailCode,
            purchaseOrderMaster_Code: masterCode,
            itemMaster_Code: itemCode,
            itemSizeMaster_Code: 0,
            uomMaster_Code: parseInt($(`#frmDdlUOM_${rowId}`).val()) || 0,
            qtyMT: qty,
            qtyPC: 0,
            qtyMTRS: 0,
            rateUnit: '',
            rate: rate,
            amount: amount,
            status: '',
            gstRate: gstRate,
            gstAmount: parseFloat((amount * gstRate / 100).toFixed(2)),
            remark: '',
            projectMaster_Code: projectCode,
            specification: $(`#frmTxtSpecification_${rowId}`).val() || ''
        });
    });

    if (!itemValid || transactions.length === 0) {
        if (transactions.length === 0) toastr.warning('Please add at least one item.');
        return;
    }

    const payload = {
        code: masterCode,
        master: [{
            code: masterCode,
            poNo: 0,
            poDate: poDate,
            vendorMaster_Code: parseInt(vendorCode) || 0,
            refNo: $('#frmTxtRefNo').val(),
            refDate: $('#frmTxtRefDate').val() || null,
            paymentTermsMaster_Code: parseInt($('#frmDdlPaymentTerms').val()) || 0,
            totalAssValue: taxable,
            dutyRate: 0,
            dutyAmount: 0,
            cessRate: 0,
            cessAmount: 0,
            shCessRate: 0,
            shCessAmount: 0,
            taxRate: 0,
            taxAmount: totalGST,
            entryTaxRate: 0,
            entryTaxAmount: 0,
            freightAmount: freightAmt,
            otherChargesDesp: $('#frmTxtOtherChargesLbl1').val(),
            otherChargesAmount: otherChargesAmt,
            totalPOAmount: totalPO,
            remarks: $('#frmTxtTermsCondition').val(),
            poType: 'S',
            finYear: '',
            remarks1: $('#frmTxtRemarks').val(),
            deliveryRemark: $('#frmTxtScopeOfWork').val(),
            isPOAgainstProject: agaistProject,
            projectMaster_Code: projectCode,
            billingAddress: parseInt($('#frmDdlBillTo').val()) || 0,
            ShippingAdress: parseInt($('#frmDdlShipTo').val()) || 0,
            subProjectMaster_Code: agaistProject === 'Y' ? (parseInt($('#frmDdlSubProject').val()) || 0) : 0,
            workTypeMaster_Code: parseInt($('#frmDdlWorkType').val()) || 0,
            SiteRepresentativeMaster_Code: parseInt($('#frmDdlSiteRep').val()) || 0,
            DataBaseLocation_Code: parseInt($('#frmDdlCompanyInfo').val()) || 0
        }],
        transactions: transactions
    };

    PurchaseOrderStoreService.SavePurchaseOrderStore(JSON.stringify(payload)).then(async function (res) {
        if (res && res.Status === 'Y') {
            const savedPk = parseInt(res.Code ?? res.code ?? 0, 10) || 0;
            const poDate = $('#frmTxtPODate').val() || '';
            const poNo = parseInt($('#frmTxtPONo').val() || '0', 10) || 0;
            if (savedPk > 0 && typeof window.FlushPendingAttachments === 'function') {
                const flush = await window.FlushPendingAttachments(savedPk, 'PurchaseOrderMaster', poNo, poDate);
                if (flush && flush.failed > 0) {
                    toastr.warning(flush.uploaded + ' attachment(s) uploaded, ' + flush.failed + ' failed.');
                } else if (flush && flush.uploaded > 0) {
                    toastr.success(flush.uploaded + ' pending attachment(s) uploaded.');
                }
            }
            toastr.success(res.Msg || 'PO saved successfully.');
            ClosePOForm();
            ShowPOListGrid();
            LoadPOStatCounts();
        } else {
            toastr.error(res ? res.Msg : 'Failed to save PO.');
        }
    }).catch(err => {
        toastr.error('Error saving PO.');
        console.error(err);
    });
};

// ─── EDIT PO ──────────────────────────────────────────────────────────────────

function LoadPOForEdit(code) {
    PurchaseOrderStoreService.GetPurchaseOrderStoreById(code).then(function (res) {
        if (!res) { toastr.error('PO not found.'); ClosePOForm(); return; }

        const header = res[0][0];
        const details = res[1] || [];

        $('#frmHfCode').val(header.Code);
        $('#frmTxtPONo').val(header.PONo || '');
        $('#frmTxtPODate').val(FormatDateInput(new Date(header.PODate)));
        $('#frmDdlVendor').val(header.VendorMaster_Code);
        $('#frmTxtRefNo').val(header.RefNo || '');
        if (header.RefDate) $('#frmTxtRefDate').val(FormatDateInput(new Date(header.RefDate)));
        $('#frmDdlPaymentTerms').val(header.PaymentTermsMaster_Code || '');
        $('#frmTxtRemarks').val(header.Remarks1 || '');
        $('#frmTxtTermsCondition').val(header.Remarks || '');
        $('#frmTxtScopeOfWork').val(header.DeliveryRemark || '');

        const againstProject = (header.IsPOAgainstProject === 'Y');
        $('#frmChkAgainstProject').prop('checked', againstProject);
        $('#frmDdlWorkType').val(header.WorkTypeMaster_Code || '');
        $('#frmDdlCompanyInfo').val(header.DataBaseLocation_Code || '');

        // ── Bill To / Ship To ──────────────────────────────────────────────
        if (G_BillToShipToList.length > 0) {
            if (header.BillToAddress_Code) {
                $('#frmDdlBillTo').val(header.BillToAddress_Code).trigger('change');
            }
            if (header.ShipToAddress_Code) {
                $('#frmDdlShipTo').val(header.ShipToAddress_Code).trigger('change');
            }
        } else {
            LoadBillToShipToDropdown(header.BillToAddress_Code || null, header.ShipToAddress_Code || null);
        }

        if (againstProject) {
            $('#divProjectFields').show();
            LoadProjectDropdown(header.ProjectMaster_Code);
            PurchaseOrderStoreService.GetSubProjectList(header.ProjectMaster_Code).then(function (data) {
                G_SubProjectList = data || [];
                let html = '<option value="">-- Select Sub Project --</option>';
                G_SubProjectList.forEach(s => {
                    const sel = s.Code == header.SubProjectMaster_Code ? 'selected' : '';
                    html += `<option value="${s.Code}" ${sel}>${s.Name}</option>`;
                });
                $('#frmDdlSubProject').html(html);
            }).catch(() => {
                $('#frmDdlSubProject').html(`<option value="${header.SubProjectMaster_Code}" selected></option>`);
            });
        } else {
            $('#divProjectFields').hide();
        }
        // Update floating PO number
        $('#floatPONo').text(header.PONo || 'PO');
        $('#floatModeBadge').text('EDIT').removeClass('bg-success').addClass('bg-warning text-dark');

        $('#frmTxtOtherChargesLbl1').val(header.OtherChargesDesp || 'Other Charges');
        $('#frmTxtOtherCharges1').val(header.OtherChargesAmount || 0);
        $('#frmTxtOtherChargesLbl2').val('Freight');
        $('#frmTxtOtherCharges2').val(header.FreightAmount || 0);
        $('#frmChkRoundOff').prop('checked', header.IsRoundOff === 'Y');
        if (G_SiteRepList.length > 0) {
            if (header.SiteRepresentativeMaster_Code) {
                $('#frmDdlSiteRep').val(header.SiteRepresentativeMaster_Code).trigger('change');
            }
        } else {
            LoadSiteRepDropdown(header.SiteRepresentativeMaster_Code || null);
        }

        $('#tblPOItemsBody').html('');
        G_ItemRowCount = 0;

        details.forEach(function (det) {
            G_ItemRowCount++;
            const rowId = G_ItemRowCount;
            const itemSelect = BuildItemSelect(rowId, det.ItemMaster_Code);
            const uomSelect = BuildUOMSelect(rowId, det.UOMMaster_Code);
            const row = `<tr id="itemRow_${rowId}">
                <td class="text-center fw-bold">${rowId}</td>
                <td>${itemSelect}</td>
                <td><input type="text" id="frmTxtSpecification_${rowId}" class="form-control form-control-sm" placeholder="Specification…" value="${(det.Specification || '').replace(/"/g, '&quot;')}" /></td>
                <td>${uomSelect}</td>
                <td><input type="number" id="frmTxtGSTRate_${rowId}" class="form-control form-control-sm" value="${det.GSTRate || 0}" min="0" max="100" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
                <td><input type="number" id="frmTxtQty_${rowId}" class="form-control form-control-sm" value="${det.QtyMT || 0}" min="0" step="0.001" onchange="CalcRowValue(${rowId})" /></td>
                <td><input type="number" id="frmTxtRate_${rowId}" class="form-control form-control-sm" value="${det.Rate || 0}" min="0" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
                <td><input type="number" id="frmTxtValue_${rowId}" class="form-control form-control-sm" value="${det.Amount || 0}" readonly /></td>
                <td class="text-center">
                    <input type="hidden" id="frmHfDetailCode_${rowId}" value="${det.Code || 0}" />
                    <input type="hidden" id="frmHfBaseQty_${rowId}" value="0" />
                    <input type="hidden" id="frmHfQtyTolerance_${rowId}" value="0" />
                    <input type="hidden" id="frmHfBaseRate_${rowId}" value="0" />
                    <input type="hidden" id="frmHfRateTolerance_${rowId}" value="0" />
                    <button type="button" class="del-row-btn" title="Remove" onclick="DeleteItemRow(${rowId})"><i class="fa fa-times-circle"></i></button>
                </td>
            </tr>`;
            $('#tblPOItemsBody').append(row);
            // TOLERANCE DISABLED
            // const tolItem = G_ItemMasterList.find(i => String(i.Code) === String(det.ItemMaster_Code));
            // ApplyToleranceToRow(rowId, tolItem || null);
        });

        if (details.length === 0) AddItemRow(true);
        if (IsMobile()) RenderMobileItemCards();
        CalcTotals();
    }).catch(err => {
        toastr.error('Error loading PO details.');
        console.error(err);
    });
}

// ─── VIEW PO ──────────────────────────────────────────────────────────────────

function BuildApprovalFlowHTML(steps) {
    if (!steps || steps.length === 0) return '';
    let html = '';
    steps.forEach(function (step, idx) {
        const status   = (step.ApprovalStatus || '').trim().toLowerCase();
        const approved = status === 'approved';
        const rejected = status === 'rejected';

        // ── circle colours ────────────────────────────────────────────────────
        const circleBg  = approved ? '#1a9e5c' : rejected ? '#e53935' : '#e0e0e0';
        const circleBdr = approved ? '#1a9e5c' : rejected ? '#e53935' : '#bdbdbd';
        const circleIcon = rejected ? 'fa-times' : 'fa-check';
        const iconClr    = (approved || rejected) ? '#fff' : '#aaaaaa';

        // ── badge ─────────────────────────────────────────────────────────────
        const badgeBg  = approved ? '#d4f5e2' : rejected ? '#fde8e8' : '#f0f0f0';
        const badgeClr = approved ? '#1a9e5c' : rejected ? '#e53935' : '#aaaaaa';
        const badgeTxt = approved ? 'Approved' : rejected ? 'Rejected' : 'Pending';

        // ── approver name ─────────────────────────────────────────────────────
        const nameHtml = (approved || rejected) && step.ApproverName && step.ApproverName.trim() !== ''
            ? '<div style="font-size:10px;color:#333;font-weight:600;margin-top:4px;text-align:center;max-width:88px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + step.ApproverName + '">'
              + '<i class="fa fa-user" style="font-size:9px;margin-right:2px;color:' + circleBg + ';"></i>' + step.ApproverName
              + '</div>'
            : '';

        // ── approved / action date ────────────────────────────────────────────
        const dateStr  = ((approved || rejected) && step.ApprovedOn && step.ApprovedOn.trim() !== '') ? FormatDateDisplay(step.ApprovedOn) : '';
        const dateHtml = dateStr
            ? '<div style="font-size:10px;color:#888;margin-top:2px;text-align:center;white-space:nowrap;">'
              + '<i class="fa fa-calendar-check" style="font-size:9px;margin-right:2px;"></i>' + dateStr
              + '</div>'
            : '';

        // ── remarks ───────────────────────────────────────────────────────────
        const remarkHtml = step.Remarks && step.Remarks.trim() !== ''
            ? '<div style="font-size:10px;color:#666;margin-top:3px;text-align:center;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-style:italic;" title="' + step.Remarks + '">'
              + '<i class="fa fa-comment-dots" style="font-size:9px;margin-right:2px;color:#aaa;"></i>' + step.Remarks
              + '</div>'
            : '';

        html += '<div style="display:flex;flex-direction:column;align-items:center;min-width:80px;max-width:96px;">'
              + '<div style="width:44px;height:44px;border-radius:50%;background:' + circleBg + ';border:3px solid ' + circleBdr + ';display:flex;align-items:center;justify-content:center;">'
              + '<i class="fa ' + circleIcon + '" style="color:' + iconClr + ';font-size:14px;"></i>'
              + '</div>'
              + '<div style="font-size:12px;font-weight:600;color:#444;margin-top:7px;text-align:center;">' + step.LevelDesc + '</div>'
              + '<div style="background:' + badgeBg + ';color:' + badgeClr + ';font-size:11px;font-weight:600;padding:2px 10px;border-radius:12px;margin-top:4px;white-space:nowrap;">' + badgeTxt + '</div>'
              + nameHtml
              + dateHtml
              + remarkHtml
              + '</div>';
        if (idx < steps.length - 1) {
            html += '<div style="flex:1;border-top:2px dashed #bdbdbd;min-width:16px;margin-top:20px;"></div>';
        }
    });
    return '<div style="background:#f8fffe;border:1px solid #ddf0e8;border-radius:10px;padding:14px 20px;margin-bottom:16px;">'
         + '<div style="font-size:11px;font-weight:700;color:#667;letter-spacing:1.2px;margin-bottom:14px;">'
         + '<i class="fa fa-layer-group" style="color:#1a9e5c;margin-right:6px;"></i>APPROVAL FLOW'
         + '</div>'
         + '<div style="display:flex;align-items:flex-start;overflow-x:auto;padding-bottom:4px;">'
         + html
         + '</div>'
         + '</div>';
}

window.ViewPO = function (code) {
    const ModuleName = $('#ERPHeading').text().trim();
    const ShowMsg = 'Y';
    const FinYear = BizSolHelperFunction.getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, 'View', ShowMsg, FinYear).then(function (respCheck) {
        if (respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg);
            return;
        }

        PurchaseOrderStoreService.GetPurchaseOrderStoreById(code).then(function (res) {
            if (!res) { toastr.error('PO not found.'); return; }
            const header = res[0][0];
            const details = res[1] || [];
            const approvalFlow = res[2] || [];

            const vendorName = (G_VendorList.find(v => v.Code == header.VendorMaster_Code) || {}).Name || '';
            const paymentTermsName = (G_PaymentTermsList.find(p => p.Code == header.PaymentTermsMaster_Code) || {}).Name || '';
            const againstProject = header.IsPOAgainstProject === 'Y';
            const billToAddr = G_BillToShipToList.find(a => a.Code == header.BillToAddress_Code) || null;
            const shipToAddr = G_BillToShipToList.find(a => a.Code == header.ShipToAddress_Code) || null;

            let detailRows = '';
            details.forEach((det, idx) => {
                const itemName = (G_ItemMasterList.find(i => i.Code == det.ItemMaster_Code) || {}).Name || '';
                const uomName = (G_UOMMasterList.find(u => u.Code == det.UOMMaster_Code) || {}).Name || '';
                detailRows += `<tr>
                <td class="text-center">${idx + 1}</td>
                <td>${itemName}</td>
                <td>${det.Specification || ''}</td>
                <td class="text-center">${uomName}</td>
                <td class="text-center">${det.GSTRate || 0}%</td>
                <td class="text-end">${det.QtyMT || 0}</td>
                <td class="text-end">${parseFloat(det.Rate || 0).toFixed(2)}</td>
                <td class="text-end">${parseFloat(det.Amount || 0).toFixed(2)}</td>
            </tr>`;
            });

            const siteRepObj = G_SiteRepList.find(function (r) { return r.Code == header.SiteRepresentativeMaster_Code; }) || null;
            let siteRepViewHtml = '';
            if (siteRepObj) {
                const srMobile = siteRepObj.Mobile || siteRepObj.MobileNo || '';
                let sr = '<div class="row g-2 mt-1">';
                if (siteRepObj.Name) sr += '<div class="col-md-4" style="font-size:0.8rem;"><i class="fa fa-user me-1 text-muted"></i><b>Name:</b> ' + siteRepObj.Name + '</div>';
                if (srMobile) sr += '<div class="col-md-4" style="font-size:0.8rem;"><i class="fa fa-phone me-1 text-muted"></i><b>Mobile:</b> ' + srMobile + '</div>';
                if (siteRepObj.Email) sr += '<div class="col-md-4" style="font-size:0.8rem;"><i class="fa fa-envelope me-1 text-muted"></i><b>Email:</b> ' + siteRepObj.Email + '</div>';
                sr += '</div>';
                siteRepViewHtml = '<div class="row g-2 mb-3"><div class="col-12"><div class="bts-view-panel" style="border-color:#d1fae5;background:#f0fdf4;"><div class="bts-vp-title" style="color:#059669;"><i class="fa fa-user-tie me-1"></i>Site Representative</div>' + sr + '</div></div></div>';
            }

            $('#modalViewPOBody').html(`
            <div class="row g-2 mb-3">
                <div class="col-md-6">
                    <table class="table table-sm table-borderless">
                        <tr><td class="fw-bold" style="width:45%">PO Number</td><td>${header.PONo || ''}</td></tr>
                        <tr><td class="fw-bold">PO Date</td><td>${FormatDateDisplay(header.PODate)}</td></tr>
                        <tr><td class="fw-bold">Vendor</td><td>${vendorName}</td></tr>
                        <tr><td class="fw-bold">Ref No</td><td>${header.RefNo || '-'}</td></tr>
                        <tr><td class="fw-bold">Ref Date</td><td>${header.RefDate ? FormatDateDisplay(header.RefDate) : '-'}</td></tr>
                        <tr><td class="fw-bold">Payment Terms</td><td>${paymentTermsName || '-'}</td></tr>
                        <tr><td class="fw-bold">Remarks</td><td>${header.Remarks1 || '-'}</td></tr>
                        <tr><td class="fw-bold">Create By:</td><td>${header.CreatedByName || '-'}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <table class="table table-sm table-borderless">
                        <tr><td class="fw-bold" style="width:45%">Against Project</td><td>${againstProject ? 'Yes' : 'No'}</td></tr>
                        ${againstProject ? `<tr><td class="fw-bold">Project</td><td>${header.ProjectName || '-'}</td></tr>
                        <tr><td class="fw-bold">Sub Project</td><td>${header.SubProjectName || '-'}</td></tr>` : ''}
                        <tr><td class="fw-bold">Company Info</td><td>${header.CompanyInfo || '-'}</td></tr>
                        <tr><td class="fw-bold">Taxable Amount</td><td class="text-end">${parseFloat(header.TotalAssValue || 0).toFixed(2)}</td></tr>
                        <tr><td class="fw-bold">${header.OtherChargesDesp || 'Other Charges'}</td><td class="text-end">${parseFloat(header.OtherChargesAmount || 0).toFixed(2)}</td></tr>
                        <tr><td class="fw-bold">Freight</td><td class="text-end">${parseFloat(header.FreightAmount || 0).toFixed(2)}</td></tr>
                        <tr><td class="fw-bold">Total GST</td><td class="text-end">${parseFloat(header.TaxAmount || 0).toFixed(2)}</td></tr>
                        <tr><td class="fw-bold">Round Off</td><td class="text-end">${parseFloat(header.RoundOff || 0).toFixed(2)}</td></tr>
                        <tr style="background:#667eea;color:#fff;border-radius:6px;"><td class="fw-bold">Total PO Amount</td><td class="text-end fw-bold">${parseFloat(header.TotalPOAmount || 0).toFixed(2)}</td></tr>
                    </table>
                </div>
            </div>
            <div class="row g-2 mb-3">
                <div class="col-md-6">
                    <div class="bts-view-panel">
                        <div class="bts-vp-title"><i class="fa fa-file-invoice me-1"></i>Bill To</div>
                        ${billToAddr
                            ? `<div class="bts-vp-name">${billToAddr.Name}</div>
                               <div class="bts-vp-disp">${billToAddr.DisplayName}</div>
                               <div class="bts-vp-addr"><i class="fa fa-map-marker-alt me-1 text-muted" style="font-size:0.73rem;"></i>${billToAddr.Address}</div>
                               <div class="bts-vp-gst"><i class="fa fa-id-card me-1" style="font-size:0.73rem;"></i>GST: ${billToAddr.GSTNo}</div>`
                            : '<span style="color:#94a3b8;font-size:0.78rem;"><i class="fa fa-minus me-1"></i>Not specified</span>'}
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="bts-view-panel">
                        <div class="bts-vp-title"><i class="fa fa-shipping-fast me-1"></i>Ship To</div>
                        ${shipToAddr
                            ? `<div class="bts-vp-name">${shipToAddr.Name}</div>
                               <div class="bts-vp-disp">${shipToAddr.DisplayName}</div>
                               <div class="bts-vp-addr"><i class="fa fa-map-marker-alt me-1 text-muted" style="font-size:0.73rem;"></i>${shipToAddr.Address}</div>
                               <div class="bts-vp-gst"><i class="fa fa-id-card me-1" style="font-size:0.73rem;"></i>GST: ${shipToAddr.GSTNo}</div>`
                            : '<span style="color:#94a3b8;font-size:0.78rem;"><i class="fa fa-minus me-1"></i>Not specified</span>'}
                    </div>
                </div>
            </div>
            ${siteRepViewHtml}
            ${BuildApprovalFlowHTML(approvalFlow)}
            <div class="table-responsive">
                <table class="table table-sm table-bordered">
                    <thead style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;">
                        <tr>
                            <th class="text-center">#</th>
                            <th>Item Name</th>
                            <th>Specification</th>
                            <th class="text-center">UOM</th>
                            <th class="text-center">GST Rate</th>
                            <th class="text-end">Qty</th>
                            <th class="text-end">Rate</th>
                            <th class="text-end">Value</th>
                        </tr>
                    </thead>
                    <tbody>${detailRows}</tbody>
                </table>
            </div>
        `);
        $('#modalViewPO').modal('show');
        }).catch(err => {
            toastr.error('Error loading PO details.');
            console.error(err);
        });
    });
};

// ─── DELETE PO ────────────────────────────────────────────────────────────────

window.InitDeletePO = function (code, poNo) {
    $('#modalHfDeleteCode').val(code);
    $('#modalDeletePONo').text(poNo);
    $('#modalTxtDeleteReason').val('');
    $('#modalDeletePO').modal('show');
};

window.ConfirmDeletePO = function () {
    const code = $('#modalHfDeleteCode').val();
    const reason = $('#modalTxtDeleteReason').val().trim();
    if (!reason) { toastr.warning('Please enter reason for delete.'); return; }

    const ModuleName = $('#ERPHeading').text().trim();
    const ShowMsg = 'Y';
    const FinYear = BizSolHelperFunction.getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, 'Delete', ShowMsg, FinYear).then(function (respCheck) {
        if (respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg);
            return;
        }

        PurchaseOrderStoreService.DeletePurchaseOrderStore(code, GetUserCode(), reason).then(function (res) {
            if (res && res.Status === 'Y') {
                toastr.success(res.Msg || 'PO deleted successfully.');
                $('#modalDeletePO').modal('hide');
                ShowPOListGrid();
                LoadPOStatCounts();
            } else {
                toastr.error(res ? res.Msg : 'Failed to delete PO.');
            }
        }).catch(err => {
            toastr.error('Error deleting PO.');
            console.error(err);
        });
    });
};

// ─── CANCEL PO ───────────────────────────────────────────────────────────────

window.InitCancelPO = function (code, poNo) {
    $('#modalHfCancelCode').val(code);
    $('#modalCancelPONo').text(poNo);
    $('#modalCancelPO').modal('show');
};

window.ConfirmCancelPO = function () {
    const code = $('#modalHfCancelCode').val();

    const ModuleName = $('#ERPHeading').text().trim();
    const ShowMsg    = 'Y';
    const FinYear    = BizSolHelperFunction.getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, 'Cancel', ShowMsg, FinYear).then(function (respCheck) {
        if (respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg);
            return;
        }

        PurchaseOrderStoreService.CancelPurchaseOrderStore(code, GetUserCode()).then(function (res) {
            if (res && res.Status === 'Y') {
                toastr.success(res.Msg || 'PO cancelled successfully.');
                $('#modalCancelPO').modal('hide');
                ShowPOListGrid();
                LoadPOStatCounts();
            } else {
                toastr.error(res ? res.Msg : 'Failed to cancel PO.');
            }
        }).catch(function (err) {
            toastr.error('Error cancelling PO.');
            console.error(err);
        });
    });
};

// ─── MOBILE ITEM ENTRY MODAL ─────────────────────────────────────────────────

function OpenMobileItemModal(rowId) {
    G_MobileItemEditRowId = rowId;

    // Populate item dropdown
    const mobileItemList = GetFilteredItemList();
    const mobileAgainstProject = $('#frmChkAgainstProject').is(':checked');
    const mobileItemSrcList = mobileAgainstProject ? G_ItemMasterList : G_ItemWithoutProjectList;
    let itemHtml = '<option value="">-- Select Item --</option>';
    mobileItemList.forEach(i => { itemHtml += `<option value="${i.Code}">${i.Name}</option>`; });
    $('#mobileItemDdlItem').html(itemHtml);

    // Populate UOM dropdown
    let uomHtml = '<option value="">UOM</option>';
    G_UOMMasterList.forEach(u => { uomHtml += `<option value="${u.Code}">${u.Name}</option>`; });
    $('#mobileItemDdlUOM').html(uomHtml);

    // Auto-fill UOM and GST when item changes
    $('#mobileItemDdlItem').off('change').on('change', function () {
        const code = $(this).val();
        const item = mobileItemSrcList.find(i => String(i.Code) === String(code));
        if (item && item.UOM_Code) $('#mobileItemDdlUOM').val(item.UOM_Code);
        if (item && item.GSTRate !== undefined) $('#mobileItemTxtGST').val(item.GSTRate || 0);
        $('#mobileItemTxtSpec').val(item ? (item.ItemSpecificationDesp || '') : '');
        MobileCalcValue();
    });

    if (rowId === null) {
        // New item
        $('#mobileItemModalTitle').text('Add Item');
        $('#mobileItemModalBtnTxt').text('Add Item');
        $('#mobileItemDdlItem').val('');
        $('#mobileItemDdlUOM').val('');
        $('#mobileItemTxtGST').val(0);
        $('#mobileItemTxtQty').val(0);
        $('#mobileItemTxtRate').val(0);
        $('#mobileItemTxtSpec').val('');
        $('#mobileItemCalcValue').text('0.00');
    } else {
        // Edit existing row
        $('#mobileItemModalTitle').text('Edit Item');
        $('#mobileItemModalBtnTxt').text('Update Item');
        $('#mobileItemDdlItem').val($(`#frmDdlItem_${rowId}`).val());
        $('#mobileItemDdlUOM').val($(`#frmDdlUOM_${rowId}`).val());
        $('#mobileItemTxtGST').val($(`#frmTxtGSTRate_${rowId}`).val());
        $('#mobileItemTxtQty').val($(`#frmTxtQty_${rowId}`).val());
        $('#mobileItemTxtRate').val($(`#frmTxtRate_${rowId}`).val());
        $('#mobileItemTxtSpec').val($(`#frmTxtSpecification_${rowId}`).val());
        MobileCalcValue();
    }

    $('#modalMobileItemEntry').modal('show');
}

function MobileCalcValue() {
    const qty = parseFloat($('#mobileItemTxtQty').val()) || 0;
    const rate = parseFloat($('#mobileItemTxtRate').val()) || 0;
    $('#mobileItemCalcValue').text((qty * rate).toFixed(2));
}

function MobileItemModalConfirm() {
    const itemCode = $('#mobileItemDdlItem').val();
    const qty = parseFloat($('#mobileItemTxtQty').val()) || 0;

    if (!itemCode) { toastr.warning('Please select an item.'); return; }
    if (qty <= 0) { toastr.warning('Qty must be greater than 0.'); return; }

    // ── Tolerance validation (only applicable when Against Project is checked) ─
    if ($('#frmChkAgainstProject').is(':checked')) {
        const mobileItem = G_ItemMasterList.find(i => String(i.Code) === String(itemCode));
        if (mobileItem) {
            const mbBaseQty  = parseFloat(mobileItem.QtyRequired  || mobileItem.Qty          || 0);
            const mbQtyTol   = parseFloat(mobileItem.QtyTolerance || mobileItem.Tolerance     || 0);
            const mbBaseRate = parseFloat(mobileItem.Rate         || mobileItem.EstimatedRate || 0);
            const mbRateTol  = parseFloat(mobileItem.RateTolerance                             || 0);
            const mobileRate = parseFloat($('#mobileItemTxtRate').val()) || 0;
            const mbMaxQty   = (mbBaseQty  > 0 && mbQtyTol  > 0) ? parseFloat((mbBaseQty  * (1 + mbQtyTol  / 100)).toFixed(3)) : 0;
            const mbMaxRate  = (mbBaseRate > 0 && mbRateTol > 0) ? parseFloat((mbBaseRate * (1 + mbRateTol / 100)).toFixed(2)) : 0;
            if (mbMaxQty > 0 && qty > mbMaxQty) {
                toastr.warning(`Qty exceeds the ${mbQtyTol}% tolerance. Maximum allowed Qty is ${mbMaxQty}.`);
                $('#mobileItemTxtQty').val(mbMaxQty);
                MobileCalcValue();
                return;
            }
            if (mbMaxRate > 0 && mobileRate > mbMaxRate) {
                toastr.warning(`Rate exceeds the ${mbRateTol}% tolerance. Maximum allowed Rate is ${mbMaxRate}.`);
                $('#mobileItemTxtRate').val(mbMaxRate);
                MobileCalcValue();
                return;
            }
        }
    }

    const uomCode = $('#mobileItemDdlUOM').val();
    const gst = parseFloat($('#mobileItemTxtGST').val()) || 0;
    const rate = parseFloat($('#mobileItemTxtRate').val()) || 0;
    const value = (qty * rate).toFixed(2);
    const spec = $('#mobileItemTxtSpec').val() || '';

    if (G_MobileItemEditRowId === null) {
        // Add new row to the hidden table
        G_ItemRowCount++;
        const rowId = G_ItemRowCount;
        const itemSelect = BuildItemSelect(rowId, itemCode);
        const uomSelect = BuildUOMSelect(rowId, uomCode);
        const row = `<tr id="itemRow_${rowId}">
            <td class="text-center fw-bold">${rowId}</td>
            <td>${itemSelect}</td>
            <td><input type="text" id="frmTxtSpecification_${rowId}" class="form-control form-control-sm" placeholder="Specification…" value="${spec.replace(/"/g, '&quot;')}" /></td>
            <td>${uomSelect}</td>
            <td><input type="number" id="frmTxtGSTRate_${rowId}" class="form-control form-control-sm" value="${gst}" min="0" max="100" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
            <td><input type="number" id="frmTxtQty_${rowId}" class="form-control form-control-sm" value="${qty}" min="0" step="0.001" onchange="CalcRowValue(${rowId})" /></td>
            <td><input type="number" id="frmTxtRate_${rowId}" class="form-control form-control-sm" value="${rate}" min="0" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
            <td><input type="number" id="frmTxtValue_${rowId}" class="form-control form-control-sm" value="${value}" readonly /></td>
            <td class="text-center">
                <input type="hidden" id="frmHfDetailCode_${rowId}" value="0" />
                <input type="hidden" id="frmHfBaseQty_${rowId}" value="0" />
                <input type="hidden" id="frmHfQtyTolerance_${rowId}" value="0" />
                <input type="hidden" id="frmHfBaseRate_${rowId}" value="0" />
                <input type="hidden" id="frmHfRateTolerance_${rowId}" value="0" />
                <button type="button" class="del-row-btn" title="Remove" onclick="DeleteItemRow(${rowId})"><i class="fa fa-times-circle"></i></button>
            </td>
        </tr>`;
        $('#tblPOItemsBody').append(row);
        const newTolItem = G_ItemMasterList.find(i => String(i.Code) === String(itemCode));
        ApplyToleranceToRow(rowId, newTolItem || null);
        RenumberRows();
    } else {
        // Update existing row in the hidden table
        const rowId = G_MobileItemEditRowId;
        $(`#frmDdlItem_${rowId}`).val(itemCode);
        $(`#frmDdlUOM_${rowId}`).val(uomCode);
        $(`#frmTxtGSTRate_${rowId}`).val(gst);
        $(`#frmTxtQty_${rowId}`).val(qty);
        $(`#frmTxtRate_${rowId}`).val(rate);
        $(`#frmTxtValue_${rowId}`).val(value);
        $(`#frmTxtSpecification_${rowId}`).val(spec);
    }

    CalcTotals();
    RenderMobileItemCards();
    $('#modalMobileItemEntry').modal('hide');
}

function RenderMobileItemCards() {
    const container = $('#mobileItemCards');
    container.empty();

    const rows = $('#tblPOItemsBody tr');
    if (rows.length === 0) {
        container.html('<div class="mobile-item-empty"><i class="fa fa-box-open fa-2x d-block mb-2"></i>No items added yet.<br>Tap "+ Add Item" to start.</div>');
        return;
    }

    rows.each(function (index) {
        const rowId = $(this).attr('id').replace('itemRow_', '');
        const itemName = $(`#frmDdlItem_${rowId} option:selected`).text();
        const uomName = $(`#frmDdlUOM_${rowId} option:selected`).text();
        const gst = $(`#frmTxtGSTRate_${rowId}`).val();
        const qty = $(`#frmTxtQty_${rowId}`).val();
        const rate = parseFloat($(`#frmTxtRate_${rowId}`).val() || 0).toFixed(2);
        const value = parseFloat($(`#frmTxtValue_${rowId}`).val() || 0).toFixed(2);
        const spec = $(`#frmTxtSpecification_${rowId}`).val() || '';

        container.append(`
            <div class="mobile-item-card">
                <div class="item-card-header">
                    <span class="item-card-num">${index + 1}</span>
                    <span class="item-card-name">${itemName}</span>
                    <div class="item-card-actions">
                        <button type="button" class="item-card-edit-btn" onclick="OpenMobileItemModal(${rowId})" title="Edit"><i class="fa fa-pencil-alt"></i></button>
                        <button type="button" class="item-card-del-btn" onclick="DeleteItemRow(${rowId})" title="Delete"><i class="fa fa-trash"></i></button>
                    </div>
                </div>
                <div class="item-card-details">
                    <span class="item-card-detail"><i class="fa fa-ruler me-1"></i>${uomName}</span>
                    <span class="item-card-detail"><i class="fa fa-percent me-1"></i>GST: ${gst}%</span>
                    <span class="item-card-detail"><i class="fa fa-sort-amount-up me-1"></i>Qty: ${qty}</span>
                    <span class="item-card-detail"><i class="fa fa-tag me-1"></i>Rate: ${rate}</span>
                    <span class="item-card-detail item-card-value"><i class="fa fa-coins me-1"></i>Value: ${value}</span>
                    ${spec ? `<span class="item-card-detail" style="width:100%;"><i class="fa fa-align-left me-1"></i>${spec}</span>` : ''}
                </div>
            </div>`);
    });
}

// ─── PAYMENT TERMS QUICK-ADD ────────────────────────────────────────────────

window.OpenAddPaymentTermsModal = function () {
    
    $('#ptTxtDescription').val('');
    $('#modalAddPaymentTerms').modal('show');
};

window.SavePaymentTerms = function () {
    const Desp = $('#ptTxtDescription').val().trim();
    if (!Desp) { toastr.warning('Please enter Payment Terms Description.'); return; }

    const payload = JSON.stringify([
        {
            code: 0,
            desp: Desp,
            databaseLocation_Code: 0,
            advPaymentApplicable: "N",
            advancePayment: 0,
            defaultForOrder: "N",
            isActive: "Y",
            userMaster_Code: 0
        }
    ]);

    PurchaseOrderStoreService.SavePaymentTerms(payload).then(function (res) {
        if (res && res.Status === 'Y') {
            toastr.success(res.Msg || 'Payment Terms saved successfully.');
            $('#modalAddPaymentTerms').modal('hide');
            const newCode = res.Code || res.NewCode || null;
            LoadPaymentTermsDropdown(newCode);
        } else {
            toastr.error(res ? res.Msg : 'Failed to save Payment Terms.');
        }
    }).catch(err => {
        toastr.error('Error saving Payment Terms.');
        console.error(err);
    });
};

// ─── NUMBER TO WORDS ──────────────────────────────────────────────────────────

function NumberToWords(amount) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                  'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function twoD(n) {
        if (n < 20) return ones[n];
        return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    }
    function threeD(n) {
        if (n >= 100) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoD(n % 100) : '');
        return twoD(n);
    }
    let n = Math.floor(Math.abs(amount));
    if (n === 0) return 'Zero Rupees Only';
    let w = '';
    if (n >= 10000000) { w += threeD(Math.floor(n / 10000000)) + ' Crore ';    n %= 10000000; }
    if (n >= 100000)   { w += twoD(Math.floor(n / 100000))     + ' Lakh ';     n %= 100000;   }
    if (n >= 1000)     { w += twoD(Math.floor(n / 1000))       + ' Thousand '; n %= 1000;     }
    if (n >= 100)      { w += ones[Math.floor(n / 100)]         + ' Hundred ';  n %= 100;      }
    if (n > 0)         { w += twoD(n); }
    return w.trim() + ' Rupees Only';
}

// ─── FORMAT INDIAN CURRENCY ─────────────────────────────────────────────────────

function FormatIndianCurrency(num) {
    const n = parseFloat(num || 0);
    if (isNaN(n)) return '0.00';
    const parts = n.toFixed(2).split('.');
    const intPart = parts[0];
    const decPart = parts[1];
    const lastThree = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const formatted = remaining.length > 0
        ? remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
        : lastThree;
    return formatted + '.' + decPart;
}

// ─── PRINT PO ───────────────────────────────────────────────────────────────────

// ─── PRINT — options modal ────────────────────────────────────────────────────

function PrintPO(code, mode) {
    _printCode = code;
    _printMode = mode;
    // Reset checkbox to checked (default = include general T&C)
    const chk = document.getElementById('chkIncludeGeneralTerms');
    if (chk) chk.checked = true;
    const modal = new bootstrap.Modal(document.getElementById('modalPrintOptions'), { backdrop: 'static', keyboard: false });
    modal.show();
}

function ConfirmPrintPO() {
    const chk = document.getElementById('chkIncludeGeneralTerms');
    const includeTerms = chk ? chk.checked : true;
    bootstrap.Modal.getInstance(document.getElementById('modalPrintOptions'))?.hide();
    _DoPrintPO(_printCode, _printMode, includeTerms);
}

// ─── BUILD PO PRINT HTML (shared by Print and Send Mail) ────────────────────
// pdfOpts: { forPdfExport, mainOnly, termsOnly } — used by email PDF (html2canvas + jsPDF)

function _BuildPOPrintHTML(res, includeGeneralTerms, pdfOpts) {
        pdfOpts = pdfOpts || {};
        const forPdfExport = !!pdfOpts.forPdfExport;
        const mainOnly = !!pdfOpts.mainOnly;
        const termsOnly = !!pdfOpts.termsOnly;

        const header  = res[0][0];
        const details = res[1] || [];

        // ── PO is fully approved when header.Status === 'Approved' ───────────────
        const isPoApproved = (header.Status || '').trim().toLowerCase() === 'approved';

        // ── Resolve related data ──────────────────────────────────────────────────
        const vendorObj    = G_VendorList.find(v => v.Code == header.VendorMaster_Code) || {};
        const payTermsName = (G_PaymentTermsList.find(p => p.Code == header.PaymentTermsMaster_Code) || {}).Name || '';
        const billToAddr   = G_BillToShipToList.find(a => a.Code == header.BillToAddress_Code)  || null;
        const shipToAddr   = G_BillToShipToList.find(a => a.Code == header.ShipToAddress_Code)  || null;
        const againstProj  = header.IsPOAgainstProject === 'Y';
        const workTypeName = header.WorkType || header.WorkTypeName || '';
        const docTitle     = workTypeName.toLowerCase().includes('goods') ? 'PURCHASE ORDER' : 'WORK ORDER';

        // ── Company info from session ──────────────────────────────────────────
        let companyName = '', companyAliasName='', companyAddr = '', companyPhone = '', companyEmail = '', companyWeb = '', companyGST = '';
        try {
            //const ud = JSON.parse(sessionStorage.getItem('UserDetails') || '[]');
            const ud = res[3]||[];
            if (ud && ud[0]) {
                companyName  = ud[0].CompanyName    || ud[0].CompanyNameForShow || '';
                companyAliasName = ud[0].CompanyAliasName || '';
                companyAddr  = ud[0].CompanyAddress || '';
                companyPhone = ud[0].PhoneNo        || ud[0].CompanyPhone       || '';
                companyEmail = ud[0].Email          || ud[0].CompanyEmail       || '';
                companyWeb   = ud[0].Website        || ud[0].CompanyWebsite     || '';
                companyGST   = ud[0].GSTIN          || ud[0].CompanyGSTIN       || '';
            }
        } catch (e) {}

        // ── Vendor info ───────────────────────────────────────────────────────────────
        const vName    = vendorObj.Name             || '';
        const vAddr    = vendorObj.Address          || vendorObj.VendorAddress || '';
        const vGSTIN   = vendorObj.GSTIN            || vendorObj.GSTINNo       || '';
        const vEmail   = vendorObj.Email            || '';
        const vContact = vendorObj.ContactPerson    || vendorObj.ContactPersonName || '';
        const vMobile  = vendorObj.Mobile           || vendorObj.PhoneNo        || '';
        const vBank    = vendorObj.BankName         || '';
        const vAcc     = vendorObj.AccountNo        || vendorObj.AccountNumber  || '';
        const vIFSC    = vendorObj.IFSCCode         || vendorObj.IFSC           || '';

        // ── Amounts ──────────────────────────────────────────────────────────────────
        const taxable   = parseFloat(header.TotalAssValue      || 0);
        const freight   = parseFloat(header.FreightAmount      || 0);
        const otherChg  = parseFloat(header.OtherChargesAmount || 0);
        const otherLbl  = header.OtherChargesDesp || 'Other Charges';
        const totalGST  = parseFloat(header.TaxAmount          || 0);
        const grandTot  = parseFloat(header.TotalPOAmount      || 0);
        const roundOff  = parseFloat(header.RoundOff           || 0);
        const subTotal  = taxable + freight + otherChg;
        const amtWords  = NumberToWords(Math.round(grandTot));
        const poDateStr = FormatDateDisplay(header.PODate);
        const refDateStr = header.RefDate ? FormatDateDisplay(header.RefDate) : '';
        const gstRates  = [...new Set(details.map(d => parseFloat(d.GSTRate || 0)).filter(r => r > 0))];
        const gstLabel  = gstRates.length === 1 ? (gstRates[0] + '% GST') : 'Total GST';

        // ── Build HTML sections ───────────────────────────────────────────────
        let hdrContact = '';
        if (companyPhone) hdrContact += '&#9990;&nbsp;' + companyPhone + '<br>';
        if (companyEmail) hdrContact += '&#9993;&nbsp;' + companyEmail + '<br>';
        if (companyWeb)   hdrContact += '&#127760;&nbsp;' + companyWeb + '<br>';
        if (companyGST)   hdrContact += 'GSTIN:&nbsp;' + companyGST;

        let supplierHtml = '<div class="info-name">' + vName + '</div>';
        if (vAddr)    supplierHtml += '<div class="info-field"><b>ADDRESS : </b>' + vAddr    + '</div>';
        if (vGSTIN)   supplierHtml += '<div class="info-field"><b>GSTIN : </b>'   + vGSTIN   + '</div>';
        if (vEmail)   supplierHtml += '<div class="info-field"><b>Email : </b>'   + vEmail   + '</div>';
        if (vContact) supplierHtml += '<div class="info-field"><b>Contact Person: </b>' + vContact + '</div>';
        if (vMobile)  supplierHtml += '<div class="info-field"><b>Mobile : </b>'  + vMobile  + '</div>';
        if (vBank)    supplierHtml += '<div class="info-field"><b>Bank : </b>'    + vBank
            + (vAcc  ? ' &bull; A/C: ' + vAcc   : '')
            + (vIFSC ? ' &bull; IFSC: ' + vIFSC : '') + '</div>';

        let billToHtml = '<span style="color:#999;font-size:7.5pt;">Not specified</span>';
        if (billToAddr) {
            billToHtml = '<div class="info-name">' + (billToAddr.DisplayName || '') + '</div>';
           // if (billToAddr.DisplayName) billToHtml += '<div class="info-field">' + billToAddr.DisplayName + '</div>';
            if (billToAddr.Address)     billToHtml += '<div class="info-field"><b>ADDRESS : </b>' + billToAddr.Address + '</div>';
            if (billToAddr.GSTNo)       billToHtml += '<div class="info-field"><b>GSTIN: </b>' + billToAddr.GSTNo + '</div>';
        }

        let shipToSection = '';
        if (shipToAddr) {
            let st = '<div class="info-name">' + (shipToAddr.DisplayName || '') + '</div>';
            if (header.SubProjectName) st += '<div class="info-field"><b>Site Name : </b>' + header.SubProjectName + '</div>';
            if (shipToAddr.Address)     st += '<div class="info-field"><b>ADDRESS : </b>' + shipToAddr.Address + '</div>';
            if (shipToAddr.GSTNo)       st += '<div class="info-field"><b>GSTIN : </b>' + shipToAddr.GSTNo + '</div>';
            shipToSection = '<div class="info-row"><div class="info-cell full"><div class="info-label">Ship To :</div>' + st + '</div></div>';
        }

        const siteRepPrint = G_SiteRepList.find(function (r) { return r.Code == header.SiteRepresentativeMaster_Code; }) || null;
        let siteRepSection = '';
        const srName   = siteRepPrint ? (siteRepPrint.Name                              || '') : '';
        const srMobile = siteRepPrint ? (siteRepPrint.Mobile || siteRepPrint.MobileNo   || '') : '';
        const srEmail  = siteRepPrint ? (siteRepPrint.Email                              || '') : '';
        if (srName || srMobile || srEmail) {
            let sr = '';
            if (srName)   sr += '<span style="margin-right:14px;"><b>Name : </b>' + srName + '</span>';
            if (srMobile) sr += '<span style="margin-right:14px;"><b>Mobile : </b>' + srMobile + '</span>';
            if (srEmail)  sr += '<span><b>Email : </b>' + srEmail + '</span>';
            siteRepSection = '<div class="info-row"><div class="info-cell full"><div class="info-label">Site Representative :</div><div class="info-field" style="padding-top:2px;">' + sr + '</div></div></div>';
        }

        let itemRows = '';
        details.forEach(function (det, idx) {
            const itm     = G_ItemMasterList.find(i => i.Code == det.ItemMaster_Code) || {};
            const iName   = itm.Name || '';
            const hsnCode = itm.HSNCode || itm.HSN_Code || itm.HSNMaster_Code || '';
            const uName   = (G_UOMMasterList.find(u => u.Code == det.UOMMaster_Code) || {}).Name || '';
            const amt     = parseFloat(det.Amount || 0);
            const spec    = det.Specification || '';
            itemRows += '<tr>'
                + '<td class="tc">' + (idx + 1) + '</td>'
                + '<td>' + iName + (spec ? '<br><span style="font-size:7pt;color:#555;">' + spec + '</span>' : '') + '</td>'
                + '<td class="tc">' + hsnCode + '</td>'
                + '<td class="tc">' + uName   + '</td>'
                + '<td class="tr">' + parseFloat(det.QtyMT || 0) + '</td>'
                + '<td class="tr">&#8377;' + FormatIndianCurrency(det.Rate || 0) + '</td>'
                + '<td class="tr">&#8377;' + FormatIndianCurrency(amt) + '</td>'
                + '</tr>';
        });

        let totalsHtml = '';
        totalsHtml += '<tr><td class="lbl">Total Amount Before Tax</td><td class="val">&#8377; ' + FormatIndianCurrency(taxable)  + '</td></tr>';
        if (freight)  totalsHtml += '<tr><td class="lbl">Freight</td><td class="val">&#8377; ' + FormatIndianCurrency(freight)  + '</td></tr>';
        if (otherChg) totalsHtml += '<tr><td class="lbl">' + otherLbl + '</td><td class="val">&#8377; ' + FormatIndianCurrency(otherChg) + '</td></tr>';
        totalsHtml += '<tr><td class="lbl">Total Amount</td><td class="val">&#8377; ' + FormatIndianCurrency(subTotal) + '</td></tr>';
        totalsHtml += '<tr><td class="lbl">' + gstLabel + '</td><td class="val">&#8377; ' + FormatIndianCurrency(totalGST) + '</td></tr>';
        if (roundOff) totalsHtml += '<tr><td class="lbl">Round Off</td><td class="val">&#8377; ' + FormatIndianCurrency(roundOff) + '</td></tr>';
        totalsHtml += '<tr class="grand"><td class="lbl">Total</td><td class="val">&#8377; ' + FormatIndianCurrency(grandTot) + '</td></tr>';

        const ptHtml = payTermsName
            ? '<div class="pt-box"><b>Payment Terms :-</b><br>&bull;&nbsp;' + payTermsName + '</div>'
            : '';
        const termsHtml = header.Remarks
            ? '<div class="pt-box"><b>Terms &amp; Condition :-</b><br>' + (header.Remarks || '').replace(/\n/g, '<br>') + '</div>'
            : '';
        const scopeHtml = header.DeliveryRemark
            ? '<div class="pt-box"><b>Scope of Work :-</b><br>' + (header.DeliveryRemark || '').replace(/\n/g, '<br>') + '</div>'
            : '';

        // ── General Terms & Conditions (controlled by checkbox) ──────────────
        const isGoods = workTypeName.toLowerCase().includes('goods');
        const generalTermsText = isGoods ? PURCHASE_CONDITION : WORK_ORDER_CONDITION;

        function BuildGeneralTermsHTML(rawText) {
            // Patterns
            const headingRe  = /^(\d+[a-z]?\.\s+[A-Z].{2,}[:/]?\s*)$/;   // "1. Scope:"
            const listRe     = /^(\s*((\d+st|\d+nd|\d+rd|\d+th|[a-z]\.|[ivxlcdm]+\.|[A-Z]\.|[-\u2013\u2014\u2022*]|\(\w+\))\s+).{1,})/; // 1st / a. / i. / – / (a)
            const annexureRe = /^(Annexure\s+\d+)/i;

            const lines = rawText.split('\n');
            let out = '<div class="gtc-section">'
                    + '<div class="gtc-main-title">GENERAL TERMS &amp; CONDITIONS</div>';

            lines.forEach(function (raw) {
                const line = raw.trim();
                if (!line) return; // skip blank lines

                // ── Annexure title line ───────────────────────────────────────
                if (annexureRe.test(line)) {
                    out += '<div class="gtc-annexure-title">' + _esc(line) + '</div>';
                    return;
                }

                // ── Numbered section headings (e.g. "1. Scope:") ─────────────
                if (/^\d+[a-z]?\.\s+[A-Z]/.test(line) && line.length < 80) {
                    out += '<div class="gtc-heading">' + _esc(line) + '</div>';
                    return;
                }

                // ── Sub-list items deeply indented (raw leading spaces ≥ 8) ──
                if (raw.length > raw.trimStart().length + 7) {
                    out += '<div class="gtc-sublist">' + _esc(line) + '</div>';
                    return;
                }

                // ── List-style items (moderate indent or list marker) ─────────
                if ((raw.length > raw.trimStart().length + 3) || listRe.test(line)) {
                    out += '<div class="gtc-list">' + _esc(line) + '</div>';
                    return;
                }

                // ── Normal paragraph ──────────────────────────────────────────
                out += '<div class="gtc-para">' + _esc(line) + '</div>';
            });

            out += '</div>';
            return out;
        }

        function _esc(s) {
            return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        }

        let generalTermsHtml = '';
        if (termsOnly) {
            if (includeGeneralTerms) {
                generalTermsHtml = BuildGeneralTermsHTML(generalTermsText);
            }
        } else if (includeGeneralTerms && !mainOnly) {
            generalTermsHtml = BuildGeneralTermsHTML(generalTermsText);
        }

        let nowParts = [];
        if (againstProj && header.ProjectName)    nowParts.push(header.ProjectName);
        if (againstProj && header.SubProjectName) nowParts.push(header.SubProjectName);
        //const sectionBand = againstProj
        //    ? 'ASSIGNMENT DETAILS' + (nowParts.length ? ' &bull; '+ 'Nature of Work : ' + nowParts.join(' &mdash; ') : '')
        //    : 'ITEM DETAILS';

        const NatureOfWorkText = isGoods ? ' supply of material' : ' I & C'
        const sectionBand = againstProj
            ? '' + (nowParts.length ? ' &bull; Nature of Work :' + NatureOfWorkText + ' : ' + nowParts.join(' &mdash; ') : '')
            : 'ITEM DETAILS';

        // ── Compose full print document ──────────────────────────────────────────
        //const logoUrl = ((sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/')).replace(/\/?$/, '/')) + 'assets/images/logo-full.jpeg';
        const logoUrl  = ((sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/')).replace(/\/?$/, '/')) + 'assets/images/pppllog.jpeg';
        const _base = (sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/')).replace(/\/?$/, '/');
        const stampUrlHOD     = _base + 'assets/images/PPPL_Stamp_HOD.jpeg';
        const stampUrlCEO     = _base + 'assets/images/PPPL_Stamp_CEO.jpeg';
        const stampUrlFinance = _base + 'assets/images/PPPL_Stamp_Finance.jpeg';

        // ── Build one signature box — stamp shown when PO status is Approved ────
        function BuildSigBox(labelTitle, stampImgUrl) {
            const stampHtml = isPoApproved
                ? '<div class="sig-stamp-wrap">'
                  + '<img class="sig-stamp" src="' + stampImgUrl + '" alt="Approved">'
                  + '</div>'
                : '<div class="sig-stamp-wrap"></div>';
            return stampHtml + '<div class="sig-title">' + labelTitle + '</div>';
        }
        const showLogo = companyName.trim().toUpperCase() === 'PURSHOTAM PROFILES PVT.LTD.';
        const gtcCssOverride = termsOnly ? '.gtc-section{page-break-before:auto!important;}' : '';
        const css = '@page{size:A4 portrait;margin:8mm 10mm 10mm 10mm;}'
            + '*{box-sizing:border-box;margin:0;padding:0;}'
            + 'body{font-family:Arial,Helvetica,sans-serif;font-size:9pt;color:#000;background:#fff;}'
            + '.no-print{margin-bottom:5mm;}'
            + '@media print{.no-print{display:none!important;}}'
            + '.gtc-section{page-break-before:always;padding:6px 2px;font-size:8.5pt;color:#000;}'
            + '.gtc-main-title{text-align:center;font-size:11pt;font-weight:800;text-decoration:underline;letter-spacing:1.5px;margin-bottom:10px;margin-top:4px;}'
            + '.gtc-heading{font-weight:800;font-size:9pt;text-decoration:underline;margin:9px 0 3px;}'
            + '.gtc-para{text-align:justify;line-height:1.6;margin-bottom:4px;font-weight:600;}'
            + '.gtc-list{text-align:justify;line-height:1.6;margin-left:32px;margin-bottom:2px;font-weight:600;}'
            + '.gtc-sublist{text-align:justify;line-height:1.6;margin-left:56px;margin-bottom:2px;font-weight:600;}'
            + '.gtc-annexure-title{font-weight:800;font-size:9pt;margin:8px 0 3px;}'
            + '.gtc-table{width:100%;border-collapse:collapse;margin:4px 0 6px;}'
            + '.gtc-table th,.gtc-table td{border:1px solid #555;padding:3px 6px;font-size:8.5pt;font-weight:600;}'
            + '.gtc-table th{background:#f0f0f0;font-weight:800;text-align:center;}'
            + '.po-hdr{display:flex;align-items:flex-start;padding-bottom:5px;border-bottom:2.5px solid #000;margin-bottom:5px;}'
            + '.hdr-co{flex:1;}'
            + '.hdr-name{font-size:15pt;font-weight:800;color:#000;letter-spacing:0.3px;line-height:1.2;}'
            + '.hdr-tag{font-size:9pt;color:#000;letter-spacing:1px;margin-top:1px;font-weight:700;}'
            + '.hdr-contact{text-align:right;font-size:8pt;color:#000;line-height:1.75;min-width:155px;font-weight:600;}'
            + '.po-title{text-align:center;font-size:10pt;font-weight:800;border:2px solid #000;color:#000;padding:3px 0;margin:4px 0;letter-spacing:1.5px;}'
            + '.info-row{display:flex;border:1px solid #000;margin-bottom:4px;}'
            + '.info-cell{flex:1;padding:4px 7px;font-size:8.5pt;}'
            + '.info-cell+.info-cell{border-left:1px solid #000;}'
            + '.info-cell.full{flex:unset;width:100%;}'
            + '.info-label{font-weight:800;font-size:8pt;color:#000;border-bottom:1px dashed #555;padding-bottom:2px;margin-bottom:3px;}'
            + '.info-name{font-weight:800;font-size:9pt;margin-bottom:2px;color:#000;}'
            + '.info-field{font-size:8.5pt;margin-bottom:1px;color:#000;font-weight:600;}'
            + '.sec-band{border-top:2.5px solid #000;border-bottom:2.5px solid #000;font-weight:800;font-size:9.5pt;padding:4px 8px;margin:5px 0 4px;letter-spacing:0.6px;color:#000;text-transform:uppercase;}'
            + 'table.items{width:100%;border-collapse:collapse;}'
            + 'table.items th{background:#fff;color:#000;padding:5px;font-size:9pt;font-weight:800;border:1.5px solid #000;text-align:center;}'
            + 'table.items td{padding:4px 5px;font-size:9pt;color:#000;font-weight:600;border:1px solid #555;vertical-align:top;}'
            + 'table.items tbody tr:nth-child(even){background:#fff;}'
            + '.tc{text-align:center;}.tr{text-align:right;}'
            + '.tot-wrap{display:flex;justify-content:flex-end;margin-top:5px;}'
            + 'table.totals{border-collapse:collapse;min-width:290px;}'
            + 'table.totals td{padding:3px 8px;font-size:9pt;border:1px solid #555;color:#000;}'
            + 'table.totals .lbl{font-weight:700;color:#000;}'
            + 'table.totals .val{text-align:right;min-width:100px;font-weight:700;color:#000;}'
            + 'table.totals tr.grand td{border:1.5px solid #000;border-top:2px solid #000;font-weight:800;color:#000;}'
            + '.words-box{border:1.5px solid #555;padding:5px 9px;margin:5px 0;font-size:9pt;font-weight:600;color:#000;}'
            + '.pt-box{border:1.5px solid #555;padding:5px 9px;margin:5px 0;font-size:9pt;font-weight:600;color:#000;}'
            + '.sig-row{display:flex;gap:0;margin-top:12px;border:1.5px solid #000;}'
            + '.sig-box{flex:1;border-right:1.5px solid #000;display:flex;flex-direction:column;justify-content:flex-end;min-height:160px;min-width:0;}'
            + '.sig-box:last-child{border-right:none;}'
            + '.sig-title{font-weight:800;font-size:8.5pt;color:#000;text-align:center;padding:5px 4px;border-top:1.5px solid #000;letter-spacing:0.02em;}'
            + '.sig-name{font-size:7.5pt;color:#000;font-weight:600;}'
            + '.sig-stamp-wrap{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 4px 2px;}'
            + '.sig-stamp{width:100px;height:100px;object-fit:contain;display:block;margin:0 auto 4px;opacity:0.88;-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
            + '.sig-approved-name{font-size:7pt;font-weight:700;color:#1a7a45;text-align:center;padding:0 4px 1px;}'
            + '.sig-approved-date{font-size:6.5pt;color:#555;text-align:center;padding:0 4px 3px;font-weight:600;}'
            + '.page-wrap{width:100%;border-collapse:collapse;border-spacing:0;}'
            + '.page-footer-cell{padding:0;}'
            + '.page-body-cell{padding:0;vertical-align:top;}'
            + '.print-footer{width:100%;}'
            + '.print-footer-addr{text-align:center;font-family:Georgia,"Times New Roman",Times,serif;font-size:8.5pt;color:#6d7d92;line-height:1.45;padding:6px 8px 4px;}'
            + '.print-footer-strip{height:22px;width:100%;background:linear-gradient(102deg,#d4c6e6 0%,#d4c6e6 44.5%,#ffffff 44.5%,#ffffff 47.2%,#d8dce2 47.2%,#d8dce2 100%);-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
            + '.hdr-logo{width:65px;height:65px;object-fit:contain;margin-right:14px;flex-shrink:0;}'
            + '.hdr-left{display:flex;align-items:center;flex:1;}'
            + (showLogo ? '.wm-logo{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:320px;height:320px;background:url(' + logoUrl + ') no-repeat center;background-size:contain;opacity:0.07;pointer-events:none;z-index:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' : '')
            + (forPdfExport ? '.pdf-export-body{background:#fff;margin:0;padding:4px 8px;}.po-pdf-root{max-width:794px;margin:0 auto;}' : '')
            + gtcCssOverride

        const mainBlock = ''
            + '<div class="po-hdr">'
            + '<div class="hdr-left">' + (showLogo ? '<img class="hdr-logo" src="' + logoUrl + '" alt="Logo">' : '') + '<div class="hdr-co"><div class="hdr-name">' + (companyAliasName || 'COMPANY NAME') + '</div><div class="hdr-tag">OPTIMISING STRUCTURAL SOLUTIONS</div></div></div>'
            + '<div class="hdr-contact">' + hdrContact + '</div>'
            + '</div>'
            + '<div class="po-title">' + docTitle + '</div>'
            + '<div class="info-row">'
            + '<div class="info-cell">'
            + '<div class="info-field"><b>Date : </b>' + poDateStr + '</div>'
            + (refDateStr ? '<div class="info-field"><b>Ref Date : </b>' + refDateStr + '</div>' : '')
            + (header.RefNo ? '<div class="info-field"><b>Ref No : </b>' + (header.RefNo || '') + '</div>' : '')
            + '</div>'
            + '<div class="info-cell" style="text-align:right;">'
            + '<div class="info-field"><b>PO No : </b>' + (header.PONo || '') + '</div>'
            + (againstProj && header.ProjectName    ? '<div class="info-field"><b>Project : </b>' + header.ProjectName    + '</div>' : '')
            + (againstProj && header.SubProjectName ? '<div class="info-field"><b>Sub Project : </b>' + header.SubProjectName + '</div>' : '')
            + '</div></div>'
            + '<div class="info-row">'
            + '<div class="info-cell"><div class="info-label">Supplier Details :</div>' + supplierHtml + '</div>'
            + '<div class="info-cell"><div class="info-label">Bill To :</div>' + billToHtml + '</div>'
            + '</div>'
            + shipToSection
            + siteRepSection
            + '<div class="sec-band">' + sectionBand + '</div>'
            + '<table class="items"><thead><tr>'
            + '<th style="width:28px;">S.No</th>'
            + '<th>Description</th>'
            + '<th style="width:58px;">HSN Code</th>'
            + '<th style="width:50px;">Unit</th>'
            + '<th style="width:52px;">Qty</th>'
            + '<th style="width:72px;">Rate</th>'
            + '<th style="width:80px;">Amount</th>'
            + '</tr></thead><tbody>' + itemRows + '</tbody></table>'
            + '<div class="tot-wrap"><table class="totals"><tbody>' + totalsHtml + '</tbody></table></div>'
            + '<div class="words-box"><b>Amount in Word : </b>' + amtWords + '</div>'
            + ptHtml
            + (termsHtml || scopeHtml
                ? '<div style="margin:5px 0;">' + (termsHtml ? '<div>' + termsHtml + '</div>' : '') + (scopeHtml ? '<div>' + scopeHtml + '</div>' : '') + '</div>'
                : '')
            + '<div class="sig-row">'
            + '<div class="sig-box">' + BuildSigBox('Approved By HOD',     stampUrlHOD)     + '</div>'
            + '<div class="sig-box">' + BuildSigBox('Approved By COO',     stampUrlCEO)     + '</div>'
            + '<div class="sig-box">' + BuildSigBox('Approved By Finance', stampUrlFinance) + '</div>'
            + '</div>';

        const coreInner = termsOnly ? generalTermsHtml : (mainBlock + generalTermsHtml);
        const docPageTitle = termsOnly ? (docTitle + ' - General T&amp;C - ' + (header.PONo || '')) : (docTitle + ' - ' + (header.PONo || ''));

        let html;
        if (forPdfExport) {
            html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + docPageTitle + '</title><style>' + css + '</style></head><body class="pdf-export-body">'
                + (showLogo && !termsOnly ? '<div class="wm-logo"></div>' : '')
                + '<div class="po-pdf-root' + (termsOnly ? ' po-pdf-root-gtc' : '') + '">' + coreInner + '</div>'
                + '</body></html>';
        } else {
            html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + docPageTitle + '</title><style>' + css + '</style></head><body>'
                + '<div class="no-print" style="display:flex;gap:8px;padding:3px 0 6px;">'
                + '<button onclick="window.print()" style="background:#1a2a6c;color:#fff;border:none;padding:5px 16px;border-radius:5px;font-size:9pt;cursor:pointer;">&#128438;&nbsp;Print</button>'
                + '<button onclick="window.close()" style="background:#666;color:#fff;border:none;padding:5px 12px;border-radius:5px;font-size:9pt;cursor:pointer;">&#10005;&nbsp;Close</button>'
                + '</div>'
                + (showLogo ? '<div class="wm-logo"></div>' : '')
                + '<table class="page-wrap">'
                + '<tfoot><tr><td class="page-footer-cell">'
                + (companyAddr
                    ? '<div class="print-footer"><div class="print-footer-addr">&#9679;&nbsp;' + companyAddr + '</div><div class="print-footer-strip"></div></div>'
                    : '<div class="print-footer"><div class="print-footer-strip"></div></div>')
                + '</td></tr></tfoot>'
                + '<tbody><tr><td class="page-body-cell">' + coreInner + '</td></tr></tbody></table>'
                + '</body></html>';
        }

        return html;
}

function _DoPrintPO(code, mode, includeGeneralTerms) {
    PurchaseOrderStoreService.GetPurchaseOrderStoreById(code).then(function (res) {
        if (!res) { toastr.error('PO not found.'); return; }

        const html = _BuildPOPrintHTML(res, includeGeneralTerms);

        const win = window.open('', '_blank', 'width=920,height=760,scrollbars=yes,resizable=yes');
        if (!win) { toastr.warning('Please allow popups for this site to use the print feature.'); return; }
        win.document.write(html);
        win.document.close();
        if (mode === 'print') {
            setTimeout(function () { win.focus(); win.print(); }, 600);
        }
    }).catch(function (err) {
        toastr.error('Error loading PO for print.');
        console.error(err);
    });
}

// ─── EXPOSE GLOBALS ─────────────────────────────────────────────────────────

window.ShowPOListGrid = ShowPOListGrid;
window.OpenPOForm = OpenPOForm;
window.ClosePOForm = ClosePOForm;
window.NavigateToPOApproval = NavigateToPOApproval;
window.AddItemRow = AddItemRow;
window.DeleteItemRow = DeleteItemRow;
window.OnItemChange = OnItemChange;
window.CalcRowValue = CalcRowValue;
window.CalcTotals = CalcTotals;
window.SavePO = SavePO;
window.ViewPO = ViewPO;
window.InitDeletePO = InitDeletePO;
window.ConfirmDeletePO = ConfirmDeletePO;
window.LoadSubProjects = LoadSubProjects;
window.ToggleProjectFields = ToggleProjectFields;
window.OpenMobileItemModal = OpenMobileItemModal;
window.MobileCalcValue = MobileCalcValue;
window.MobileItemModalConfirm = MobileItemModalConfirm;
window.RefreshAllItemDropdowns = RefreshAllItemDropdowns;
window.PrintPO = PrintPO;
window.ConfirmPrintPO = ConfirmPrintPO;
window.InitCancelPO = InitCancelPO;
window.ConfirmCancelPO = ConfirmCancelPO;
window.OpenAddSiteRepModal = OpenAddSiteRepModal;
window.SaveSiteRepresentative = SaveSiteRepresentative;

// ══════════════════════════════════════════════════════════════════════════════
// ATTACHMENT CONTROL
// ══════════════════════════════════════════════════════════════════════════════

function InitAttachmentControl(masterTableName, masterTableCode, detailTableName, detailTableCode, entryNo, entryDate, mode, sourceDownloadFileName) {
    var url = `${sessionStorage.getItem('AppBaseURL')}/CustomControl/AttachmentControl`;
    $('#PurchaseOrderStore_AttachmentControlmodal').load(url, {
        MasterTableName: masterTableName,
        MasterTableCode: masterTableCode,
        DetailTableName: detailTableName,
        DetailTableCode: detailTableCode,
        EntryNo: entryNo,
        EntryDate: entryDate,
        Mode: mode,
        SourceDownloadFileName: sourceDownloadFileName || ''
    });
}

function openPOAttachmentControl() {
    const masterCode = parseInt($('#frmHfCode').val() || '0', 10) || 0;
    const poNo = parseInt($('#frmTxtPONo').val() || '0', 10) || 0;
    const poDate = $('#frmTxtPODate').val() || '';
    // masterCode=0 → temp/pending mode handled inside the shared control
    InitAttachmentControl('PurchaseOrderMaster', masterCode, '', 0, poNo, poDate, 'all', '');
}

function openPOListAttachmentControl(code, poNo, poDate) {
    const masterCode = parseInt(code, 10) || 0;
    if (masterCode <= 0) {
        toastr.warning('Invalid record. Cannot open attachments.');
        return;
    }
    InitAttachmentControl('PurchaseOrderMaster', masterCode, '', 0, parseInt(poNo, 10) || 0, poDate || '', 'all', '');
}

// --- SEND MAIL (Approved PO) — PDF via html2canvas + jsPDF (paged + footer) ---

function _poCompanyFooterText(res) {
    try {
        const ud = res[3] || [];
        if (ud && ud[0]) {
            return String(ud[0].CompanyAddress || '').trim();
        }
    } catch (e) {}
    return '';
}

function _waitForImagesInDoc(doc) {
    const imgs = Array.from(doc.getElementsByTagName('img'));
    const pending = imgs.filter(function (img) { return !img.complete; });
    return Promise.all(pending.map(function (img) {
        return new Promise(function (resolve) {
            img.onload = img.onerror = function () { resolve(); };
        });
    }));
}

function _drawPOPdfFooter(pdf, footerText) {
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const stripH = 5.5;
    const yStrip = pageH - stripH;
    if (footerText) {
        pdf.setFontSize(7.5);
        pdf.setTextColor(80, 95, 110);
        const lines = pdf.splitTextToSize('\u2022 ' + footerText, pageW - 20);
        const lh = 3.6;
        let ty = yStrip - 4 - (lines.length * lh);
        if (ty < 6) {
            ty = 6;
        }
        lines.forEach(function (line, i) {
            pdf.text(line, pageW / 2, ty + i * lh, { align: 'center' });
        });
    }
    pdf.setFillColor(212, 198, 230);
    pdf.rect(0, yStrip, pageW * 0.445, stripH, 'F');
    pdf.setFillColor(255, 255, 255);
    pdf.rect(pageW * 0.445, yStrip, pageW * 0.027, stripH, 'F');
    pdf.setFillColor(216, 220, 226);
    pdf.rect(pageW * 0.472, yStrip, pageW * 0.528, stripH, 'F');
}

/**
 * Renders one HTML document into the pdf as one or more A4 pages, drawing the footer on each page.
 * @param addPageBefore - if true, starts this chunk on a new page (used for General T&amp;C after PO body)
 */
async function _appendPoHtmlToPdf(pdf, htmlString, footerText, addPageBefore) {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:806px;height:1200px;border:none;visibility:hidden;pointer-events:none;';
    document.body.appendChild(iframe);
    try {
        const idoc = iframe.contentDocument;
        idoc.open();
        idoc.write(htmlString);
        idoc.close();
        await _waitForImagesInDoc(idoc);
        await new Promise(function (r) { setTimeout(r, 280); });
        const body = idoc.body;
        const scale = 2;
        const canvas = await html2canvas(body, {
            scale: scale,
            useCORS: true,
            allowTaint: true,
            logging: false,
            windowWidth: 794
        });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const margin = 8;
        const footerBand = 20;
        const usableH = pageH - margin * 2 - footerBand;
        const usableW = pageW - margin * 2;
        const imgWidthMm = usableW;
        const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

        if (addPageBefore && pdf.internal.getNumberOfPages() > 0) {
            pdf.addPage();
        }

        let offsetMm = 0;
        let isFirstSlice = true;
        while (offsetMm < imgHeightMm - 0.15) {
            if (!isFirstSlice) {
                pdf.addPage();
            }
            isFirstSlice = false;
            const sliceHeightMm = Math.min(usableH, imgHeightMm - offsetMm);
            const sliceHeightPx = (sliceHeightMm * canvas.width) / imgWidthMm;
            const offsetPx = (offsetMm * canvas.width) / imgWidthMm;

            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = Math.max(1, Math.ceil(sliceHeightPx));
            const ctx = sliceCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, offsetPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

            const imgData = sliceCanvas.toDataURL('image/jpeg', 0.92);
            pdf.addImage(imgData, 'JPEG', margin, margin, imgWidthMm, sliceHeightMm, undefined, 'FAST');
            _drawPOPdfFooter(pdf, footerText);

            offsetMm += sliceHeightMm;
        }
    } finally {
        iframe.parentNode.removeChild(iframe);
    }
}

async function _BuildPOPdfBase64Async(res, includeGeneralTerms) {
    const JsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!JsPDF || typeof html2canvas !== 'function') {
        throw new Error('jsPDF or html2canvas is not loaded');
    }
    const footerText = _poCompanyFooterText(res);
    const pdf = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const htmlMain = _BuildPOPrintHTML(res, includeGeneralTerms, { forPdfExport: true, mainOnly: true });
    await _appendPoHtmlToPdf(pdf, htmlMain, footerText, false);
    if (includeGeneralTerms) {
        const htmlGtc = _BuildPOPrintHTML(res, true, { forPdfExport: true, termsOnly: true });
        await _appendPoHtmlToPdf(pdf, htmlGtc, footerText, true);
    }
    const dataUri = pdf.output('datauristring');
    const c = dataUri.indexOf(',');
    return c >= 0 ? dataUri.substring(c + 1) : dataUri;
}

var _pendingMailCode = null;

window.SendMailPO = function (code) {
    _pendingMailCode = code;
    var chk = document.getElementById('chkMailIncludeGeneralTerms');
    if (chk) {
        chk.checked = false;
    }
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalSendEmailOptions')).show();
};

window.ConfirmSendMailPO = async function () {
    var code       = _pendingMailCode;
    var includeGTC = !!(document.getElementById('chkMailIncludeGeneralTerms') || {}).checked;
    var modalEl = document.getElementById('modalSendEmailOptions');
    var inst = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
    if (inst) {
        inst.hide();
    }
    var poItem     = G_POStoreList.find(function (i) { return String(i.Code) === String(code); });
    var vendor     = G_VendorList.find(function (v) { return poItem && v.Code == poItem.VendorMaster_Code; }) || {};
    var vendorEmail = vendor.Email || '';
    var poNo       = poItem ? (poItem.PONo || poItem.PO_No || '') : '';
    var poDateStr  = poItem ? FormatDateDisplay(poItem.PODate || poItem.PO_Date) : '';
    var fileName   = 'PO_' + (poNo || code).toString().replace(/\//g, '_') + '.pdf';
    toastr.info('Preparing PO PDF...', '', { timeOut: 0, extendedTimeOut: 0 });
    var $loadingToast = $('.toast-info:last');
    try {
        var res = await PurchaseOrderStoreService.GetPurchaseOrderStoreById(code);
        if (!res) { toastr.clear($loadingToast); toastr.error('PO not found.'); return; }
        var base64 = await _BuildPOPdfBase64Async(res, includeGTC);
        toastr.clear($loadingToast);
        EmailControl_Open({ to: vendorEmail, subject: 'Purchase Order #' + poNo + (poDateStr ? ' dated ' + poDateStr : ''), body: 'Dear Sir/Madam,\n\nPlease find attached the Purchase Order #' + poNo + (poDateStr ? ' dated ' + poDateStr : '') + '.\n\nKindly acknowledge receipt and confirm acceptance.\n\nRegards,', callBack: '', defaultAttachments: [{ FileName: fileName, FileBase64: base64, ContentType: 'application/pdf' }] });
    } catch (err) {
        toastr.clear($loadingToast);
        toastr.error('Error preparing PO PDF for email.');
        console.error(err);
    }
};

window.InitAttachmentControl = InitAttachmentControl;
window.openPOAttachmentControl = openPOAttachmentControl;
window.openPOListAttachmentControl = openPOListAttachmentControl;

// ── Vendor Master Modal ──────────────────────────────────────────────────────

function OpenVendorModal() {
    const baseUrl = sessionStorage.getItem('AppBaseURL') || '';
    document.getElementById('iframeVendorMaster').src = baseUrl + '/MarketingMasters/VendorMaster/VendorMaster?embedded=1&ModuleDesp=Vendor%20Master';
    var modal = new bootstrap.Modal(document.getElementById('modalAddVendor'), {
        backdrop: 'static',
        keyboard: false
    });
    modal.show();
}

// When vendor modal closes, reload vendor dropdown to pick up newly added vendor
document.getElementById('modalAddVendor').addEventListener('hidden.bs.modal', function () {
    document.getElementById('iframeVendorMaster').src = '';
    if (typeof LoadVendorDropdown === 'function') {
        LoadVendorDropdown();
    }
});

window.OpenVendorModal = OpenVendorModal;
window.SendMailPO = SendMailPO;

